const express = require('express');
const chokidar = require('chokidar');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const { spawn } = require('child_process');

const app = express();
const port = 3003;

// Define directories relative to the script location
const claudeInboxDir = path.join(__dirname, 'claude-inbox');
const geminiOutboxDir = path.join(__dirname, 'gemini-outbox');
const geminiNotificationsDir = path.join(__dirname, 'gemini-notifications');
const contextFile = path.join(__dirname, 'conversation-context.json');
const messageMetadataFile = path.join(__dirname, 'message-metadata.json');

// Conversation history (last 10 messages)
let conversationHistory = [];
const MAX_HISTORY = 10;

// Message metadata (pending/approved/rejected status and comments)
let messageMetadata = {};

/**
 * Load conversation history from file
 */
const loadContext = async () => {
    try {
        const data = await fs.readFile(contextFile, 'utf-8');
        conversationHistory = JSON.parse(data);
        console.log(`Loaded ${conversationHistory.length} messages from context`);
    } catch (err) {
        // File doesn't exist yet, start fresh
        conversationHistory = [];
    }
};

/**
 * Load message metadata from file
 */
const loadMetadata = async () => {
    try {
        const data = await fs.readFile(messageMetadataFile, 'utf-8');
        if (!data) { // Handle empty file
            console.log('Metadata file is empty, starting fresh.');
            messageMetadata = {};
            return;
        }
        try {
            messageMetadata = JSON.parse(data);
            console.log(`Loaded metadata for ${Object.keys(messageMetadata).length} messages`);
        } catch (parseErr) {
            console.error('Error parsing metadata JSON, starting fresh.', parseErr);
            messageMetadata = {}; // Start fresh if JSON is corrupt
        }
    } catch (err) {
        if (err.code === 'ENOENT') {
            // File doesn't exist yet, start fresh
            console.log('No metadata file found, starting fresh.');
            messageMetadata = {};
        } else {
            console.error('Error reading metadata file:', err);
        }
    }
};

/**
 * Save message metadata to file
 */
const saveMetadata = async () => {
    try {
        await fs.writeFile(messageMetadataFile, JSON.stringify(messageMetadata, null, 2));
    } catch (err) {
        console.error('Error saving metadata:', err);
    }
};

/**
 * Save conversation history to file
 */
const saveContext = async () => {
    try {
        await fs.writeFile(contextFile, JSON.stringify(conversationHistory, null, 2));
    } catch (err) {
        console.error('Error saving context:', err);
    }
};

/**
 * Add message to conversation history
 */
const addToHistory = async (from, content, metadata = {}) => {
    const message = {
        from,
        content,
        timestamp: new Date().toISOString(),
        ...metadata
    };

    conversationHistory.push(message);

    // Keep only last MAX_HISTORY messages
    if (conversationHistory.length > MAX_HISTORY) {
        conversationHistory = conversationHistory.slice(-MAX_HISTORY);
    }

    await saveContext();
};

/**
 * Format conversation history for Gemini
 */
const formatHistoryForGemini = () => {
    if (conversationHistory.length === 0) {
        return '';
    }

    let formatted = '\n\n=== CONVERSATION HISTORY (last 10 messages) ===\n\n';

    for (const msg of conversationHistory) {
        formatted += `[${msg.from.toUpperCase()}]: ${msg.content}\n\n`;
    }

    formatted += '=== END HISTORY ===\n\n';
    formatted += 'Current message:\n';

    return formatted;
};

/**
 * Ensures that the necessary communication directories exist.
 */
const ensureDirs = async () => {
    console.log('Ensuring communication directories exist...');
    await fs.mkdir(claudeInboxDir, { recursive: true });
    await fs.mkdir(geminiOutboxDir, { recursive: true });
    await fs.mkdir(geminiNotificationsDir, { recursive: true });
    console.log('Directories are ready.');
};

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// In-memory cache for messages
let messages = [];

/**
 * Loads all messages from the claude and gemini directories into memory with metadata.
 */
const loadMessages = async () => {
    console.log('--- Running loadMessages ---');
    try {
        const claudeFiles = (await fs.readdir(claudeInboxDir)).filter(f => f.endsWith('.txt'));
        console.log(`Found ${claudeFiles.length} files in claude-inbox.`);
        const geminiFiles = (await fs.readdir(geminiOutboxDir)).filter(f => f.endsWith('.txt'));
        console.log(`Found ${geminiFiles.length} files in gemini-outbox.`);

        const claudeMessages = await Promise.all(claudeFiles.map(async (file) => {
            const content = await fs.readFile(path.join(claudeInboxDir, file), 'utf-8');
            // All messages default to 'pending' - user must approve
            const metadata = messageMetadata[file] || { status: 'pending', comment: '' };
            return { from: 'claude', content, file, ...metadata };
        }));

        const geminiMessages = await Promise.all(geminiFiles.map(async (file) => {
            const content = await fs.readFile(path.join(geminiOutboxDir, file), 'utf-8');
            // All messages default to 'pending' - user must approve
            const metadata = messageMetadata[file] || { status: 'pending', comment: '' };
            return { from: 'gemini', content, file, ...metadata };
        }));

        messages = [...claudeMessages, ...geminiMessages].sort((a, b) => a.file.localeCompare(b.file));
        console.log(`Finished loadMessages. Total messages in memory: ${messages.length}`);
    } catch (error) {
        console.error('--- FATAL ERROR in loadMessages ---:', error);
    }
};

/**
 * Call Gemini CLI with optional context
 */
const callGemini = async (prompt, includeContext = false) => {
    return new Promise((resolve, reject) => {
        let fullPrompt = prompt;

        if (includeContext && conversationHistory.length > 0) {
            fullPrompt = formatHistoryForGemini() + prompt;
        }

        const geminiProcess = spawn('gemini', [fullPrompt]);

        let geminiResponse = '';
        let errorOutput = '';

        geminiProcess.stdout.on('data', (data) => {
            geminiResponse += data.toString();
        });

        geminiProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        geminiProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`Gemini CLI process exited with code ${code}`);
                console.error(`stderr: ${errorOutput}`);
                reject(new Error(`Gemini CLI failed: ${errorOutput}`));
            } else {
                resolve(geminiResponse.trim());
            }
        });

        geminiProcess.on('error', (err) => {
            console.error('Failed to start Gemini CLI process.', err);
            reject(err);
        });
    });
};

// Endpoint to get the current list of messages
app.get('/messages', (req, res) => {
    res.json(messages);
});

// Endpoint to get conversation context
app.get('/context', (req, res) => {
    res.json({ history: conversationHistory, count: conversationHistory.length });
});

// Endpoint to clear conversation context
app.post('/context/clear', async (req, res) => {
    conversationHistory = [];
    await saveContext();
    res.json({ message: 'Context cleared' });
});

// Endpoint to approve a message
app.post('/message/approve', async (req, res) => {
    const { file, comment = '' } = req.body;

    if (!file) {
        return res.status(400).json({ error: 'File name is required' });
    }

    try {
        messageMetadata[file] = {
            status: 'approved',
            comment,
            timestamp: new Date().toISOString(),
            reviewedBy: 'user'
        };

        await saveMetadata();
        await loadMessages(); // Reload messages with new metadata

        res.json({
            message: 'Message approved',
            file,
            metadata: messageMetadata[file]
        });
    } catch (error) {
        console.error('Error approving message:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to reject a message
app.post('/message/reject', async (req, res) => {
    const { file, comment = '' } = req.body;

    if (!file) {
        return res.status(400).json({ error: 'File name is required' });
    }

    try {
        messageMetadata[file] = {
            status: 'rejected',
            comment,
            timestamp: new Date().toISOString(),
            reviewedBy: 'user'
        };

        await saveMetadata();
        await loadMessages(); // Reload messages with new metadata

        res.json({
            message: 'Message rejected',
            file,
            metadata: messageMetadata[file]
        });
    } catch (error) {
        console.error('Error rejecting message:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to get message metadata
app.get('/message/metadata/:file', (req, res) => {
    const { file } = req.params;
    const metadata = messageMetadata[file] || { status: 'pending', comment: '' };
    res.json({ file, metadata });
});

// v1.0 endpoint - basic ask-gemini (backwards compatible)
app.post('/ask-gemini', async (req, res) => {
    const { question, includeContext = false } = req.body;

    if (!question) {
        return res.status(400).json({ error: 'Question is required' });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const questionFileName = `${timestamp}-claude.txt`;
    const questionFilePath = path.join(claudeInboxDir, questionFileName);

    try {
        // Save the question
        await fs.writeFile(questionFilePath, question);
        await addToHistory('user', question);

        // Call Gemini
        const geminiResponse = await callGemini(question, includeContext);

        // Save response
        const responseFileName = `${timestamp}-gemini.txt`;
        const responseFilePath = path.join(geminiOutboxDir, responseFileName);
        await fs.writeFile(responseFilePath, geminiResponse);
        await addToHistory('gemini', geminiResponse);

        res.json({ response: geminiResponse });

    } catch (error) {
        console.error('Error in ask-gemini:', error);
        res.status(500).json({ error: error.message });
    }
});

// v2.1 endpoint - ask-claude (Gemini asking Claude)
app.post('/ask-claude', async (req, res) => {
    const { question, includeContext = true } = req.body;

    if (!question) {
        return res.status(400).json({ error: 'Question is required' });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    try {
        // Add to history
        await addToHistory('gemini-user', question);

        // Format question with context for Claude
        let contextualQuestion = question;
        if (includeContext && conversationHistory.length > 0) {
            contextualQuestion = formatHistoryForGemini() + '\n' + question;
        }

        // For now, return a note that Claude needs manual invocation
        // In future: could integrate with Claude Code API or file-based prompts
        const response = {
            response: `[NOTE: This would be sent to Claude Code. Current limitation: Claude Code doesn't have an API endpoint for external questions. Workaround: Question saved to gemini-outbox, user can relay to Claude.]`,
            question: contextualQuestion,
            status: 'saved',
            file: `${timestamp}-gemini-to-claude.txt`
        };

        // Save question for user to relay
        const questionFile = path.join(geminiOutboxDir, `${timestamp}-gemini-to-claude.txt`);
        await fs.writeFile(questionFile, `GEMINI ASKS CLAUDE:\n\n${contextualQuestion}`);

        console.log('[ASK-CLAUDE] Question saved for relay');

        res.json(response);

    } catch (error) {
        console.error('Error in ask-claude:', error);
        res.status(500).json({ error: error.message });
    }
});

// v2.0 endpoint - hybrid communication with triggers
app.post('/communicate', async (req, res) => {
    const { message, mode = 'claude', metadata = {} } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    try {
        // Add user message to history
        await addToHistory('user', message, { mode });

        // Detect mode from message content if not specified
        let detectedMode = mode;
        if (message.startsWith('discuss:') || message.startsWith('both:')) {
            detectedMode = 'both';
        } else if (message.startsWith('ask gemini:')) {
            detectedMode = 'gemini';
        } else if (message.includes('@gemini')) {
            detectedMode = 'mention-gemini';
        } else if (message.includes('@claude')) {
            detectedMode = 'mention-claude';
        }

        console.log(`[COMMUNICATE] Mode: ${detectedMode}`);

        const result = { mode: detectedMode, responses: {} };

        // Handle different communication modes
        switch (detectedMode) {
            case 'both':
            case 'discuss':
                // Send to both AIs
                const cleanMessage = message.replace(/^(discuss:|both:)\s*/, '');

                // Call Gemini with context
                console.log('[BOTH] Calling Gemini with context...');
                const geminiResponse = await callGemini(cleanMessage, true);
                await addToHistory('gemini', geminiResponse);

                // Save Gemini response
                const geminiFile = `${timestamp}-gemini-discuss.txt`;
                await fs.writeFile(path.join(geminiOutboxDir, geminiFile), geminiResponse);

                result.responses.gemini = geminiResponse;
                result.responses.claude = '(Claude will respond via hook)';

                console.log('[BOTH] Gemini responded');
                break;

            case 'gemini':
            case 'ask gemini':
                // Send only to Gemini
                const question = message.replace(/^ask gemini:\s*/i, '');
                console.log('[GEMINI] Calling Gemini...');

                const answer = await callGemini(question, true);
                await addToHistory('gemini', answer);

                const answerFile = `${timestamp}-gemini.txt`;
                await fs.writeFile(path.join(geminiOutboxDir, answerFile), answer);

                result.responses.gemini = answer;
                console.log('[GEMINI] Response received');
                break;

            case 'mention-gemini':
                // Extract @gemini mention and context
                const mentionMatch = message.match(/@gemini\s+(.+)/);
                if (mentionMatch) {
                    const mentionMessage = mentionMatch[1];
                    console.log('[MENTION] Calling Gemini with mention...');

                    const mentionResponse = await callGemini(mentionMessage, true);
                    await addToHistory('gemini', mentionResponse);

                    const mentionFile = `${timestamp}-gemini-mention.txt`;
                    await fs.writeFile(path.join(geminiOutboxDir, mentionFile), mentionResponse);

                    result.responses.gemini = mentionResponse;
                    console.log('[MENTION] Gemini responded to mention');
                }
                break;

            case 'claude':
            default:
                // Default: message goes to Claude only (via hook)
                await addToHistory('claude', '(Processing via Claude Code)');
                result.responses.claude = 'Processing via Claude Code hook';
                break;
        }

        res.json(result);

    } catch (error) {
        console.error('Error in communicate:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Creates the main HTML file for the web interface with enhanced message filtering and approval.
 */
const createHtmlFile = async () => {
    const htmlPath = path.join(__dirname, 'index.html');
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI-AI Bridge v2.1 - Enhanced</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; flex-direction: column; height: 100vh; margin: 0; background-color: #f4f4f9; }
        h1 { text-align: center; color: #333; margin: 0.5em; font-size: 1.5em; }
        .subtitle { text-align: center; color: #666; margin: -0.5em 0 1em 0; font-size: 0.9em; }

        /* Single unified view layout */
        .main-content { display: flex; flex: 1; overflow: hidden; }
        .messages-panel { flex: 1; overflow-y: auto; padding: 1em; }

        /* Message styles */
        .message { border: 1px solid #ccc; padding: 1em; margin-bottom: 1em; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); position: relative; }
        .message.claude { background-color: #eef8ff; border-left: 4px solid #0066cc; }
        .message.gemini { background-color: #fff5f8; border-left: 4px solid #cc0066; }
        .message.user { background-color: #f0f0f0; border-left: 4px solid #666; }
        .message.pending { background-color: #fffbe6; border-left: 4px solid #ffa500; }
        .message.rejected { background-color: #ffebee; border-left: 4px solid #ef4444; opacity: 0.7; }
        .message-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5em; }
        h3 { margin: 0; font-size: 0.9em; color: #555; }
        .timestamp { font-size: 0.75em; color: #999; }
        pre { white-space: pre-wrap; word-wrap: break-word; font-size: 0.9em; color: #333; margin: 0.5em 0 0 0; }
        .summary { font-style: italic; color: #666; margin-top: 0.5em; padding: 0.5em; background: rgba(255,255,255,0.5); border-radius: 4px; font-size: 0.85em; }

        /* Action buttons inline */
        .message-actions { margin-top: 1em; padding-top: 1em; border-top: 1px solid #ddd; display: flex; gap: 0.5em; align-items: center; }
        .message-actions textarea { flex: 1; min-height: 40px; padding: 0.5em; border: 1px solid #ddd; border-radius: 4px; font-size: 0.85em; }
        .message-actions button { padding: 0.5em 1em; white-space: nowrap; }

        /* Review panel */
        .review-header { font-weight: bold; margin-bottom: 1em; padding-bottom: 0.5em; border-bottom: 2px solid #ddd; }
        .pending-message { background: #fffbe6; padding: 1em; border-radius: 8px; margin-bottom: 1em; border: 1px solid #ffa500; }
        .pending-message h4 { margin: 0 0 0.5em 0; color: #d97706; }
        .pending-content { background: white; padding: 0.75em; border-radius: 4px; margin: 0.5em 0; max-height: 150px; overflow-y: auto; font-size: 0.85em; }

        /* Comment box */
        .comment-section { margin: 1em 0; }
        .comment-section label { display: block; margin-bottom: 0.5em; font-weight: 500; }
        .comment-section textarea { width: 100%; min-height: 80px; padding: 0.5em; border: 1px solid #ddd; border-radius: 4px; font-family: inherit; resize: vertical; }

        /* Action buttons */
        .actions { display: flex; gap: 0.5em; margin-top: 1em; }
        button { padding: 0.5em 1em; cursor: pointer; border: none; border-radius: 4px; font-weight: 500; transition: all 0.2s; }
        button.approve { background: #10b981; color: white; flex: 1; }
        button.approve:hover { background: #059669; }
        button.reject { background: #ef4444; color: white; flex: 1; }
        button.reject:hover { background: #dc2626; }
        button.neutral { background: #6b7280; color: white; }
        button.neutral:hover { background: #4b5563; }

        /* Controls */
        .controls { padding: 1em; border-top: 1px solid #ddd; background: #fff; display: flex; justify-content: space-between; align-items: center; }
        .controls-left { display: flex; gap: 0.5em; align-items: center; }
        .controls-right { font-size: 0.85em; color: #666; }

        /* Filter badges */
        .filter-badge { display: inline-block; padding: 0.25em 0.5em; margin-left: 0.5em; border-radius: 12px; font-size: 0.75em; font-weight: bold; }
        .filter-badge.pending { background: #ffa500; color: white; }
        .filter-badge.all { background: #6b7280; color: white; }

        /* Empty state */
        .empty-state { text-align: center; padding: 2em; color: #999; }
    </style>
</head>
<body>
    <h1>AI-AI Communication Bridge v2.1 <span class="subtitle">Enhanced Message Review</span></h1>

    <div class="main-content">
        <!-- Unified Messages Panel -->
        <div class="messages-panel">
            <div class="controls">
                <div class="controls-left">
                    <button class="neutral" onclick="toggleFilter()">
                        Filter: <span id="filterMode">All</span>
                    </button>
                    <button class="neutral" onclick="clearContext()">Clear Context</button>
                </div>
                <div class="controls-right" id="contextInfo">Loading...</div>
            </div>
            <div id="messages"></div>
        </div>
    </div>

    <script>
        const messagesDiv = document.getElementById('messages');
        const contextInfo = document.getElementById('contextInfo');
        const filterModeSpan = document.getElementById('filterMode');

        let allMessages = [];
        let filterMode = 'all'; // 'all' or 'pending'

        async function fetchMessages() {
            try {
                const response = await fetch('/messages');
                allMessages = await response.json();
                renderMessages();
            } catch (e) {
                console.error("Failed to fetch messages", e);
            }
        }

        function renderMessages() {
            const messagesToShow = filterMode === 'pending'
                ? allMessages.filter(m => m.status === 'pending')
                : allMessages;

            // Save current textarea values and focus before re-render
            const textareaValues = {};
            let focusedTextareaId = null;
            let cursorPosition = 0;
            document.querySelectorAll('textarea[id^="comment-"]').forEach(ta => {
                if (ta.value) textareaValues[ta.id] = ta.value;
                if (document.activeElement === ta) {
                    focusedTextareaId = ta.id;
                    cursorPosition = ta.selectionStart;
                }
            });

            messagesDiv.innerHTML = '';

            if (messagesToShow.length === 0) {
                messagesDiv.innerHTML = '<div class="empty-state">No messages to display</div>';
                return;
            }

            // Reverse to show newest first
            const sortedMessages = [...messagesToShow].reverse();

            for (const msg of sortedMessages) {
                const div = document.createElement('div');
                const isPending = msg.status === 'pending';
                const isRejected = msg.status === 'rejected';
                div.className = 'message ' + msg.from + (isPending ? ' pending' : '') + (isRejected ? ' rejected' : '');

                const timestamp = msg.file.match(/\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}/)?.[0] || 'Unknown';
                const summary = generateSummary(msg.content);

                const statusBadge = isPending ? '<span class="filter-badge pending">PENDING</span>' :
                                   isRejected ? '<span class="filter-badge" style="background:#ef4444;">REJECTED</span>' :
                                   '<span class="filter-badge" style="background:#10b981;">APPROVED</span>';

                div.innerHTML = \`
                    <div class="message-header">
                        <h3>From: \${msg.from} \${statusBadge}</h3>
                        <span class="timestamp">\${timestamp}</span>
                    </div>
                    <pre>\${msg.content}</pre>
                    \${msg.comment ? '<div class="summary" style="background:#e3f2fd;">💬 Comment: ' + msg.comment + '</div>' : ''}
                    \${isPending ?
                        '<div class="message-actions">' +
                            '<textarea id="comment-' + msg.file + '" placeholder="Add comment (optional)..."></textarea>' +
                            '<button class="neutral" onclick="markAsRead(\\'' + msg.file + '\\')">👁️ Read</button>' +
                            '<button class="approve" onclick="approveMessage(\\'' + msg.file + '\\')">✓ Approve</button>' +
                            '<button class="reject" onclick="rejectMessage(\\'' + msg.file + '\\')">✗ Reject</button>' +
                        '</div>'
                    : ''}
                \`;
                messagesDiv.appendChild(div);
            }

            // Restore textarea values and focus after re-render
            Object.keys(textareaValues).forEach(id => {
                const ta = document.getElementById(id);
                if (ta) ta.value = textareaValues[id];
            });

            // Restore focus and cursor position
            if (focusedTextareaId) {
                const ta = document.getElementById(focusedTextareaId);
                if (ta) {
                    ta.focus();
                    ta.setSelectionRange(cursorPosition, cursorPosition);
                }
            }

            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        function generateSummary(content) {
            // Simple summary: first sentence or first 100 chars
            const firstLine = content.split('\\n')[0];
            if (firstLine.length > 100) {
                return firstLine.substring(0, 97) + '...';
            }
            return firstLine || 'Message content';
        }

        function toggleFilter() {
            filterMode = filterMode === 'all' ? 'pending' : 'all';
            filterModeSpan.textContent = filterMode === 'all' ? 'All' : 'Pending Only';
            renderMessages();
        }

        async function approveMessage(file) {
            const comment = document.getElementById('comment-' + file)?.value || '';
            try {
                const response = await fetch('/message/approve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ file, comment })
                });
                const result = await response.json();
                if (response.ok) {
                    alert(\`Message approved!\${comment ? '\\nYour comment: ' + comment : ''}\`);
                    fetchMessages();
                } else {
                    alert('Error approving message: ' + result.error);
                }
            } catch (e) {
                console.error('Failed to approve message', e);
                alert('Failed to approve message');
            }
        }

        async function rejectMessage(file) {
            const comment = document.getElementById('comment-' + file)?.value || '';
            if (confirm('Reject this message?')) {
                try {
                    const response = await fetch('/message/reject', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ file, comment })
                    });
                    const result = await response.json();
                    if (response.ok) {
                        alert(\`Message rejected!\${comment ? '\\nYour comment: ' + comment : ''}\`);
                        fetchMessages();
                    } else {
                        alert('Error rejecting message: ' + result.error);
                    }
                } catch (e) {
                    console.error('Failed to reject message', e);
                    alert('Failed to reject message');
                }
            }
        }

        async function markAsRead(file) {
            try {
                const response = await fetch('/message/approve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ file, comment: 'Read' })
                });
                const result = await response.json();
                if (response.ok) {
                    fetchMessages(); // Refresh without alert
                } else {
                    alert('Error marking as read: ' + result.error);
                }
            } catch (e) {
                console.error('Failed to mark as read', e);
                alert('Failed to mark as read');
            }
        }

        async function fetchContext() {
            try {
                const response = await fetch('/context');
                const data = await response.json();
                contextInfo.textContent = \`\${data.count} messages in context\`;
            } catch (e) {
                console.error("Failed to fetch context", e);
            }
        }

        async function clearContext() {
            if (confirm('Clear conversation context?')) {
                try {
                    await fetch('/context/clear', { method: 'POST' });
                    alert('Context cleared!');
                    fetchContext();
                } catch (e) {
                    console.error("Failed to clear context", e);
                }
            }
        }

        setInterval(fetchMessages, 2000);
        setInterval(fetchContext, 5000);
        fetchMessages();
        fetchContext();
    </script>
</body>
</html>
    `;
    await fs.writeFile(htmlPath, htmlContent);
    console.log('index.html created successfully.');
};

/**
 * Run message cleanup on startup
 */
const runCleanup = async () => {
    try {
        const cleanup = require('./cleanup-messages.js');
        console.log('Running message cleanup...');
        await cleanup.archiveApprovedMessages();
        await cleanup.deleteOldArchived();
    } catch (err) {
        console.error('Cleanup error (non-fatal):', err.message);
    }
};

/**
 * Starts the file watcher and the web server.
 */
const startServer = async () => {
    await ensureDirs();
    await loadContext();
    await loadMetadata();
    await runCleanup(); // Clean up old messages
    await createHtmlFile();
    await loadMessages();

    const watcher = chokidar.watch([claudeInboxDir, geminiOutboxDir], {
        ignored: /(^|[\/])\./,
        persistent: true,
        usePolling: true,  // Required for WSL file system compatibility
        interval: 1000,     // Poll every second for changes
        awaitWriteFinish: {
            stabilityThreshold: 500,
            pollInterval: 100
        }
    });

    watcher.on('all', async (event, filePath) => {
        console.log(`[${new Date().toISOString()}] File event: '${event}' on '${path.basename(filePath)}'`);
        await loadMessages();

        if (path.dirname(filePath) === claudeInboxDir && (event === 'add' || event === 'change')) {
            const fileName = path.basename(filePath);
            const notificationPayload = JSON.stringify({
                message: `New message from Claude: ${fileName}`,
                file: filePath,
                timestamp: new Date().toISOString()
            });
            const notificationFile = path.join(geminiNotificationsDir, `${fileName}.json`);
            try {
                await fs.writeFile(notificationFile, notificationPayload);
                console.log(`Created notification for Gemini: ${path.basename(notificationFile)}`);
            } catch (err) {
                console.error("Failed to write notification file:", err);
            }
        }
    });

    app.listen(port, () => {
        console.log(`==========================================`);
        console.log(`AI-AI Bridge v2.0 (Hybrid Protocol)`);
        console.log(`Server: http://localhost:${port}`);
        console.log(`Web UI: http://localhost:${port}/index.html`);
        console.log(`Conversation context: ${conversationHistory.length} messages`);
        console.log(`==========================================`);
        console.log('Watching for file changes...');
    });
};

startServer();
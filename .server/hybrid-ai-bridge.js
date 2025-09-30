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

// Conversation history (last 10 messages)
let conversationHistory = [];
const MAX_HISTORY = 10;

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
 * Loads all messages from the claude and gemini directories into memory.
 */
const loadMessages = async () => {
    try {
        const claudeFiles = await fs.readdir(claudeInboxDir);
        const geminiFiles = await fs.readdir(geminiOutboxDir);

        const claudeMessages = await Promise.all(claudeFiles.map(async (file) => {
            const content = await fs.readFile(path.join(claudeInboxDir, file), 'utf-8');
            return { from: 'claude', content, file };
        }));

        const geminiMessages = await Promise.all(geminiFiles.map(async (file) => {
            const content = await fs.readFile(path.join(geminiOutboxDir, file), 'utf-8');
            return { from: 'gemini', content, file };
        }));

        messages = [...claudeMessages, ...geminiMessages].sort((a, b) => a.file.localeCompare(b.file));
    } catch (error) {
        console.error('Error loading messages:', error);
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
 * Creates the main HTML file for the web interface.
 */
const createHtmlFile = async () => {
    const htmlPath = path.join(__dirname, 'index.html');
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI-AI Bridge v2.0</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; flex-direction: column; height: 100vh; margin: 0; background-color: #f4f4f9; }
        h1 { text-align: center; color: #333; margin: 0.5em; }
        .subtitle { text-align: center; color: #666; margin: -0.5em 0 1em 0; font-size: 0.9em; }
        #messages { flex-grow: 1; overflow-y: auto; padding: 1em; border-top: 1px solid #ddd; }
        .message { border: 1px solid #ccc; padding: 1em; margin-bottom: 1em; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .message.claude { background-color: #eef8ff; border-left: 4px solid #0066cc; }
        .message.gemini { background-color: #fff5f8; border-left: 4px solid #cc0066; }
        .message.user { background-color: #f0f0f0; border-left: 4px solid #666; }
        h3 { margin-top: 0; font-size: 0.9em; color: #555; }
        pre { white-space: pre-wrap; word-wrap: break-word; font-size: 1em; color: #333; margin: 0.5em 0 0 0; }
        .controls { text-align: center; padding: 1em; border-top: 1px solid #ddd; }
        button { padding: 0.5em 1em; margin: 0 0.5em; cursor: pointer; }
    </style>
</head>
<body>
    <h1>AI-AI Communication Bridge v2.0</h1>
    <div class="subtitle">Hybrid Protocol - Bidirectional Conversation</div>
    <div class="controls">
        <button onclick="clearContext()">Clear Context</button>
        <button onclick="fetchContext()">Show Context</button>
        <span id="contextInfo"></span>
    </div>
    <div id="messages"></div>
    <script>
        const messagesDiv = document.getElementById('messages');
        const contextInfo = document.getElementById('contextInfo');

        async function fetchMessages() {
            try {
                const response = await fetch('/messages');
                const messages = await response.json();
                messagesDiv.innerHTML = '';
                for (const msg of messages) {
                    const div = document.createElement('div');
                    div.className = 'message ' + msg.from;
                    div.innerHTML = '<h3>From: ' + msg.from + ' (' + msg.file + ')</h3><pre>' + msg.content + '</pre>';
                    messagesDiv.appendChild(div);
                }
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            } catch (e) {
                console.error("Failed to fetch messages", e);
            }
        }

        async function fetchContext() {
            try {
                const response = await fetch('/context');
                const data = await response.json();
                contextInfo.textContent = '(' + data.count + ' messages in context)';
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
 * Starts the file watcher and the web server.
 */
const startServer = async () => {
    await ensureDirs();
    await loadContext();
    await createHtmlFile();
    await loadMessages();

    const watcher = chokidar.watch([claudeInboxDir, geminiOutboxDir], {
        ignored: /(^|[\/])\./,
        persistent: true,
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
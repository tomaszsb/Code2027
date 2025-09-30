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
// Serve static files from the .server directory, allowing access to index.html
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

        // Combine and sort messages by filename (timestamp)
        messages = [...claudeMessages, ...geminiMessages].sort((a, b) => a.file.localeCompare(b.file));
    } catch (error) {
        console.error('Error loading messages:', error);
    }
};

// Endpoint to get the current list of messages
app.get('/messages', (req, res) => {
    res.json(messages);
});

// New endpoint to handle questions for Gemini
app.post('/ask-gemini', async (req, res) => {
    const { question } = req.body;

    if (!question) {
        return res.status(400).json({ error: 'Question is required' });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const questionFileName = `${timestamp}-claude.txt`;
    const questionFilePath = path.join(claudeInboxDir, questionFileName);

    try {
        // Save the question to Claude's inbox
        await fs.writeFile(questionFilePath, question);

        // Execute the Gemini CLI using spawn for security
        const geminiProcess = spawn('gemini', [question]);

        let geminiResponse = '';
        let errorOutput = '';

        geminiProcess.stdout.on('data', (data) => {
            geminiResponse += data.toString();
        });

        geminiProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        geminiProcess.on('close', async (code) => {
            if (code !== 0) {
                console.error(`Gemini CLI process exited with code ${code}`);
                console.error(`stderr: ${errorOutput}`);
                return res.status(500).json({ error: 'Failed to execute Gemini CLI', details: errorOutput });
            }

            const trimmedResponse = geminiResponse.trim();
            const responseFileName = `${timestamp}-gemini.txt`;
            const responseFilePath = path.join(geminiOutboxDir, responseFileName);

            try {
                // Save Gemini's response to the outbox
                await fs.writeFile(responseFilePath, trimmedResponse);

                // Send the response back to the Python script
                res.json({ response: trimmedResponse });
            } catch (writeError) {
                console.error('Error writing Gemini response file:', writeError);
                res.status(500).json({ error: 'Failed to save Gemini response' });
            }
        });

        geminiProcess.on('error', (err) => {
            console.error('Failed to start Gemini CLI process.', err);
            res.status(500).json({ error: 'Failed to start Gemini CLI process.' });
        });

    } catch (writeError) {
        console.error('Error writing question file:', writeError);
        res.status(500).json({ error: 'Failed to save question' });
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
    <title>AI-AI Bridge</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; flex-direction: column; height: 100vh; margin: 0; background-color: #f4f4f9; }
        h1 { text-align: center; color: #333; }
        #messages { flex-grow: 1; overflow-y: auto; padding: 1em; border-top: 1px solid #ddd; }
        .message { border: 1px solid #ccc; padding: 1em; margin-bottom: 1em; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .message.claude { background-color: #eef8ff; }
        .message.gemini { background-color: #fff5f8; }
        h3 { margin-top: 0; font-size: 0.9em; color: #555; }
        pre { white-space: pre-wrap; word-wrap: break-word; font-size: 1em; color: #333; }
    </style>
</head>
<body>
    <h1>AI-AI Communication Bridge</h1>
    <div id="messages"></div>
    <script>
        const messagesDiv = document.getElementById('messages');
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
        setInterval(fetchMessages, 2000); // Poll for new messages every 2 seconds
        fetchMessages();
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
    await createHtmlFile();
    await loadMessages(); // Initial load

    const watcher = chokidar.watch([claudeInboxDir, geminiOutboxDir], {
        ignored: /(^|[\/])\./, // ignore dotfiles
        persistent: true,
        awaitWriteFinish: {
            stabilityThreshold: 500,
            pollInterval: 100
        }
    });

    watcher.on('all', async (event, filePath) => {
        console.log(`[${new Date().toISOString()}] File event: '${event}' on '${path.basename(filePath)}'`);
        await loadMessages(); // Reload messages on any change

        // When a file is added to Claude's inbox, create a notification for Gemini
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
        console.log(`AI-AI bridge server listening at http://localhost:${port}`);
        console.log('Watching for file changes...');
    });
};

startServer();
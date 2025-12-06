/**
 * VidyaVani - Log Service
 * Centralized logging system that broadcasts logs to WebSocket clients
 * This enables real-time log streaming to the frontend dashboard
 */

const WebSocket = require('ws');

// Store WebSocket server reference
let wss = null;

// Store connected clients
const clients = new Set();

// Metrics
const metrics = {
    totalCalls: 0,
    activeSessions: 0,
    startTime: Date.now(),
    totalMessages: 0
};

/**
 * Initialize WebSocket server for log streaming
 * @param {number} port - Port for WebSocket server (default: 5050)
 */
function initializeWebSocket(port = 5050) {
    wss = new WebSocket.Server({ port });

    wss.on('connection', (ws) => {
        clients.add(ws);
        console.log(`📡 Dashboard connected (${clients.size} clients)`);

        // Send initial connection message
        sendToClient(ws, {
            event: 'connected',
            message: 'Connected to VidyaVani live logs',
            timestamp: new Date().toISOString(),
            metrics: getMetrics()
        });

        ws.on('close', () => {
            clients.delete(ws);
            console.log(`📡 Dashboard disconnected (${clients.size} clients)`);
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
            clients.delete(ws);
        });
    });

    console.log(`📡 WebSocket server listening on port ${port}`);
    return wss;
}

/**
 * Send a message to a specific client
 */
function sendToClient(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
    }
}

/**
 * Broadcast log to all connected clients
 * @param {string} message - Log message
 * @param {string} type - Log type (info, success, error, warning, twilio)
 * @param {object} extra - Additional data to include
 */
function emit(message, type = 'info', extra = {}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        message,
        level: type,
        ...extra
    };

    metrics.totalMessages++;

    // Broadcast to all connected clients
    clients.forEach((ws) => {
        sendToClient(ws, logEntry);
    });

    // Also log to console (using original console.log)
    const icons = {
        info: 'ℹ️',
        success: '✅',
        error: '❌',
        warning: '⚠️',
        twilio: '📞',
        stt: '🎤',
        llm: '🤖',
        tts: '🔊'
    };

    const icon = icons[type] || 'ℹ️';
    originalLog(`${icon} ${message}`);
}

// Store original console.log
const originalLog = console.log.bind(console);
const originalError = console.error.bind(console);

/**
 * Replace console.log to capture and broadcast logs
 */
function interceptConsole() {
    console.log = (...args) => {
        const message = args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');

        // Determine log type based on content
        let type = 'info';
        if (message.includes('✅') || message.includes('success') || message.includes('Success')) {
            type = 'success';
        } else if (message.includes('❌') || message.includes('error') || message.includes('Error')) {
            type = 'error';
        } else if (message.includes('⚠️') || message.includes('warning')) {
            type = 'warning';
        } else if (message.includes('📞') || message.includes('Twilio') || message.includes('call')) {
            type = 'twilio';
        } else if (message.includes('🎤') || message.includes('recording') || message.includes('STT')) {
            type = 'stt';
        } else if (message.includes('🤖') || message.includes('Gemini') || message.includes('AI')) {
            type = 'llm';
        } else if (message.includes('🔊') || message.includes('TTS') || message.includes('speech')) {
            type = 'tts';
        }

        // Broadcast to clients
        broadcast(message, type);

        // Also call original console.log
        originalLog(...args);
    };

    console.error = (...args) => {
        const message = args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');

        broadcast(message, 'error');
        originalError(...args);
    };
}

/**
 * Broadcast without console logging (to avoid infinite loop)
 */
function broadcast(message, type = 'info', extra = {}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        message,
        level: type,
        ...extra
    };

    metrics.totalMessages++;

    clients.forEach((ws) => {
        sendToClient(ws, logEntry);
    });
}

/**
 * Emit a pipeline event (for frontend pipeline visualization)
 */
function emitPipelineEvent(stage, status, data = {}) {
    broadcast(`Pipeline: ${stage} - ${status}`, 'info', {
        event: `${stage}_${status}`,
        stage,
        status,
        ...data
    });
}

/**
 * Track a new call
 */
function trackCallStart(callSid, fromNumber) {
    metrics.totalCalls++;
    metrics.activeSessions++;
    broadcast(`📞 Incoming call: ${callSid} from ${fromNumber}`, 'twilio', {
        event: 'call_start',
        callSid,
        fromNumber
    });
}

/**
 * Track call end
 */
function trackCallEnd(callSid) {
    metrics.activeSessions = Math.max(0, metrics.activeSessions - 1);
    broadcast(`📵 Call ended: ${callSid}`, 'twilio', {
        event: 'call_end',
        callSid
    });
}

/**
 * Get current metrics
 */
function getMetrics() {
    return {
        totalCalls: metrics.totalCalls,
        activeSessions: metrics.activeSessions,
        uptime: Math.floor((Date.now() - metrics.startTime) / 1000),
        totalMessages: metrics.totalMessages,
        connectedClients: clients.size
    };
}

/**
 * Get connected clients count
 */
function getConnectedClients() {
    return clients.size;
}

module.exports = {
    initializeWebSocket,
    emit,
    broadcast,
    emitPipelineEvent,
    trackCallStart,
    trackCallEnd,
    getMetrics,
    getConnectedClients,
    interceptConsole
};

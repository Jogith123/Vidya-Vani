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
 * Emit a structured pipeline event for frontend visualization
 * @param {string} stage - Pipeline stage: 'ivr', 'stt', 'rag', 'llm', 'tts', 'response'
 * @param {string} status - Status: 'active', 'processing', 'complete', 'error'
 * @param {object} data - Additional data (callSid, etc.)
 */
function emitPipelineEvent(stage, status, data = {}) {
    const event = {
        type: 'pipeline',
        stage,
        status,
        callSid: data.callSid || null,
        timestamp: new Date().toISOString(),
        ...data
    };

    // Broadcast structured event
    clients.forEach((ws) => {
        sendToClient(ws, event);
    });

    // Also log for terminal
    const icons = { ivr: '📞', stt: '🎤', rag: '📚', llm: '🤖', tts: '🔊', response: '✅' };
    originalLog(`${icons[stage] || '⚡'} Pipeline: ${stage} → ${status}`);
}

/**
 * Emit a network call event for frontend Network tab
 * @param {string} method - HTTP method
 * @param {string} endpoint - API endpoint
 * @param {number} status - HTTP status code
 * @param {number} latency - Response time in ms
 * @param {object} data - Additional data
 */
function emitNetworkEvent(method, endpoint, status, latency, data = {}) {
    const event = {
        type: 'network',
        method,
        endpoint,
        status,
        latency,
        callSid: data.callSid || null,
        timestamp: new Date().toISOString()
    };

    clients.forEach((ws) => {
        sendToClient(ws, event);
    });

    // Update latency metrics
    updateLatencyMetric(latency);
}

/**
 * Emit metrics update event
 */
function emitMetricsEvent() {
    const event = {
        type: 'metrics',
        ...getMetrics(),
        timestamp: new Date().toISOString()
    };

    clients.forEach((ws) => {
        sendToClient(ws, event);
    });
}

// Latency tracking for averages
const latencyHistory = [];
const MAX_LATENCY_SAMPLES = 100;

function updateLatencyMetric(latency) {
    latencyHistory.push(latency);
    if (latencyHistory.length > MAX_LATENCY_SAMPLES) {
        latencyHistory.shift();
    }
    metrics.avgLatency = Math.round(
        latencyHistory.reduce((a, b) => a + b, 0) / latencyHistory.length
    );
}

// Timing metrics for individual stages
const stageTimings = {
    stt: 0,
    llm: 0,
    tts: 0
};

function setStageTime(stage, timeMs) {
    stageTimings[stage] = timeMs;
    metrics[`${stage}Time`] = timeMs;
}

/**
 * Track a new call
 */
function trackCallStart(callSid, fromNumber) {
    metrics.totalCalls++;
    metrics.activeSessions++;

    // Emit structured events
    emitPipelineEvent('ivr', 'active', { callSid });
    emitNetworkEvent('POST', '/ivr/welcome', 200, 0, { callSid });
    emitMetricsEvent();

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

    emitPipelineEvent('response', 'complete', { callSid });
    emitMetricsEvent();

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
        connectedClients: clients.size,
        avgLatency: metrics.avgLatency || 0,
        sttTime: stageTimings.stt,
        llmTime: stageTimings.llm,
        ttsTime: stageTimings.tts
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
    emitNetworkEvent,
    emitMetricsEvent,
    setStageTime,
    trackCallStart,
    trackCallEnd,
    getMetrics,
    getConnectedClients,
    interceptConsole
};

/**
 * VidyaVani - Live Logs Controller
 * Connects to WebSocket server to receive and display real-time logs from the backend
 * This visualizes the terminal logs that appear during phone calls
 */

class LiveLogsController {
    constructor(options = {}) {
        this.wsUrl = options.wsUrl || 'ws://localhost:5050';
        this.terminalElement = options.terminalElement;
        this.onConnectionChange = options.onConnectionChange || (() => { });
        this.onLogReceived = options.onLogReceived || (() => { });

        // State
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.reconnectTimer = null;

        // Log buffer for performance
        this.logBuffer = [];
        this.flushInterval = null;

        // Initialize
        this.init();
    }

    init() {
        this.connect();
        this.startFlushInterval();

        // Add initial system log
        this.addLog('Initializing VidyaVani application...', 'info');
    }

    connect() {
        try {
            console.log(`Connecting to WebSocket: ${this.wsUrl}`);
            this.ws = new WebSocket(this.wsUrl);

            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.onConnectionChange(true);
                this.addLog('Connected to VidyaVani live logs', 'live', true);
                this.addLog('Connected to live logs server', 'success', true);
            };

            this.ws.onmessage = (event) => {
                this.handleMessage(event.data);
            };

            this.ws.onerror = (error) => {
                console.warn('WebSocket error:', error);
                this.addLog('WebSocket connection error', 'error');
            };

            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.isConnected = false;
                this.onConnectionChange(false);
                this.scheduleReconnect();
            };

        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            this.scheduleReconnect();
        }
    }

    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.addLog('Max reconnection attempts reached. Please refresh the page.', 'error');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);

        this.addLog(`Reconnecting in ${Math.round(delay / 1000)}s... (attempt ${this.reconnectAttempts})`, 'warning');

        this.reconnectTimer = setTimeout(() => {
            this.connect();
        }, delay);
    }

    handleMessage(data) {
        try {
            const log = JSON.parse(data);
            this.processLog(log);
        } catch (e) {
            // Handle plain text messages
            this.addLog(data, 'info');
        }
    }

    processLog(log) {
        // Determine log type based on content
        let type = 'info';
        let message = log.message || log.text || JSON.stringify(log);

        // Detect log type based on content patterns
        if (log.level === 'error' || message.includes('❌') || message.includes('Error')) {
            type = 'error';
        } else if (log.level === 'success' || message.includes('✅') || message.includes('success')) {
            type = 'success';
        } else if (log.level === 'warning' || message.includes('⚠️') || message.includes('warning')) {
            type = 'warning';
        } else if (log.event === 'twilio' || message.includes('📞') || message.includes('Twilio')) {
            type = 'twilio';
        } else if (message.includes('🎤') || message.includes('recording')) {
            type = 'info';
        } else if (message.includes('🤖') || message.includes('Gemini') || message.includes('AI')) {
            type = 'info';
        }

        // Check for special events
        if (log.event) {
            this.onLogReceived(log);
        }

        // Add to display
        this.addLog(message, type, log.isLive);

        // Update any associated metrics
        if (log.latency) {
            this.onLogReceived({ ...log, latency: log.latency });
        }
    }

    addLog(message, type = 'info', isLive = false) {
        const timestamp = this.formatTimestamp(new Date());

        this.logBuffer.push({
            timestamp,
            message,
            type,
            isLive
        });

        // Immediate flush for important logs
        if (type === 'error' || type === 'success' || isLive) {
            this.flushLogs();
        }
    }

    startFlushInterval() {
        this.flushInterval = setInterval(() => {
            this.flushLogs();
        }, 100); // Flush every 100ms for smooth updates
    }

    flushLogs() {
        if (this.logBuffer.length === 0 || !this.terminalElement) return;

        const fragment = document.createDocumentFragment();

        this.logBuffer.forEach(log => {
            const entry = this.createLogEntry(log);
            fragment.appendChild(entry);
        });

        this.terminalElement.appendChild(fragment);
        this.logBuffer = [];

        // Auto-scroll to bottom
        this.terminalElement.scrollTop = this.terminalElement.scrollHeight;
    }

    createLogEntry({ timestamp, message, type, isLive }) {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;

        // Timestamp
        const timeSpan = document.createElement('span');
        timeSpan.className = 'log-timestamp';
        timeSpan.textContent = timestamp;
        entry.appendChild(timeSpan);

        // Live badge for real-time logs
        if (isLive) {
            const badge = document.createElement('span');
            badge.className = 'log-badge live';
            badge.textContent = 'LIVE';
            entry.appendChild(badge);
        }

        // Success badge
        if (type === 'success' && message.includes('Connected')) {
            const badge = document.createElement('span');
            badge.className = 'log-badge success';
            badge.textContent = '✓';
            entry.appendChild(badge);
        }

        // Message
        const msgSpan = document.createElement('span');
        msgSpan.className = `log-message ${type}`;
        msgSpan.textContent = message;
        entry.appendChild(msgSpan);

        return entry;
    }

    formatTimestamp(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    clear() {
        if (this.terminalElement) {
            this.terminalElement.innerHTML = '';
        }
        this.logBuffer = [];
        this.addLog('Logs cleared', 'info');
    }

    disconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
        }
        if (this.ws) {
            this.ws.close();
        }
    }

    // Method to manually add demo logs for testing
    addDemoLogs() {
        const demoLogs = [
            { message: 'System initialized', type: 'info' },
            { message: 'Loaded 199 voices', type: 'success' },
            { message: 'Backend health check passed', type: 'success' },
            { message: '📞 Incoming call: CA123456 from +91XXXXXXXXXX', type: 'twilio' },
            { message: '🎤 Starting recording for call: CA123456', type: 'info' },
            { message: '✅ Recording completed', type: 'success' },
            { message: '📝 Transcription: "What is photosynthesis?"', type: 'info' },
            { message: '🤖 Sending to Gemini AI...', type: 'info' },
            { message: '🤖 Answer received (245ms)', type: 'success' },
            { message: '🔊 Converting to speech...', type: 'info' },
            { message: '✅ Audio generated successfully', type: 'success' }
        ];

        let delay = 0;
        demoLogs.forEach(log => {
            setTimeout(() => {
                this.addLog(log.message, log.type);
            }, delay);
            delay += 500;
        });
    }
}

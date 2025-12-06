/**
 * VidyaVani Admin Dashboard - Main Application Entry Point
 * Initializes all modules and coordinates the dashboard functionality
 */


class VidyaVaniDashboard {
    constructor() {
        // Configuration - derive URLs from current location for production support
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsPort = 5050;
        this.config = {
            wsUrl: `${wsProtocol}//${window.location.hostname}:${wsPort}`,
            backendUrl: window.location.origin,
            healthCheckInterval: 10000
        };

        // State
        this.isSessionActive = false;
        this.sessionStartTime = null;
        this.timerInterval = null;

        // Controllers
        this.ivr = null;
        this.logs = null;
        this.network = null;
        this.pipeline = null;
        this.voice = null;

        // DOM Elements
        this.elements = {};

        // Initialize
        this.init();
    }

    async init() {
        console.log('🚀 Initializing VidyaVani Dashboard...');

        this.cacheElements();
        this.initControllers();
        this.setupEventListeners();
        this.startClock();
        this.checkBackendHealth();

        // Add initial log
        this.logs.addLog('System initialized', 'info');

        console.log('✅ Dashboard initialized');
    }

    cacheElements() {
        this.elements = {
            // Phone simulator
            phoneTime: document.getElementById('phone-time'),
            statusDot: document.getElementById('status-dot'),
            statusText: document.getElementById('status-text'),
            sessionTimer: document.getElementById('session-timer'),
            welcomeScreen: document.getElementById('welcome-screen'),
            callScreen: document.getElementById('call-screen'),
            startSessionBtn: document.getElementById('start-session-btn'),
            endCallBtn: document.getElementById('end-call-btn'),
            messageDisplay: document.getElementById('message-display'),
            dialPad: document.getElementById('dial-pad'),
            micBtn: document.getElementById('mic-btn'),
            speakerBtn: document.getElementById('speaker-btn'),
            languageSelection: document.getElementById('language-selection'),

            // Console tabs
            tabBtns: document.querySelectorAll('.tab-btn'),
            tabPanels: document.querySelectorAll('.tab-panel'),

            // Pipeline
            pipelineContainer: document.getElementById('pipeline-container'),

            // Network
            networkList: document.getElementById('network-list'),
            clearNetworkBtn: document.getElementById('clear-network'),

            // Metrics
            metricsGrid: document.getElementById('metrics-grid'),

            // Logs
            terminalContent: document.getElementById('terminal-content'),
            clearLogsBtn: document.getElementById('clear-logs'),

            // Connection status
            wsIndicator: document.getElementById('ws-indicator'),
            wsStatus: document.getElementById('ws-status'),
            backendIndicator: document.getElementById('backend-indicator'),
            backendStatus: document.getElementById('backend-status')
        };
    }

    initControllers() {
        // Initialize IVR controller
        this.ivr = new IVRController({
            onStateChange: (state) => this.handleIVRStateChange(state),
            onDigitPressed: (digit) => this.handleDigitPressed(digit)
        });

        // Initialize Live Logs controller
        this.logs = new LiveLogsController({
            wsUrl: this.config.wsUrl,
            terminalElement: this.elements.terminalContent,
            onConnectionChange: (connected) => this.updateWSStatus(connected),
            onLogReceived: (log) => this.handleLogReceived(log)
        });

        // Initialize Network controller
        this.network = new NetworkController({
            listElement: this.elements.networkList,
            baseUrl: this.config.backendUrl
        });

        // Initialize Pipeline controller
        this.pipeline = new PipelineController({
            containerElement: this.elements.pipelineContainer
        });

        // Initialize Voice controller
        this.voice = new VoiceController({
            onMicToggle: (active) => this.handleMicToggle(active),
            onSpeakerToggle: (active) => this.handleSpeakerToggle(active)
        });
    }

    setupEventListeners() {
        // Start session button
        this.elements.startSessionBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.startSession();
        });

        // End call button
        this.elements.endCallBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.endSession();
        });

        // Dial pad
        this.elements.dialPad?.addEventListener('click', (e) => {
            e.preventDefault();
            const key = e.target.closest('.dial-key');
            if (key) {
                const digit = key.dataset.digit;
                this.ivr.pressDigit(digit);
            }
        });

        // Language selection
        this.elements.languageSelection?.addEventListener('click', (e) => {
            e.preventDefault();
            const langBtn = e.target.closest('.lang-btn');
            if (langBtn) {
                const digit = langBtn.dataset.digit;
                this.ivr.pressDigit(digit);
            }
        });

        // Tab switching
        this.elements.tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(btn.dataset.tab);
            });
        });

        // Clear buttons
        this.elements.clearLogsBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.logs.clear();
        });
        this.elements.clearNetworkBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.network.clear();
        });

        // Mic and speaker controls
        this.elements.micBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.voice.toggleMic();
        });
        this.elements.speakerBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.voice.toggleSpeaker();
        });
    }

    startSession() {
        console.log('📞 Starting session...');
        this.isSessionActive = true;
        this.sessionStartTime = Date.now();

        // Update UI
        this.elements.welcomeScreen?.classList.add('hidden');
        this.elements.callScreen?.classList.remove('hidden');
        this.elements.endCallBtn?.classList.remove('hidden');
        this.elements.statusDot?.classList.add('active');
        this.elements.statusDot?.classList.remove('inactive');
        if (this.elements.statusText) this.elements.statusText.textContent = 'Session Active';

        // Start timer
        this.startSessionTimer();

        // Initialize IVR
        this.ivr.startSession();

        // Log the event
        this.logs.addLog('Starting new learning session...', 'info');

        // Simulate API call
        this.network.addCall('POST', '/api/session/create', 200, Math.floor(Math.random() * 200) + 100);

        // Update pipeline
        this.pipeline.setStageActive('ivr');
    }

    endSession() {
        console.log('📵 Ending session...');
        this.isSessionActive = false;

        // Update UI
        this.elements.welcomeScreen?.classList.remove('hidden');
        this.elements.callScreen?.classList.add('hidden');
        this.elements.endCallBtn?.classList.add('hidden');
        this.elements.statusDot?.classList.remove('active');
        this.elements.statusDot?.classList.add('inactive');
        if (this.elements.statusText) this.elements.statusText.textContent = 'Ready to Start';

        // Stop timer
        this.stopSessionTimer();
        if (this.elements.sessionTimer) this.elements.sessionTimer.textContent = '00:00';

        // Reset IVR
        this.ivr.endSession();

        // Log the event
        this.logs.addLog('Session ended', 'info');

        // Reset pipeline
        this.pipeline.resetAll();
    }

    startSessionTimer() {
        this.timerInterval = setInterval(() => {
            if (!this.sessionStartTime) return;

            const elapsed = Math.floor((Date.now() - this.sessionStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');
            if (this.elements.sessionTimer) this.elements.sessionTimer.textContent = `${minutes}:${seconds}`;
        }, 1000);
    }

    stopSessionTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.sessionStartTime = null;
    }

    startClock() {
        const updateClock = () => {
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            this.elements.phoneTime.textContent = `${hours}:${minutes}`;
        };

        updateClock();
        setInterval(updateClock, 1000);
    }

    switchTab(tabId) {
        // Update tab buttons
        this.elements.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        // Update tab panels
        this.elements.tabPanels.forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tabId}-panel`);
        });
    }

    async checkBackendHealth() {
        const check = async () => {
            try {
                const response = await fetch(`${this.config.backendUrl}/health`, {
                    method: 'GET',
                    mode: 'cors'
                });

                if (response.ok) {
                    const data = await response.json();
                    this.updateBackendStatus(true, data);
                    this.logs.addLog('Backend health check passed', 'success');
                } else {
                    this.updateBackendStatus(false);
                }
            } catch (error) {
                this.updateBackendStatus(false);
                console.warn('Backend health check failed:', error.message);
            }
        };

        // Initial check
        await check();

        // Periodic checks
        setInterval(check, this.config.healthCheckInterval);
    }

    updateWSStatus(connected) {
        this.elements.wsIndicator?.classList.toggle('connected', connected);
        this.elements.wsIndicator?.classList.toggle('disconnected', !connected);
        this.elements.wsStatus.textContent = connected ? 'Connected' : 'Disconnected';
    }

    updateBackendStatus(connected, data = null) {
        this.elements.backendIndicator?.classList.toggle('connected', connected);
        this.elements.backendIndicator?.classList.toggle('disconnected', !connected);
        if (this.elements.backendStatus) this.elements.backendStatus.textContent = connected ? 'Online' : 'Offline';

        if (connected && data) {
            // Update metrics based on health data
            const sessionsEl = document.getElementById('metric-active-sessions');
            if (sessionsEl) {
                sessionsEl.textContent = data.activeSessions || '0';
            }
        }
    }

    handleIVRStateChange(state) {
        console.log('IVR state changed:', state);

        // Update status display
        this.elements.statusDot?.classList.remove('active', 'processing', 'inactive');

        switch (state) {
            case 'recording':
                this.elements.statusDot?.classList.add('processing');
                if (this.elements.statusText) this.elements.statusText.textContent = 'Recording...';
                this.pipeline.setStageActive('stt');
                break;
            case 'processing':
                this.elements.statusDot?.classList.add('processing');
                if (this.elements.statusText) this.elements.statusText.textContent = 'Processing...';
                this.pipeline.setStageActive('llm');
                break;
            case 'speaking':
                this.elements.statusDot?.classList.add('active');
                if (this.elements.statusText) this.elements.statusText.textContent = 'Speaking...';
                this.pipeline.setStageActive('tts');
                break;
            case 'active':
                this.elements.statusDot?.classList.add('active');
                if (this.elements.statusText) this.elements.statusText.textContent = 'Session Active';
                break;
            default:
                this.elements.statusDot?.classList.add('active');
                if (this.elements.statusText) this.elements.statusText.textContent = 'Session Active';
        }
    }

    handleDigitPressed(digit) {
        console.log('Digit pressed:', digit);
        this.logs.addLog(`User pressed: ${digit}`, 'info');

        // Simulate network call for digit press
        this.network.addCall('POST', `/ivr/menu?digit=${digit}`, 200, Math.floor(Math.random() * 50) + 20);
    }

    handleLogReceived(log) {
        // Update pipeline based on log events
        if (log.event === 'stt_start') {
            this.pipeline.setStageActive('stt');
        } else if (log.event === 'stt_complete') {
            this.pipeline.setStageComplete('stt');
        } else if (log.event === 'llm_start') {
            this.pipeline.setStageActive('llm');
        } else if (log.event === 'llm_complete') {
            this.pipeline.setStageComplete('llm');
        } else if (log.event === 'tts_start') {
            this.pipeline.setStageActive('tts');
        } else if (log.event === 'tts_complete') {
            this.pipeline.setStageComplete('tts');
        }

        // Update metrics
        if (log.latency) {
            document.getElementById('metric-avg-latency').textContent = `${log.latency}ms`;
        }
    }

    handleMicToggle(active) {
        const icon = this.elements.micBtn?.querySelector('.control-icon');
        if (icon) {
            icon.textContent = active ? '🎤' : '🔇';
        }
    }

    handleSpeakerToggle(active) {
        const icon = this.elements.speakerBtn?.querySelector('.control-icon');
        if (icon) {
            icon.textContent = active ? '🔊' : '🔈';
        }
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new VidyaVaniDashboard();
});


/**
 * VidyaVani - Voice Controller
 * Handles browser-side audio controls and Twilio device status
 */

class VoiceController {
    constructor(options = {}) {
        this.onMicToggle = options.onMicToggle || (() => { });
        this.onSpeakerToggle = options.onSpeakerToggle || (() => { });

        // State
        this.isMicActive = true;
        this.isSpeakerActive = true;
        this.audioContext = null;
        this.mediaStream = null;
        this.analyser = null;

        // Twilio Device (if integrated)
        this.twilioDevice = null;
        this.deviceStatus = 'idle';

        // Register cleanup on page unload to prevent resource leaks
        window.addEventListener('beforeunload', () => this.cleanup());
    }

    toggleMic() {
        this.isMicActive = !this.isMicActive;
        this.onMicToggle(this.isMicActive);

        if (this.mediaStream) {
            this.mediaStream.getAudioTracks().forEach(track => {
                track.enabled = this.isMicActive;
            });
        }

        console.log(`Microphone ${this.isMicActive ? 'enabled' : 'muted'}`);
        return this.isMicActive;
    }

    toggleSpeaker() {
        this.isSpeakerActive = !this.isSpeakerActive;
        this.onSpeakerToggle(this.isSpeakerActive);

        // Mute/unmute all audio elements
        document.querySelectorAll('audio, video').forEach(el => {
            el.muted = !this.isSpeakerActive;
        });

        console.log(`Speaker ${this.isSpeakerActive ? 'enabled' : 'muted'}`);
        return this.isSpeakerActive;
    }

    async initializeAudio() {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Request microphone access
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: true
            });

            // Create analyser for visualizations
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;

            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            source.connect(this.analyser);

            console.log('Audio initialized successfully');
            return true;
        } catch (error) {
            console.warn('Failed to initialize audio:', error);
            return false;
        }
    }

    getAudioLevel() {
        if (!this.analyser) return 0;

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);

        // Calculate average level
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        return average / 255; // Normalize to 0-1
    }

    /**
     * Initialize Twilio Device (requires Twilio Client SDK)
     */
    async initializeTwilioDevice(token) {
        if (typeof Twilio === 'undefined' || !Twilio.Device) {
            console.warn('Twilio Client SDK not loaded');
            return false;
        }

        try {
            this.twilioDevice = new Twilio.Device(token, {
                codecPreferences: ['opus', 'pcmu'],
                fakeLocalDTMF: true,
                enableRingingState: true
            });

            this.twilioDevice.on('ready', () => {
                this.deviceStatus = 'ready';
                console.log('Twilio Device ready');
            });

            this.twilioDevice.on('error', (error) => {
                this.deviceStatus = 'error';
                console.error('Twilio Device error:', error);
            });

            this.twilioDevice.on('connect', () => {
                this.deviceStatus = 'connected';
                console.log('Twilio call connected');
            });

            this.twilioDevice.on('disconnect', () => {
                this.deviceStatus = 'ready';
                console.log('Twilio call disconnected');
            });

            this.twilioDevice.on('incoming', (connection) => {
                this.deviceStatus = 'incoming';
                console.log('Incoming Twilio call');
            });

            return true;
        } catch (error) {
            console.error('Failed to initialize Twilio Device:', error);
            return false;
        }
    }

    makeCall(params = {}) {
        if (!this.twilioDevice) {
            console.warn('Twilio Device not initialized');
            return null;
        }

        return this.twilioDevice.connect(params);
    }

    hangup() {
        if (this.twilioDevice) {
            this.twilioDevice.disconnectAll();
        }
    }

    getDeviceStatus() {
        return this.deviceStatus;
    }

    isMicMuted() {
        return !this.isMicActive;
    }

    isSpeakerMuted() {
        return !this.isSpeakerActive;
    }

    cleanup() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
        if (this.twilioDevice) {
            this.twilioDevice.destroy();
        }
    }
}

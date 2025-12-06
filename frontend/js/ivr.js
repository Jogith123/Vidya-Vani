/**
 * VidyaVani - IVR Controller
 * Handles Interactive Voice Response states and phone simulator logic
 */

class IVRController {
    constructor(options = {}) {
        this.onStateChange = options.onStateChange || (() => { });
        this.onDigitPressed = options.onDigitPressed || (() => { });

        // IVR States
        this.states = {
            IDLE: 'idle',
            WELCOME: 'welcome',
            LANGUAGE_SELECT: 'language_select',
            MENU: 'menu',
            RECORDING: 'recording',
            PROCESSING: 'processing',
            SPEAKING: 'speaking',
            SUMMARY: 'summary',
            ENDED: 'ended'
        };

        // Current state
        this.currentState = this.states.IDLE;
        this.selectedLanguage = null;
        this.sessionId = null;

        // IVR menu options
        this.menuOptions = {
            '1': { action: 'ask_question', label: 'Ask a Question' },
            '2': { action: 'stop_recording', label: 'Stop Recording' },
            '3': { action: 'get_answer', label: 'Get Answer' },
            '4': { action: 'get_summary', label: 'Get Summary' },
            '5': { action: 'return_menu', label: 'Return to Menu' },
            '9': { action: 'end_call', label: 'End Call' }
        };

        // Messages for different states
        this.messages = {
            welcome: {
                en: "Welcome to VidyaVani! Your AI-powered learning assistant for Class 10 Science.",
                te: "విద్యావాణికి స్వాగతం! మీ AI-ఆధారిత లెర్నింగ్ అసిస్టెంట్."
            },
            language_select: {
                en: "Please select your language:",
                te: "దయచేసి మీ భాషను ఎంచుకోండి:"
            },
            menu: {
                en: "Press 1 to ask a question. Press 2 to stop recording. Press 3 to get the answer. Press 4 for summary. Press 9 to end.",
                te: "1 నొక్కండి ప్రశ్న అడగడానికి. 3 నొక్కండి సమాధానం కోసం. 9 నొక్కండి ముగించడానికి."
            },
            recording: {
                en: "Please ask your question after the beep. Press 2 when done.",
                te: "బీప్ తర్వాత మీ ప్రశ్న అడగండి. పూర్తయినప్పుడు 2 నొక్కండి."
            },
            processing: {
                en: "Processing your question. Please wait...",
                te: "మీ ప్రశ్నను ప్రాసెస్ చేస్తోంది. దయచేసి వేచి ఉండండి..."
            },
            goodbye: {
                en: "Thank you for using VidyaVani. Goodbye!",
                te: "విద్యావాణిని ఉపయోగించినందుకు ధన్యవాదాలు. వీడ్కోలు!"
            }
        };
    }

    startSession() {
        this.sessionId = `session_${Date.now()}`;
        this.setState(this.states.WELCOME);

        // Simulate state transitions
        setTimeout(() => {
            this.setState(this.states.LANGUAGE_SELECT);
        }, 2000);
    }

    endSession() {
        this.setState(this.states.ENDED);
        this.currentState = this.states.IDLE;
        this.selectedLanguage = null;
        this.sessionId = null;
    }

    setState(newState) {
        const previousState = this.currentState;
        this.currentState = newState;

        console.log(`IVR State: ${previousState} -> ${newState}`);
        this.onStateChange(newState);

        this.updateMessageDisplay();
    }

    pressDigit(digit) {
        console.log(`IVR: Digit pressed: ${digit}`);
        this.onDigitPressed(digit);

        // Handle digit based on current state
        switch (this.currentState) {
            case this.states.LANGUAGE_SELECT:
                this.handleLanguageSelect(digit);
                break;
            case this.states.MENU:
            case this.states.WELCOME:
                this.handleMenuInput(digit);
                break;
            case this.states.RECORDING:
                if (digit === '2') {
                    this.stopRecording();
                }
                break;
            default:
                this.handleMenuInput(digit);
        }
    }

    handleLanguageSelect(digit) {
        if (digit === '1') {
            this.selectedLanguage = 'en';
            this.setState(this.states.MENU);
        } else if (digit === '2') {
            this.selectedLanguage = 'te';
            this.setState(this.states.MENU);
        }
    }

    handleMenuInput(digit) {
        const option = this.menuOptions[digit];
        if (!option) return;

        switch (option.action) {
            case 'ask_question':
                this.startRecording();
                break;
            case 'stop_recording':
                this.stopRecording();
                break;
            case 'get_answer':
                this.getAnswer();
                break;
            case 'get_summary':
                this.getSummary();
                break;
            case 'return_menu':
                this.setState(this.states.MENU);
                break;
            case 'end_call':
                this.endSession();
                break;
        }
    }

    startRecording() {
        this.setState(this.states.RECORDING);

        // Simulate recording for demo
        setTimeout(() => {
            // Auto-stop after 5 seconds for demo
            if (this.currentState === this.states.RECORDING) {
                this.stopRecording();
            }
        }, 5000);
    }

    stopRecording() {
        if (this.currentState === this.states.RECORDING) {
            this.setState(this.states.PROCESSING);

            // Simulate processing time
            setTimeout(() => {
                this.getAnswer();
            }, 2000);
        }
    }

    getAnswer() {
        this.setState(this.states.SPEAKING);

        // Simulate TTS playback
        setTimeout(() => {
            this.setState(this.states.MENU);
        }, 3000);
    }

    getSummary() {
        this.setState(this.states.SUMMARY);

        // Simulate summary generation
        setTimeout(() => {
            this.setState(this.states.SPEAKING);

            setTimeout(() => {
                this.setState(this.states.MENU);
            }, 4000);
        }, 2000);
    }

    updateMessageDisplay() {
        const messageDisplay = document.getElementById('message-display');
        if (!messageDisplay) return;

        const lang = this.selectedLanguage || 'en';
        let message = '';
        let prompt = '';

        switch (this.currentState) {
            case this.states.WELCOME:
            case this.states.LANGUAGE_SELECT:
                message = this.messages.welcome[lang];
                prompt = this.messages.language_select[lang];
                break;
            case this.states.MENU:
                message = `Language: ${lang === 'en' ? 'English' : 'Telugu'} selected`;
                prompt = this.messages.menu[lang];
                break;
            case this.states.RECORDING:
                message = '🎤 Recording...';
                prompt = this.messages.recording[lang];
                break;
            case this.states.PROCESSING:
                message = '⏳ Processing...';
                prompt = this.messages.processing[lang];
                break;
            case this.states.SPEAKING:
                message = '🔊 AI is responding...';
                prompt = 'Listen to the answer';
                break;
            case this.states.ENDED:
                message = this.messages.goodbye[lang];
                prompt = '';
                break;
            default:
                message = this.messages.welcome[lang];
                prompt = this.messages.language_select[lang];
        }

        const messageEl = messageDisplay.querySelector('.ivr-message');
        const promptEl = messageDisplay.querySelector('.ivr-prompt');

        if (messageEl) messageEl.textContent = message;
        if (promptEl) promptEl.textContent = prompt;
    }

    getCurrentState() {
        return this.currentState;
    }

    getSessionId() {
        return this.sessionId;
    }
}

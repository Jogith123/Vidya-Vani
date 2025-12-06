/**
 * VidyaVani - Pipeline Controller
 * Visualizes the AI processing pipeline (IVR -> STT -> RAG -> LLM -> TTS -> Response)
 */

class PipelineController {
    constructor(options = {}) {
        this.containerElement = options.containerElement;

        // Pipeline stages definition
        this.stages = [
            {
                id: 'ivr',
                name: 'IVR System',
                icon: '📞',
                description: 'Interactive Voice Response'
            },
            {
                id: 'stt',
                name: 'Speech-to-Text',
                icon: '🎤',
                description: 'Transcribing audio to text'
            },
            {
                id: 'rag',
                name: 'RAG System',
                icon: '💾',
                description: 'Retrieving relevant context'
            },
            {
                id: 'llm',
                name: 'Gemini AI',
                icon: '🤖',
                description: 'Generating response'
            },
            {
                id: 'tts',
                name: 'Text-to-Speech',
                icon: '🔊',
                description: 'Converting text to audio'
            },
            {
                id: 'response',
                name: 'Response Delivered',
                icon: '✅',
                description: 'Playing audio to user'
            }
        ];

        // Stage states
        this.stageStates = {};
        this.stages.forEach(stage => {
            this.stageStates[stage.id] = 'idle';
        });

        // Initialize
        this.render();
    }

    render() {
        if (!this.containerElement) return;

        this.containerElement.innerHTML = '';

        this.stages.forEach((stage, index) => {
            // Create stage element
            const stageEl = this.createStageElement(stage);
            this.containerElement.appendChild(stageEl);

            // Add arrow between stages (except after last)
            if (index < this.stages.length - 1) {
                const arrow = document.createElement('div');
                arrow.className = 'pipeline-arrow';
                arrow.innerHTML = '↓';
                this.containerElement.appendChild(arrow);
            }
        });
    }

    createStageElement(stage) {
        const state = this.stageStates[stage.id];

        const el = document.createElement('div');
        el.className = `pipeline-stage ${state}`;
        el.id = `stage-${stage.id}`;

        el.innerHTML = `
            <div class="stage-icon">${stage.icon}</div>
            <div class="stage-info">
                <div class="stage-name">${stage.name}</div>
                <div class="stage-status">${this.getStatusText(state)}</div>
            </div>
            <div class="stage-indicator ${state}"></div>
        `;

        return el;
    }

    getStatusText(state) {
        const statusMap = {
            'idle': 'Idle',
            'waiting': 'Waiting',
            'processing': 'Processing...',
            'active': 'Active',
            'complete': 'Complete'
        };
        return statusMap[state] || 'Idle';
    }

    setStageState(stageId, state) {
        this.stageStates[stageId] = state;
        this.updateStageElement(stageId);
    }

    setStageActive(stageId) {
        // Set all previous stages to complete
        let foundTarget = false;
        this.stages.forEach(stage => {
            if (stage.id === stageId) {
                foundTarget = true;
                this.stageStates[stage.id] = 'processing';
            } else if (!foundTarget) {
                if (this.stageStates[stage.id] !== 'idle') {
                    this.stageStates[stage.id] = 'complete';
                }
            } else {
                this.stageStates[stage.id] = 'waiting';
            }
        });

        this.updateAllStages();
    }

    setStageComplete(stageId) {
        this.stageStates[stageId] = 'complete';
        this.updateStageElement(stageId);
    }

    setStageWaiting(stageId) {
        this.stageStates[stageId] = 'waiting';
        this.updateStageElement(stageId);
    }

    updateStageElement(stageId) {
        const stageEl = document.getElementById(`stage-${stageId}`);
        if (!stageEl) return;

        const state = this.stageStates[stageId];

        // Update classes
        stageEl.classList.remove('idle', 'waiting', 'processing', 'active', 'complete');
        stageEl.classList.add(state);

        // Update status text
        const statusEl = stageEl.querySelector('.stage-status');
        if (statusEl) {
            statusEl.textContent = this.getStatusText(state);
        }

        // Update indicator
        const indicator = stageEl.querySelector('.stage-indicator');
        if (indicator) {
            indicator.classList.remove('idle', 'waiting', 'processing', 'active', 'complete');
            indicator.classList.add(state);
        }
    }

    updateAllStages() {
        this.stages.forEach(stage => {
            this.updateStageElement(stage.id);
        });
    }

    resetAll() {
        this.stages.forEach(stage => {
            this.stageStates[stage.id] = 'idle';
        });
        this.updateAllStages();
    }

    resetFromStage(stageId) {
        let foundTarget = false;
        this.stages.forEach(stage => {
            if (stage.id === stageId) {
                foundTarget = true;
            }
            if (foundTarget) {
                this.stageStates[stage.id] = 'idle';
            }
        });
        this.updateAllStages();
    }

    /**
     * Simulate a full pipeline run (for demo purposes)
     */
    async simulatePipeline() {
        const delays = [500, 1000, 800, 1500, 700, 500];

        for (let i = 0; i < this.stages.length; i++) {
            const stage = this.stages[i];
            this.setStageState(stage.id, 'processing');

            await new Promise(resolve => setTimeout(resolve, delays[i]));

            this.setStageState(stage.id, 'complete');
        }

        // Reset after a brief pause
        setTimeout(() => {
            this.resetAll();
        }, 2000);
    }

    getStageState(stageId) {
        return this.stageStates[stageId];
    }

    getAllStates() {
        return { ...this.stageStates };
    }
}

/**
 * VidyaVani - Network Controller
 * Handles API call monitoring and network request visualization
 */

class NetworkController {
    constructor(options = {}) {
        this.listElement = options.listElement;
        this.baseUrl = options.baseUrl || 'http://localhost:3000';

        // Store network calls
        this.calls = [];
        this.maxCalls = 100; // Keep last 100 calls
    }

    /**
     * Add a network call to the list
     * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
     * @param {string} endpoint - API endpoint
     * @param {number} status - HTTP status code
     * @param {number} latency - Response time in ms
     */
    addCall(method, endpoint, status, latency) {
        const call = {
            id: Date.now(),
            timestamp: new Date(),
            method: method.toUpperCase(),
            endpoint,
            status,
            latency,
            isSuccess: status >= 200 && status < 300
        };

        this.calls.unshift(call);

        // Trim if too many calls
        if (this.calls.length > this.maxCalls) {
            this.calls = this.calls.slice(0, this.maxCalls);
        }

        // Render the call
        this.renderCall(call);
    }

    /**
     * Make an actual API call and track it
     */
    async fetch(endpoint, options = {}) {
        const method = options.method || 'GET';
        const url = `${this.baseUrl}${endpoint}`;
        const startTime = performance.now();

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            const latency = Math.round(performance.now() - startTime);
            this.addCall(method, endpoint, response.status, latency);

            return response;
        } catch (error) {
            const latency = Math.round(performance.now() - startTime);
            this.addCall(method, endpoint, 0, latency);
            throw error;
        }
    }

    renderCall(call) {
        if (!this.listElement) return;

        const entry = document.createElement('div');
        entry.className = 'network-call';
        entry.dataset.id = call.id;

        entry.innerHTML = `
            <span class="method-badge ${call.method.toLowerCase()}">${call.method}</span>
            <span class="endpoint">${call.endpoint}</span>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                <span class="status-code ${call.isSuccess ? 'success' : 'error'}">${call.status} ${call.isSuccess ? '✓' : '✗'}</span>
                <span class="latency">${call.latency}ms</span>
            </div>
            <span class="call-time">${this.formatTime(call.timestamp)}</span>
        `;

        // Insert at the top
        if (this.listElement.firstChild) {
            this.listElement.insertBefore(entry, this.listElement.firstChild);
        } else {
            this.listElement.appendChild(entry);
        }
    }

    formatTime(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    clear() {
        this.calls = [];
        if (this.listElement) {
            this.listElement.innerHTML = '';
        }
    }

    getCalls() {
        return this.calls;
    }

    getStats() {
        const total = this.calls.length;
        const successful = this.calls.filter(c => c.isSuccess).length;
        const failed = total - successful;
        const avgLatency = total > 0
            ? Math.round(this.calls.reduce((sum, c) => sum + c.latency, 0) / total)
            : 0;

        return {
            total,
            successful,
            failed,
            avgLatency
        };
    }
}

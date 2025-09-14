// =============================================================================
// API Client with Error Handling and Retry Logic
// =============================================================================

/**
 * Enhanced API client with automatic retry, error handling, and offline support
 */
class APIClient {
    constructor() {
        this.retryAttempts = 3;
        this.retryDelay = 1000; // 1 second
        this.offlineQueue = [];
        
        // Monitor online/offline status
        window.addEventListener('online', () => this.processOfflineQueue());
        window.addEventListener('offline', () => console.log('App is offline'));
    }
    
    /**
     * Make API request with retry logic
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @param {number} attempt - Current attempt number
     * @returns {Promise} Response promise
     */
    async makeRequest(endpoint, options = {}, attempt = 1) {
        try {
            const response = await window.API.request(endpoint, options);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return response;
        } catch (error) {
            console.error(`API request failed (attempt ${attempt}):`, error);
            
            // Retry logic
            if (attempt < this.retryAttempts && this.shouldRetry(error)) {
                console.log(`Retrying in ${this.retryDelay}ms...`);
                await this.delay(this.retryDelay);
                return this.makeRequest(endpoint, options, attempt + 1);
            }
            
            // If offline, queue the request
            if (!navigator.onLine) {
                this.queueOfflineRequest(endpoint, options);
                throw new Error('Request queued for when online');
            }
            
            throw error;
        }
    }
    
    /**
     * Determine if request should be retried
     * @param {Error} error - The error that occurred
     * @returns {boolean} Whether to retry
     */
    shouldRetry(error) {
        // Retry on network errors or 5xx server errors
        return error.message.includes('fetch') || 
               error.message.includes('5') ||
               error.message.includes('timeout');
    }
    
    /**
     * Delay execution
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Delay promise
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Queue request for offline processing
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     */
    queueOfflineRequest(endpoint, options) {
        this.offlineQueue.push({ endpoint, options, timestamp: Date.now() });
        localStorage.setItem('offline_queue', JSON.stringify(this.offlineQueue));
    }
    
    /**
     * Process queued offline requests
     */
    async processOfflineQueue() {
        const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
        
        for (const request of queue) {
            try {
                await this.makeRequest(request.endpoint, request.options);
                console.log('Offline request processed:', request.endpoint);
            } catch (error) {
                console.error('Failed to process offline request:', error);
            }
        }
        
        // Clear processed queue
        localStorage.removeItem('offline_queue');
        this.offlineQueue = [];
    }
    
    // =============================================================================
    // Specific API Methods
    // =============================================================================
    
    /**
     * User Authentication
     */
    async login(username, password) {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        
        const response = await this.makeRequest(window.API.endpoints.auth.login, {
            method: 'POST',
            body: formData,
            headers: {} // Let browser set Content-Type for FormData
        });
        
        const data = await response.json();
        
        // Store tokens
        localStorage.setItem('access_token', data.access_token);
        if (data.refresh_token) {
            localStorage.setItem('refresh_token', data.refresh_token);
        }
        
        return data;
    }
    
    /**
     * User Registration
     */
    async register(userData) {
        const response = await this.makeRequest(window.API.endpoints.auth.register, {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        return response.json();
    }
    
    /**
     * Get User Profile
     */
    async getUserProfile() {
        const response = await this.makeRequest(window.API.endpoints.user.profile);
        return response.json();
    }
    
    /**
     * Submit Detection Request
     */
    async submitDetection(imageFile, farmId, metadata = {}) {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('farm_id', farmId);
        formData.append('metadata', JSON.stringify(metadata));
        
        const response = await this.makeRequest(window.API.endpoints.detection.submit, {
            method: 'POST',
            body: formData,
            headers: {} // Let browser set Content-Type for FormData
        });
        
        return response.json();
    }
    
    /**
     * Stream Query (for chat/QA)
     */
    async streamQuery(query, language = 'en') {
        const response = await this.makeRequest(window.API.endpoints.chat.stream, {
            method: 'POST',
            body: JSON.stringify({
                text: query,
                lang: language,
                translate_to: language
            })
        });
        
        return response; // Return response for streaming
    }
    
    /**
     * Get Community Questions
     */
    async getCommunityQuestions(page = 1, category = null) {
        let endpoint = `${window.API.endpoints.community.questions}?page=${page}`;
        if (category) {
            endpoint += `&category=${category}`;
        }
        
        const response = await this.makeRequest(endpoint);
        return response.json();
    }
    
    /**
     * Post Community Question
     */
    async postCommunityQuestion(questionData) {
        const response = await this.makeRequest(window.API.endpoints.community.questions, {
            method: 'POST',
            body: JSON.stringify(questionData)
        });
        
        return response.json();
    }
}

// Create global API client instance
window.apiClient = new APIClient();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIClient;
}
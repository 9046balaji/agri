// =============================================================================
// Frontend API Configuration
// =============================================================================

/**
 * API Configuration for different environments
 * This centralizes all API endpoints and handles environment-specific URLs
 */

class APIConfig {
    constructor() {
        // Detect environment
        this.isDevelopment = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1';
        
        // Set base URLs based on environment
        if (this.isDevelopment) {
            // ✅ CORRECT: Point to Docker-exposed backend port
            this.baseURL = 'http://localhost:8005';
        } else {
            // Production: Use relative URLs or production domain
            this.baseURL = window.location.origin.replace(':8080', ':8005');
        }
        
        // API endpoints
        this.endpoints = {
            // Authentication
            auth: {
                register: '/register',
                login: '/token',
                refresh: '/auth/refresh',
                logout: '/auth/logout'
            },
            
            // User management
            user: {
                profile: '/users/me',
                update: '/users/me',
                delete: '/users/me'
            },
            
            // Farm management
            farms: {
                list: '/farms',
                create: '/farms',
                get: (id) => `/farms/${id}`,
                update: (id) => `/farms/${id}`,
                delete: (id) => `/farms/${id}`
            },
            
            // Detection services
            detection: {
                upload: '/detection/uploads',
                submit: '/detection/submit',
                results: (id) => `/detection/${id}`,
                feedback: (id) => `/detection/${id}/feedback`
            },
            
            // Advisory services
            advisory: {
                crops: '/advisory/crops',
                recommendations: (cropId) => `/advisory/crops/${cropId}/recommendations`
            },
            
            // Community features
            community: {
                questions: '/community/questions',
                answers: (questionId) => `/community/questions/${questionId}/answers`,
                vote: '/community/vote'
            },
            
            // Chat/QA
            chat: {
                query: '/query',
                stream: '/stream-query',
                history: '/chat/history'
            }
        };
    }
    
    /**
     * Get full URL for an endpoint
     * @param {string} endpoint - The endpoint path
     * @returns {string} Full URL
     */
    getURL(endpoint) {
        return `${this.baseURL}${endpoint}`;
    }
    
    /**
     * Get default headers for API requests
     * @returns {Object} Headers object
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        // Add auth token if available
        const token = localStorage.getItem('access_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }
    
    /**
     * Make authenticated API request
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Fetch options
     * @returns {Promise} Fetch promise
     */
    async request(endpoint, options = {}) {
        const url = this.getURL(endpoint);
        const config = {
            headers: this.getHeaders(),
            ...options
        };
        
        try {
            const response = await fetch(url, config);
            
            // Handle token refresh if needed
            if (response.status === 401) {
                const refreshed = await this.refreshToken();
                if (refreshed) {
                    // Retry with new token
                    config.headers = this.getHeaders();
                    return fetch(url, config);
                } else {
                    // Redirect to login
                    window.location.href = '/login';
                    return;
                }
            }
            
            return response;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }
    
    /**
     * Refresh authentication token
     * @returns {boolean} Success status
     */
    async refreshToken() {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) return false;
        
        try {
            const response = await fetch(this.getURL(this.endpoints.auth.refresh), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken })
            });
            
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('access_token', data.access_token);
                return true;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
        }
        
        return false;
    }
}

// Create global API instance
window.API = new APIConfig();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIConfig;
}
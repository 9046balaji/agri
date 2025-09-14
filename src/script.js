/**
 * Agricultural AI Platform - Main JavaScript Application
 * 
 * This file contains all the interactive functionality for the agricultural AI platform,
 * including authentication, camera integration, voice commands, offline support,
 * and accessibility features.
 */

// Global Application State
const AppState = {
    currentUser: null,
    currentPage: 'auth',
    isOffline: false,
    voiceEnabled: false,
    highContrast: false,
    largeText: false,
    detectionHistory: [],
    offlineQueue: [],
    camera: {
        stream: null,
        facing: 'environment'
    },
    weather: {
        lastUpdate: null,
        data: null
    },
    backendStatus: {
        available: false,
        lastChecked: null
    },
    chatbot: {
        currentSession: null,
        isTyping: false,
        sessions: [],
        messageHistory: []
    }
};

// Local Storage Keys
const STORAGE_KEYS = {
    USER_PROFILE: 'agri_user_profile',
    SETTINGS: 'agri_settings',
    DETECTION_HISTORY: 'agri_detection_history',
    OFFLINE_QUEUE: 'agri_offline_queue',
    WEATHER_CACHE: 'agri_weather_cache',
    COMMUNITY_QUESTIONS: 'agri_community_questions'
};

/**
 * Application Initialization
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Agricultural AI Platform - Initializing...');
    
    // Initialize application
    initializeApp();
    
    // Set up event listeners
    setupEventListeners();
    
    // Check for saved session
    checkSavedSession();
    
    // Initialize offline support
    initializeOfflineSupport();
    
    // Initialize accessibility features
    initializeAccessibility();
    
    // Start loading sequence
    simulateLoading();
});

/**
 * Initialize the application with default settings
 */
function initializeApp() {
    // Load saved settings
    loadSettings();
    
    // Initialize voice recognition if supported
    initializeVoiceRecognition();
    
    // Set up service worker for offline support
    registerServiceWorker();
    
    // Initialize camera permissions
    checkCameraPermissions();
    
    // Load detection history
    loadDetectionHistory();
    
    // Check network status
    updateNetworkStatus();
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Navigation event listeners
    setupNavigationListeners();
    
    // Form event listeners
    setupFormListeners();
    
    // Camera event listeners
    setupCameraListeners();
    
    // Voice command listeners
    setupVoiceListeners();
    
    // Accessibility listeners
    setupAccessibilityListeners();
    
    // Network status listeners
    setupNetworkListeners();
    
    // Keyboard shortcuts
    setupKeyboardShortcuts();
}

/**
 * Navigation Event Listeners
 */
function setupNavigationListeners() {
    // Main navigation links
    document.querySelectorAll('.nav-link, .bottom-nav-item').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            if (page) {
                navigateToPage(page);
            }
        });
    });

    // Menu toggle for mobile
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.getElementById('main-nav');
    
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', function() {
            mainNav.classList.toggle('active');
            menuToggle.classList.toggle('open', mainNav.classList.contains('active'));
        });
    }

    // User menu dropdown
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-dropdown');
    
    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', function() {
            userDropdown.classList.toggle('hidden');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.add('hidden');
            }
        });
    }
}

/**
 * Form Event Listeners
 */
function setupFormListeners() {
    // Authentication form validation
    const phoneInput = document.getElementById('phone-number');
    const roleSelect = document.getElementById('user-role');
    const languageSelect = document.getElementById('language');
    
    if (phoneInput) {
        phoneInput.addEventListener('input', validatePhoneNumber);
        phoneInput.addEventListener('blur', validatePhoneNumber);
    }
    
    if (roleSelect) {
        roleSelect.addEventListener('change', function() {
            updateRoleSpecificContent(this.value);
        });
    }
    
    if (languageSelect) {
        languageSelect.addEventListener('change', function() {
            changeLanguage(this.value);
        });
    }

    // Form submission handlers
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', handleFormSubmission);
    });
}

/**
 * Camera Event Listeners
 */
function setupCameraListeners() {
    // File input for gallery upload
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }
}

/**
 * Voice Command Listeners
 */
function setupVoiceListeners() {
    const voiceBtn = document.getElementById('voice-btn');
    const voiceFloatBtn = document.getElementById('voice-float-btn');
    
    if (voiceBtn) {
        voiceBtn.addEventListener('click', toggleVoiceCommand);
    }
    
    if (voiceFloatBtn) {
        voiceFloatBtn.addEventListener('click', toggleVoiceCommand);
    }
}

/**
 * Accessibility Listeners
 */
function setupAccessibilityListeners() {
    const accessibilityBtn = document.getElementById('accessibility-btn');
    if (accessibilityBtn) {
        accessibilityBtn.addEventListener('click', openAccessibilityModal);
    }
}

/**
 * Network Status Listeners
 */
function setupNetworkListeners() {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
}

/**
 * Keyboard Shortcuts
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Voice command shortcut (V key)
        if (e.key === 'v' || e.key === 'V') {
            if (e.ctrlKey || e.metaKey) return; // Don't interfere with Ctrl+V
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
            
            e.preventDefault();
            toggleVoiceCommand();
        }
        
        // Navigation shortcuts
        if (e.altKey) {
            switch(e.key) {
                case '1':
                    e.preventDefault();
                    navigateToPage('dashboard');
                    break;
                case '2':
                    e.preventDefault();
                    navigateToPage('detection');
                    break;
                case '3':
                    e.preventDefault();
                    navigateToPage('advisory');
                    break;
                case '4':
                    e.preventDefault();
                    navigateToPage('weather');
                    break;
                case '5':
                    e.preventDefault();
                    navigateToPage('profile');
                    break;
            }
        }
        
        // Escape key to close modals
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

/**
 * Page Navigation
 */
function navigateToPage(page) {
    console.log(`Navigating to: ${page}`);
    
    // Hide all pages
    document.querySelectorAll('.page-container').forEach(container => {
        container.classList.remove('active');
    });
    
    // Show target page
    const targetPage = document.getElementById(`${page}-screen`);
    if (targetPage) {
        targetPage.classList.add('active');
        AppState.currentPage = page;
        
        // Update navigation active states
        updateNavigationState(page);
        
        // Page-specific initialization
        initializePage(page);
        
        // Update browser history (for back button support)
        history.pushState({ page: page }, '', `#${page}`);
        
        // Announce page change for screen readers
        announcePageChange(page);
    } else {
        console.error(`Page not found: ${page}`);
    }
}

/**
 * Update navigation active states
 */
function updateNavigationState(activePage) {
    // Update main navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.page === activePage);
    });
    
    // Update bottom navigation
    document.querySelectorAll('.bottom-nav-item').forEach(link => {
        link.classList.toggle('active', link.dataset.page === activePage);
    });
}

/**
 * Initialize page-specific functionality
 */
function initializePage(page) {
    switch(page) {
        case 'dashboard':
            initializeDashboard();
            break;
        case 'detection':
            initializeDetection();
            break;
        case 'advisory':
            initializeAdvisory();
            break;
        case 'weather':
            initializeWeather();
            break;
        case 'ask-community':
            initializeAskCommunity();
            break;
        case 'chatbot':
            initializeChatbot();
            break;
        case 'data-hub':
            initializeDataHub();
            break;
        case 'admin':
            initializeAdmin();
            break;
        case 'profile':
            initializeProfile();
            break;
        case 'settings':
            initializeSettings();
            break;
    }
}

/**
 * Authentication Functions
 */
function authenticate() {
    const phoneNumber = document.getElementById('phone-number').value;
    const userRole = document.getElementById('user-role').value;
    const language = document.getElementById('language').value;
    const dataConsent = document.getElementById('data-consent').checked;
    const locationConsent = document.getElementById('location-consent').checked;
    
    // Validate required fields
    if (!phoneNumber || !userRole || !dataConsent) {
        showError('Please fill in all required fields and accept data consent.');
        return;
    }
    
    // Validate phone number
    if (!isValidPhoneNumber(phoneNumber)) {
        showError('Please enter a valid phone number.');
        return;
    }
    
    // Create user profile
    const userProfile = {
        phoneNumber: phoneNumber,
        role: userRole,
        language: language,
        consents: {
            dataCollection: dataConsent,
            locationTracking: locationConsent
        },
        createdAt: new Date().toISOString()
    };
    
    // Save user profile
    AppState.currentUser = userProfile;
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userProfile));
    
    // Update UI for role
    updateUIForRole(userRole);
    
    // Show success message
    showSuccess('Authentication successful! Welcome to AgriAI Platform.');
    
    // Navigate to dashboard
    setTimeout(() => {
        navigateToPage('dashboard');
    }, 1500);
}

/**
 * Phone number validation
 */
function validatePhoneNumber() {
    const phoneInput = document.getElementById('phone-number');
    const phoneNumber = phoneInput.value;
    
    if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
        phoneInput.classList.add('error');
        showFieldError(phoneInput, 'Please enter a valid phone number (e.g., +1234567890)');
    } else {
        phoneInput.classList.remove('error');
        hideFieldError(phoneInput);
    }
}

/**
 * Check if phone number is valid
 */
function isValidPhoneNumber(phone) {
    // Basic international phone number validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/[\s-()]/g, ''));
}

/**
 * Update UI based on user role
 */
function updateUIForRole(role) {
    // Show/hide role-specific elements
    document.querySelectorAll('.farmer-only').forEach(el => {
        el.classList.toggle('show', role === 'farmer');
    });
    
    document.querySelectorAll('.field-agent-only').forEach(el => {
        el.classList.toggle('show', role === 'field-agent');
    });
    
    document.querySelectorAll('.researcher-only').forEach(el => {
        el.classList.toggle('show', role === 'researcher');
    });
    
    document.querySelectorAll('.admin-only').forEach(el => {
        el.classList.toggle('show', role === 'admin');
    });
    
    // Update user role display
    const roleDisplay = document.getElementById('user-role-display');
    if (roleDisplay) {
        roleDisplay.textContent = role.charAt(0).toUpperCase() + role.slice(1).replace('-', ' ');
    }
    
    // Update avatar
    const avatarText = document.querySelector('.avatar-text');
    if (avatarText) {
        avatarText.textContent = role.charAt(0).toUpperCase();
    }
}

/**
 * Dashboard Initialization
 */
function initializeDashboard() {
    updateWeatherWidget();
    updateActivityFeed();
    updateFarmStatus();
    updateSyncStatus();
}

/**
 * Update weather widget
 */
function updateWeatherWidget() {
    // Simulate weather data (would be API call in real implementation)
    const weatherInfo = document.getElementById('weather-info');
    if (weatherInfo) {
        const mockWeatherData = {
            temperature: Math.floor(Math.random() * 15) + 20, // 20-35°C
            description: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 4)],
            humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
            rainChance: Math.floor(Math.random() * 100) // 0-100%
        };
        
        const weatherMain = weatherInfo.querySelector('.weather-main');
        if (weatherMain) {
            weatherMain.innerHTML = `
                <span class="weather-temp">${mockWeatherData.temperature}°C</span>
                <span class="weather-desc">${mockWeatherData.description}</span>
            `;
        }
        
        const weatherDetails = weatherInfo.querySelector('.weather-details');
        if (weatherDetails) {
            weatherDetails.innerHTML = `
                <span>Humidity: ${mockWeatherData.humidity}%</span>
                <span>Rain Chance: ${mockWeatherData.rainChance}%</span>
            `;
        }
    }
}

/**
 * Update activity feed
 */
function updateActivityFeed() {
    // Load recent activities from detection history
    const activities = AppState.detectionHistory.slice(0, 3);
    // This would populate the activity list in a real implementation
    console.log('Updated activity feed with', activities.length, 'items');
}

/**
 * Update farm status for farmers
 */
function updateFarmStatus() {
    if (AppState.currentUser?.role === 'farmer') {
        // Update farm statistics
        // This would be populated from real data
        console.log('Updated farm status for farmer dashboard');
    }
}

/**
 * Update sync status indicator
 */
function updateSyncStatus() {
    const syncStatus = document.getElementById('sync-status');
    if (syncStatus) {
        const syncIcon = syncStatus.querySelector('.sync-icon');
        const syncText = syncStatus.querySelector('.sync-text');
        
        if (AppState.isOffline) {
            syncIcon.textContent = '⚠️';
            syncText.textContent = 'Offline - data will sync when connected';
            syncIcon.classList.remove('synced');
        } else if (AppState.offlineQueue.length > 0) {
            syncIcon.textContent = '🔄';
            syncText.textContent = `Syncing ${AppState.offlineQueue.length} items...`;
            syncIcon.classList.remove('synced');
        } else {
            syncIcon.textContent = '✅';
            syncText.textContent = 'All data synced';
            syncIcon.classList.add('synced');
        }
    }
}

/**
 * Detection Screen Initialization
 */
function initializeDetection() {
    setupCamera();
    loadDetectionHistory();
    displayDetectionHistory();
}

/**
 * Set up camera for detection
 */
async function setupCamera() {
    try {
        const video = document.getElementById('camera-stream');
        if (!video) return;
        
        // Stop existing stream
        if (AppState.camera.stream) {
            AppState.camera.stream.getTracks().forEach(track => track.stop());
        }
        
        // Request camera permission and stream
        const constraints = {
            video: {
                facingMode: AppState.camera.facing,
                width: { ideal: 1280 },
                height: { ideal: 960 }
            }
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        AppState.camera.stream = stream;
        video.srcObject = stream;
        
        console.log('Camera initialized successfully');
    } catch (error) {
        console.error('Camera initialization failed:', error);
        showError('Unable to access camera. Please check permissions.');
        
        // Show alternative upload option
        showCameraFallback();
    }
}

/**
 * Show camera fallback options
 */
function showCameraFallback() {
    const cameraView = document.getElementById('camera-view');
    if (cameraView) {
        cameraView.innerHTML = `
            <div class="camera-fallback">
                <div class="fallback-content">
                    <h3>Camera not available</h3>
                    <p>Upload an image from your gallery instead</p>
                    <button class="btn btn-primary" onclick="uploadFromGallery()">
                        📁 Choose Image
                    </button>
                </div>
            </div>
        `;
    }
}

/**
 * Capture image from camera
 */
function captureImage() {
    const video = document.getElementById('camera-stream');
    const canvas = document.getElementById('camera-canvas');
    
    if (!video || !canvas) {
        showError('Camera not available');
        return;
    }
    
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to blob and process
    canvas.toBlob(blob => {
        if (blob) {
            processDetectionImage(blob);
        } else {
            showError('Failed to capture image');
        }
    }, 'image/jpeg', 0.8);
}

/**
 * Switch camera (front/back)
 */
async function switchCamera() {
    AppState.camera.facing = AppState.camera.facing === 'environment' ? 'user' : 'environment';
    await setupCamera();
}

/**
 * Upload from gallery
 */
function uploadFromGallery() {
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        fileInput.click();
    }
}

/**
 * Handle file upload
 */
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        processDetectionImage(file);
    } else {
        showError('Please select a valid image file');
    }
}

/**
 * Process detection image
 */
async function processDetectionImage(imageFile) {
    try {
        showLoading('Analyzing image...');
        
        // Create image URL for display
        const imageUrl = URL.createObjectURL(imageFile);
        
        // Display the image
        const detectedImage = document.getElementById('detected-image');
        if (detectedImage) {
            detectedImage.src = imageUrl;
        }
        
        // Show results section
        const resultsSection = document.getElementById('detection-results');
        if (resultsSection) {
            resultsSection.style.display = 'block';
        }
        
        // Simulate AI detection (would be actual API call)
        await simulateDetection(imageFile);
        
        hideLoading();
        
    } catch (error) {
        hideLoading();
        console.error('Detection processing failed:', error);
        showError('Failed to process image. Please try again.');
    }
}

/**
 * Simulate AI detection process
 */
async function simulateDetection(imageFile) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock detection results
    const mockResults = {
        confidence: Math.floor(Math.random() * 20) + 80, // 80-100%
        diagnosis: [
            'Healthy crop - no diseases detected',
            'Early stage bacterial blight',
            'Nutrient deficiency detected',
            'Fungal infection - leaf spot disease',
            'Pest damage - aphid infestation'
        ][Math.floor(Math.random() * 5)],
        treatments: [
            {
                title: 'Preventive Care',
                description: 'Maintain proper spacing and ensure good air circulation',
                steps: ['Remove affected leaves', 'Apply organic fungicide', 'Monitor daily']
            }
        ]
    };
    
    // Update UI with results
    displayDetectionResults(mockResults, imageFile);
    
    // Save to history
    await saveDetectionToHistory(mockResults, imageFile);
}

/**
 * Display detection results
 */
function displayDetectionResults(results, imageFile) {
    // Update confidence score
    const confidenceValue = document.getElementById('confidence-value');
    if (confidenceValue) {
        confidenceValue.textContent = `${results.confidence}%`;
        
        // Update confidence color based on score
        const confidenceScore = document.querySelector('.confidence-score');
        if (confidenceScore) {
            if (results.confidence >= 90) {
                confidenceScore.style.background = 'var(--success)';
            } else if (results.confidence >= 70) {
                confidenceScore.style.background = 'var(--warning)';
            } else {
                confidenceScore.style.background = 'var(--error)';
            }
        }
    }
    
    // Update diagnosis text
    const diagnosisText = document.getElementById('diagnosis-text');
    if (diagnosisText) {
        diagnosisText.textContent = results.diagnosis;
    }
    
    // Update treatments
    if (results.treatments && results.treatments.length > 0) {
        const treatmentSection = document.getElementById('treatment-section');
        const treatmentList = document.getElementById('treatment-list');
        
        if (treatmentSection && treatmentList) {
            treatmentSection.style.display = 'block';
            
            treatmentList.innerHTML = results.treatments.map(treatment => `
                <div class="treatment-item">
                    <div class="treatment-title">${treatment.title}</div>
                    <div class="treatment-desc">${treatment.description}</div>
                    <ul class="treatment-steps">
                        ${treatment.steps.map(step => `<li>${step}</li>`).join('')}
                    </ul>
                </div>
            `).join('');
        }
    }
}

/**
 * Save detection to history
 */
async function saveDetectionToHistory(results, imageFile) {
    // Convert image to base64 data URL for persistent storage
    const imageData = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(imageFile);
    });

    const detection = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        confidence: results.confidence,
        diagnosis: results.diagnosis,
        treatments: results.treatments,
        imageData: imageData,
        synced: !AppState.isOffline
    };
    
    AppState.detectionHistory.unshift(detection);
    
    // Limit history to 50 items
    if (AppState.detectionHistory.length > 50) {
        AppState.detectionHistory = AppState.detectionHistory.slice(0, 50);
    }
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.DETECTION_HISTORY, JSON.stringify(AppState.detectionHistory));
    
    // Add to offline queue if offline
    if (AppState.isOffline) {
        AppState.offlineQueue.push({
            type: 'detection',
            data: detection
        });
        saveOfflineQueue();
    }
    
    // Update history display
    displayDetectionHistory();
}

/**
 * Load detection history from storage
 */
function loadDetectionHistory() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.DETECTION_HISTORY);
        if (stored) {
            let history = JSON.parse(stored);
            // Filter out detections without valid imageData (clean up old blob URLs)
            history = history.filter(detection => detection.imageData && detection.imageData.startsWith('data:'));
            AppState.detectionHistory = history;
            // Save cleaned history back to localStorage
            localStorage.setItem(STORAGE_KEYS.DETECTION_HISTORY, JSON.stringify(history));
        }
    } catch (error) {
        console.error('Failed to load detection history:', error);
        AppState.detectionHistory = [];
    }
}

/**
 * Clear detection history
 */
function clearDetectionHistory() {
    AppState.detectionHistory = [];
    localStorage.removeItem(STORAGE_KEYS.DETECTION_HISTORY);
    displayDetectionHistory();
    showSuccess('Detection history cleared');
}

/**
 * Display detection history
 */
function displayDetectionHistory() {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;
    
    if (AppState.detectionHistory.length === 0) {
        historyList.innerHTML = `
            <div class="history-empty">
                <p>No detection history yet. Take your first photo to get started!</p>
            </div>
        `;
        return;
    }
    
    historyList.innerHTML = AppState.detectionHistory.slice(0, 10).filter(detection => detection.imageData).map(detection => `
        <div class="history-item" onclick="viewDetectionDetails('${detection.id}')">
            <div class="history-image">
                <img src="${detection.imageData}" alt="Detection image" onerror="this.src='data:image/svg+xml,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"80\\" height=\\"80\\" viewBox=\\"0 0 80 80\\"><rect width=\\"80\\" height=\\"80\\" fill=\\"%23f3f4f6\\"/><text x=\\"40\\" y=\\"45\\" text-anchor=\\"middle\\" fill=\\"%236b7280\\" font-size=\\"12\\">No Image</text></svg>'">
            </div>
            <div class="history-content">
                <div class="history-diagnosis">${detection.diagnosis}</div>
                <div class="history-date">${formatDate(detection.timestamp)}</div>
            </div>
            <div class="history-confidence">${detection.confidence}%</div>
            ${!detection.synced ? '<div class="sync-pending">⏳ Pending sync</div>' : ''}
        </div>
    `).join('');
}

/**
 * Save detection result
 */
function saveResult() {
    showSuccess('Detection result saved to your history');
    // The result is already saved in saveDetectionToHistory
}

/**
 * Share detection result
 */
function shareResult() {
    if (navigator.share) {
        navigator.share({
            title: 'Crop Detection Result',
            text: 'Check out my crop detection result from AgriAI Platform',
            url: window.location.href
        }).catch(err => console.log('Error sharing:', err));
    } else {
        // Fallback for browsers without Web Share API
        const textArea = document.createElement('textarea');
        textArea.value = window.location.href;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showSuccess('Link copied to clipboard!');
    }
}

/**
 * Retake photo
 */
function retakePhoto() {
    const resultsSection = document.getElementById('detection-results');
    if (resultsSection) {
        resultsSection.style.display = 'none';
    }
    
    // Reset camera if needed
    if (AppState.camera.stream) {
        setupCamera();
    }
}

/**
 * Advisory Screen Initialization
 */
function initializeAdvisory() {
    loadCropAdvisory();
}

/**
 * Load crop advisory based on selection
 */
function loadCropAdvisory() {
    const cropSelect = document.getElementById('crop-select');
    const advisoryContent = document.getElementById('advisory-content');
    
    if (!cropSelect || !advisoryContent) return;
    
    const selectedCrop = cropSelect.value;
    
    if (!selectedCrop) {
        advisoryContent.innerHTML = `
            <div class="advisory-placeholder">
                <h3>Select a crop to view advisory information</h3>
                <p>Choose your crop from the dropdown above to get personalized recommendations.</p>
            </div>
        `;
        return;
    }
    
    // Mock advisory data (would come from API)
    const mockAdvisory = generateMockAdvisory(selectedCrop);
    updateAdvisoryDisplay(mockAdvisory);
}

/**
 * Generate mock advisory data
 */
function generateMockAdvisory(crop) {
    const advisoryData = {
        rice: {
            growthStage: 'Tillering',
            daysToNext: 18,
            progress: 65,
            nextIrrigation: 'In 3 days',
            waterRequirement: '30mm',
            soilMoisture: 'Good',
            fertilizers: {
                nitrogen: '40 kg/ha',
                phosphorus: '25 kg/ha',
                potassium: '20 kg/ha'
            },
            pestAlerts: [
                {
                    type: 'warning',
                    name: 'Brown Plant Hopper',
                    description: 'Monitor for early signs. Apply neem-based insecticide if detected.'
                },
                {
                    type: 'info',
                    name: 'Blast Disease',
                    description: 'Weather conditions favorable. Consider preventive spraying.'
                }
            ],
            actionPlan: [
                { day: 'Today', action: 'Apply urea fertilizer' },
                { day: 'Tomorrow', action: 'Check for pest infestation' },
                { day: 'Day 3', action: 'Irrigation if soil moisture is low' },
                { day: 'Day 5', action: 'Weed management' }
            ]
        },
        wheat: {
            growthStage: 'Jointing',
            daysToNext: 25,
            progress: 45,
            nextIrrigation: 'In 2 days',
            waterRequirement: '35mm',
            soilMoisture: 'Moderate',
            fertilizers: {
                nitrogen: '50 kg/ha',
                phosphorus: '30 kg/ha',
                potassium: '25 kg/ha'
            },
            pestAlerts: [
                {
                    type: 'warning',
                    name: 'Aphid Infestation',
                    description: 'Early detection crucial. Monitor leaf undersides.'
                }
            ],
            actionPlan: [
                { day: 'Today', action: 'Check soil moisture' },
                { day: 'Tomorrow', action: 'Apply top-dress nitrogen' },
                { day: 'Day 4', action: 'Weed control' }
            ]
        }
        // Add more crops as needed
    };
    
    return advisoryData[crop] || advisoryData.rice; // Default to rice
}

/**
 * Update advisory display
 */
function updateAdvisoryDisplay(advisory) {
    // Update growth stage
    const growthStage = document.getElementById('growth-stage');
    const daysToNext = document.getElementById('days-to-next');
    const progressFill = document.querySelector('.progress-fill');
    
    if (growthStage) growthStage.textContent = advisory.growthStage;
    if (daysToNext) daysToNext.textContent = `${advisory.daysToNext} days`;
    if (progressFill) progressFill.style.width = `${advisory.progress}%`;
    
    // Update irrigation info
    const nextIrrigation = document.getElementById('next-irrigation');
    const waterRequirement = document.getElementById('water-requirement');
    const soilMoisture = document.getElementById('soil-moisture');
    
    if (nextIrrigation) nextIrrigation.textContent = advisory.nextIrrigation;
    if (waterRequirement) waterRequirement.textContent = advisory.waterRequirement;
    if (soilMoisture) soilMoisture.textContent = advisory.soilMoisture;
    
    // Update fertilizer info
    const fertilizerInfo = document.querySelector('.fertilizer-info');
    if (fertilizerInfo) {
        fertilizerInfo.innerHTML = `
            <div class="fertilizer-item">
                <strong>Nitrogen (N):</strong> Apply ${advisory.fertilizers.nitrogen}
            </div>
            <div class="fertilizer-item">
                <strong>Phosphorus (P):</strong> Apply ${advisory.fertilizers.phosphorus}
            </div>
            <div class="fertilizer-item">
                <strong>Potassium (K):</strong> Apply ${advisory.fertilizers.potassium}
            </div>
        `;
    }
    
    // Update pest alerts
    const pestAlerts = document.querySelector('.pest-alerts');
    if (pestAlerts) {
        pestAlerts.innerHTML = advisory.pestAlerts.map(alert => `
            <div class="alert-item ${alert.type}">
                <span class="alert-icon">${alert.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
                <div class="alert-content">
                    <strong>${alert.name}</strong>
                    <p>${alert.description}</p>
                </div>
            </div>
        `).join('');
    }
    
    // Update action plan
    const actionPlan = document.querySelector('.action-plan');
    if (actionPlan) {
        actionPlan.innerHTML = advisory.actionPlan.map(item => `
            <div class="day-item">
                <strong>${item.day}:</strong> ${item.action}
            </div>
        `).join('');
    }
}

/**
 * Weather Screen Initialization
 */
function initializeWeather() {
    loadWeatherData();
    loadWeatherForecast();
    loadAgriculturalAlerts();
}

/**
 * Load current weather data
 */
function loadWeatherData() {
    // Mock weather data (would come from weather API)
    const mockWeather = {
        temperature: 28,
        feelsLike: 31,
        description: 'Partly Cloudy',
        humidity: 65,
        windSpeed: 12,
        rainChance: 20,
        uvIndex: 7
    };
    
    updateCurrentWeather(mockWeather);
}

/**
 * Update current weather display
 */
function updateCurrentWeather(weather) {
    const currentWeather = document.querySelector('.current-weather');
    if (!currentWeather) return;
    
    const temperature = currentWeather.querySelector('.temperature');
    const weatherDesc = currentWeather.querySelector('.weather-desc');
    const feelsLike = currentWeather.querySelector('.feels-like');
    
    if (temperature) temperature.textContent = `${weather.temperature}°C`;
    if (weatherDesc) weatherDesc.textContent = weather.description;
    if (feelsLike) feelsLike.textContent = `Feels like ${weather.feelsLike}°C`;
    
    // Update weather details
    const details = currentWeather.querySelectorAll('.weather-detail .detail-value');
    if (details.length >= 4) {
        details[0].textContent = `${weather.humidity}%`;
        details[1].textContent = `${weather.windSpeed} km/h`;
        details[2].textContent = `${weather.rainChance}%`;
        details[3].textContent = `${weather.uvIndex} High`;
    }
}

/**
 * Load weather forecast
 */
function loadWeatherForecast() {
    // Mock 7-day forecast
    const mockForecast = [
        { day: 'Today', icon: '☀️', high: 32, low: 24, rain: 10 },
        { day: 'Tomorrow', icon: '⛅', high: 29, low: 22, rain: 30 },
        { day: 'Wed', icon: '🌦️', high: 26, low: 20, rain: 70 },
        { day: 'Thu', icon: '🌧️', high: 24, low: 19, rain: 90 },
        { day: 'Fri', icon: '⛅', high: 27, low: 21, rain: 40 },
        { day: 'Sat', icon: '☀️', high: 30, low: 23, rain: 15 },
        { day: 'Sun', icon: '☀️', high: 31, low: 24, rain: 5 }
    ];
    
    updateWeatherForecast(mockForecast);
}

/**
 * Update weather forecast display
 */
function updateWeatherForecast(forecast) {
    const forecastGrid = document.querySelector('.forecast-grid');
    if (!forecastGrid) return;
    
    forecastGrid.innerHTML = forecast.map(day => `
        <div class="forecast-day">
            <div class="day-name">${day.day}</div>
            <div class="day-icon">${day.icon}</div>
            <div class="day-temp">${day.high}° / ${day.low}°</div>
            <div class="day-rain">${day.rain}%</div>
        </div>
    `).join('');
}

/**
 * Load agricultural weather alerts
 */
function loadAgriculturalAlerts() {
    const mockAlerts = [
        {
            type: 'success',
            title: 'Good Spraying Conditions',
            message: 'Low wind speed and humidity make this ideal for pesticide application.'
        },
        {
            type: 'warning',
            title: 'Heavy Rain Expected',
            message: 'Postpone field activities on Wednesday-Thursday due to expected rainfall.'
        },
        {
            type: 'info',
            title: 'High UV Index',
            message: 'Protect crops and workers during peak hours (11 AM - 3 PM).'
        }
    ];
    
    updateAgriculturalAlerts(mockAlerts);
}

/**
 * Update agricultural alerts display
 */
function updateAgriculturalAlerts(alerts) {
    const alertList = document.querySelector('.alert-list');
    if (!alertList) return;
    
    alertList.innerHTML = alerts.map(alert => `
        <div class="weather-alert ${alert.type}">
            <span class="alert-icon">${
                alert.type === 'success' ? '✅' : 
                alert.type === 'warning' ? '⚠️' : 'ℹ️'
            }</span>
            <div class="alert-content">
                <strong>${alert.title}</strong>
                <p>${alert.message}</p>
            </div>
        </div>
    `).join('');
}

/**
 * Voice Recognition Implementation
 */
let recognition = null;
let isListening = false;

function initializeVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = AppState.currentUser?.language || 'en-US';
        
        recognition.onstart = function() {
            console.log('Voice recognition started');
            isListening = true;
            showVoiceIndicator();
            updateVoiceButtonState(true);
        };
        
        recognition.onend = function() {
            console.log('Voice recognition ended');
            isListening = false;
            hideVoiceIndicator();
            updateVoiceButtonState(false);
        };
        
        recognition.onresult = function(event) {
            const command = event.results[0][0].transcript.toLowerCase().trim();
            console.log('Voice command:', command);
            processVoiceCommand(command);
        };
        
        recognition.onerror = function(event) {
            console.error('Voice recognition error:', event.error);
            hideVoiceIndicator();
            updateVoiceButtonState(false);
            showError('Voice command not recognized. Please try again.');
        };
        
        AppState.voiceEnabled = true;
        console.log('Voice recognition initialized');
    } else {
        console.warn('Speech recognition not supported in this browser');
    }
}

/**
 * Toggle voice command
 */
function toggleVoiceCommand() {
    if (!recognition) {
        showError('Voice commands not supported in your browser');
        return;
    }
    
    if (isListening) {
        recognition.stop();
    } else {
        recognition.start();
    }
}

/**
 * Process voice command
 */
function processVoiceCommand(command) {
    console.log('Processing voice command:', command);
    
    // Navigation commands
    if (command.includes('dashboard') || command.includes('home')) {
        navigateToPage('dashboard');
        announceAction('Navigating to dashboard');
    } else if (command.includes('detect') || command.includes('camera')) {
        navigateToPage('detection');
        announceAction('Opening detection camera');
    } else if (command.includes('advice') || command.includes('advisory')) {
        navigateToPage('advisory');
        announceAction('Opening crop advisory');
    } else if (command.includes('weather')) {
        navigateToPage('weather');
        announceAction('Opening weather information');
    } else if (command.includes('community') || command.includes('ask')) {
        navigateToPage('ask-community');
        announceAction('Opening community questions');
    } else if (command.includes('profile')) {
        navigateToPage('profile');
        announceAction('Opening user profile');
    } 
    
    // Action commands
    else if (command.includes('take photo') || command.includes('capture')) {
        if (AppState.currentPage === 'detection') {
            captureImage();
            announceAction('Taking photo for disease detection');
        }
    } else if (command.includes('help') || command.includes('support')) {
        showHelp();
        announceAction('Opening help and support');
    } else if (command.includes('settings')) {
        navigateToPage('settings');
        announceAction('Opening settings');
    }
    
    // Accessibility commands
    else if (command.includes('high contrast')) {
        toggleHighContrast();
        announceAction('Toggling high contrast mode');
    } else if (command.includes('large text')) {
        toggleLargeText();
        announceAction('Toggling large text mode');
    }
    
    else {
        showError('Voice command not recognized. Try saying "dashboard", "detect", "weather", "community", or "help".');
    }
}

/**
 * Show voice indicator
 */
function showVoiceIndicator() {
    const indicator = document.getElementById('voice-indicator');
    if (indicator) {
        indicator.classList.remove('hidden');
    }
}

/**
 * Hide voice indicator
 */
function hideVoiceIndicator() {
    const indicator = document.getElementById('voice-indicator');
    if (indicator) {
        indicator.classList.add('hidden');
    }
}

/**
 * Update voice button states
 */
function updateVoiceButtonState(active) {
    const voiceBtn = document.getElementById('voice-btn');
    const voiceFloatBtn = document.getElementById('voice-float-btn');
    
    if (voiceBtn) {
        voiceBtn.textContent = active ? '🔴' : '🎤';
    }
    
    if (voiceFloatBtn) {
        voiceFloatBtn.classList.toggle('active', active);
    }
}

/**
 * Announce action for screen readers
 */
function announceAction(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

/**
 * Announce page change
 */
function announcePageChange(page) {
    const pageNames = {
        'dashboard': 'Dashboard',
        'detection': 'Disease Detection',
        'advisory': 'Crop Advisory',
        'weather': 'Weather Center',
        'data-hub': 'Data Hub',
        'admin': 'Admin Panel',
        'profile': 'User Profile',
        'settings': 'Settings'
    };
    
    announceAction(`Navigated to ${pageNames[page] || page}`);
}

/**
 * Accessibility Functions
 */
function openAccessibilityModal() {
    const modal = document.getElementById('accessibility-modal');
    if (modal) {
        modal.classList.remove('hidden');
        
        // Focus first option for keyboard users
        const firstOption = modal.querySelector('.accessibility-option');
        if (firstOption) {
            firstOption.focus();
        }
    }
}

function closeAccessibilityModal() {
    const modal = document.getElementById('accessibility-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function toggleHighContrast() {
    document.body.classList.toggle('high-contrast');
    AppState.highContrast = document.body.classList.contains('high-contrast');
    
    // Save setting
    saveSettings();
    
    // Announce change
    announceAction(AppState.highContrast ? 'High contrast mode enabled' : 'High contrast mode disabled');
}

function toggleLargeText() {
    document.body.classList.toggle('large-text');
    AppState.largeText = document.body.classList.contains('large-text');
    
    // Save setting
    saveSettings();
    
    // Announce change
    announceAction(AppState.largeText ? 'Large text mode enabled' : 'Large text mode disabled');
}

function enableVoiceMode() {
    if (recognition) {
        AppState.voiceEnabled = true;
        saveSettings();
        showSuccess('Voice commands are now enabled. Press V or click the voice button to start.');
    } else {
        initializeVoiceRecognition();
        if (recognition) {
            AppState.voiceEnabled = true;
            saveSettings();
            showSuccess('Voice commands enabled successfully!');
        } else {
            showError('Voice commands are not supported in your browser.');
        }
    }
}

function enableScreenReader() {
    // Enhance screen reader support
    document.querySelectorAll('img:not([alt])').forEach(img => {
        img.alt = 'Image';
    });
    
    // Add more ARIA labels
    document.querySelectorAll('button:not([aria-label])').forEach(btn => {
        if (btn.textContent.trim()) {
            btn.setAttribute('aria-label', btn.textContent.trim());
        }
    });
    
    announceAction('Screen reader optimizations applied');
    showSuccess('Screen reader support enhanced!');
}

/**
 * Settings Management
 */
function saveSettings() {
    const settings = {
        voiceEnabled: AppState.voiceEnabled,
        highContrast: AppState.highContrast,
        largeText: AppState.largeText,
        language: AppState.currentUser?.language || 'en'
    };
    
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    showSuccess('Settings saved successfully!');
}

function loadSettings() {
    try {
        const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (settings) {
            const parsed = JSON.parse(settings);
            
            AppState.voiceEnabled = parsed.voiceEnabled || false;
            AppState.highContrast = parsed.highContrast || false;
            AppState.largeText = parsed.largeText || false;
            
            // Apply settings
            if (AppState.highContrast) {
                document.body.classList.add('high-contrast');
            }
            if (AppState.largeText) {
                document.body.classList.add('large-text');
            }
        }
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

/**
 * Offline Support
 */
function initializeOfflineSupport() {
    updateNetworkStatus();
    loadOfflineQueue();
}

/**
 * Initialize accessibility features
 */
function initializeAccessibility() {
    // Load accessibility settings and apply them
    loadSettings();
    
    // Set up keyboard shortcuts for accessibility
    document.addEventListener('keydown', function(e) {
        // Alt + H: Toggle high contrast
        if (e.altKey && e.key === 'h') {
            e.preventDefault();
            toggleHighContrast();
        }
        
        // Alt + T: Toggle large text
        if (e.altKey && e.key === 't') {
            e.preventDefault();
            toggleLargeText();
        }
        
        // Alt + V: Toggle voice commands
        if (e.altKey && e.key === 'v') {
            e.preventDefault();
            toggleVoiceCommand();
        }
        
        // Alt + A: Open accessibility modal
        if (e.altKey && e.key === 'a') {
            e.preventDefault();
            openAccessibilityModal();
        }
    });
    
    // Enhance screen reader support
    document.querySelectorAll('button, [role="button"]').forEach(btn => {
        if (!btn.getAttribute('aria-label') && !btn.getAttribute('aria-labelledby')) {
            const text = btn.textContent.trim();
            if (text) {
                btn.setAttribute('aria-label', text);
            }
        }
    });
    
    // Add skip links functionality
    const skipLinks = document.querySelectorAll('.skip-link');
    skipLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const target = document.getElementById(this.getAttribute('href').substring(1));
            if (target) {
                target.focus();
                target.scrollIntoView();
            }
        });
    });
    
    console.log('Accessibility features initialized');
}

function handleOnline() {
    console.log('Network connection restored');
    AppState.isOffline = false;
    
    // Hide offline banner
    const offlineBanner = document.getElementById('offline-banner');
    if (offlineBanner) {
        offlineBanner.classList.add('hidden');
    }
    
    // Process offline queue
    processOfflineQueue();
    
    // Update sync status
    updateSyncStatus();
    
    showSuccess('Connection restored. Syncing data...');
}

function handleOffline() {
    console.log('Network connection lost');
    AppState.isOffline = true;
    
    // Show offline banner
    const offlineBanner = document.getElementById('offline-banner');
    if (offlineBanner) {
        offlineBanner.classList.remove('hidden');
    }
    
    // Update sync status
    updateSyncStatus();
}

function updateNetworkStatus() {
    AppState.isOffline = !navigator.onLine;
    
    if (AppState.isOffline) {
        handleOffline();
    } else {
        handleOnline();
    }
}

function checkConnection() {
    updateNetworkStatus();
    
    if (!AppState.isOffline) {
        showSuccess('Connection restored!');
    } else {
        showError('Still offline. Please check your internet connection.');
    }
}

function processOfflineQueue() {
    if (AppState.offlineQueue.length === 0) return;
    
    console.log(`Processing ${AppState.offlineQueue.length} offline items`);
    
    // Simulate processing offline queue
    AppState.offlineQueue.forEach((item, index) => {
        setTimeout(() => {
            console.log('Syncing:', item.type, item.data.id);
            
            // Remove from queue
            AppState.offlineQueue = AppState.offlineQueue.filter((_, i) => i !== index);
            saveOfflineQueue();
            updateSyncStatus();
            
            if (AppState.offlineQueue.length === 0) {
                showSuccess('All data synced successfully!');
            }
        }, (index + 1) * 1000); // Stagger sync operations
    });
}

function saveOfflineQueue() {
    localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(AppState.offlineQueue));
}

function loadOfflineQueue() {
    try {
        const queue = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
        if (queue) {
            AppState.offlineQueue = JSON.parse(queue);
        }
    } catch (error) {
        console.error('Failed to load offline queue:', error);
        AppState.offlineQueue = [];
    }
}

/**
 * Service Worker Registration
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('./sw.js')
                .then(function(registration) {
                    console.log('Service Worker registered successfully:', registration.scope);
                })
                .catch(function(error) {
                    console.log('Service Worker registration failed:', error);
                });
        });
    }
}

/**
 * Camera Permissions
 */
async function checkCameraPermissions() {
    if (navigator.permissions && navigator.permissions.query) {
        try {
            const result = await navigator.permissions.query({ name: 'camera' });
            console.log('Camera permission status:', result.state);
            
            result.addEventListener('change', function() {
                console.log('Camera permission changed to:', this.state);
            });
        } catch (error) {
            console.log('Camera permission check not supported:', error);
        }
    } else {
        // Fallback for browsers without permissions API
        console.log('Camera permissions API not supported. Assuming permission granted.');
    }
}

/**
 * Utility Functions
 */
function formatDate(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) {
        return 'Just now';
    } else if (diffMinutes < 60) {
        return `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
        return `${diffHours} hours ago`;
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString();
    }
}

function showSuccess(message) {
    showToast(message, 'success');
}

function showError(message) {
    showToast(message, 'error');
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--error)' : 'var(--info)'};
        color: white;
        padding: var(--spacing-md) var(--spacing-lg);
        border-radius: var(--radius-lg);
        z-index: var(--z-toast);
        box-shadow: var(--shadow-lg);
        font-weight: 600;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 4000);
    
    // Add CSS animations if not already present
    if (!document.querySelector('#toast-animations')) {
        const style = document.createElement('style');
        style.id = 'toast-animations';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

function showLoading(message = 'Loading...') {
    let loadingOverlay = document.getElementById('loading-overlay');
    
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loading-overlay';
        loadingOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: var(--z-loading);
            color: white;
            font-size: 1.125rem;
            font-weight: 600;
        `;
        document.body.appendChild(loadingOverlay);
    }
    
    loadingOverlay.innerHTML = `
        <div style="text-align: center;">
            <div style="width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.3); border-top: 4px solid white; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto var(--spacing-md);"></div>
            <div>${message}</div>
        </div>
    `;
    
    loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

function showFieldError(field, message) {
    hideFieldError(field); // Remove existing error
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
}

function hideFieldError(field) {
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
}

/**
 * Additional Page Functions
 */

// Profile page functions
function initializeProfile() {
    loadProfileData();
}

function loadProfileData() {
    if (AppState.currentUser) {
        const profileName = document.getElementById('profile-name');
        const profilePhone = document.getElementById('profile-phone');
        
        if (profileName) profileName.value = AppState.currentUser.name || '';
        if (profilePhone) profilePhone.value = AppState.currentUser.phoneNumber || '';
    }
}

function saveProfile() {
    showSuccess('Profile saved successfully!');
    // Implement actual profile saving logic here
}

function exportData() {
    const data = {
        profile: AppState.currentUser,
        detectionHistory: AppState.detectionHistory,
        settings: JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}')
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agri-ai-data-export.json';
    a.click();
    URL.revokeObjectURL(url);
    
    showSuccess('Data export downloaded successfully!');
}

function deleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        // Clear all data
        localStorage.clear();
        
        // Reset app state
        AppState.currentUser = null;
        AppState.detectionHistory = [];
        AppState.offlineQueue = [];
        
        // Navigate back to auth
        navigateToPage('auth');
        
        showSuccess('Account deleted successfully.');
    }
}

// Settings page functions
function initializeSettings() {
    loadSettingsUI();
}

function loadSettingsUI() {
    const voiceEnabled = document.getElementById('voice-enabled');
    const highContrast = document.getElementById('high-contrast');
    const largeText = document.getElementById('large-text');
    const appLanguage = document.getElementById('app-language');
    
    if (voiceEnabled) voiceEnabled.checked = AppState.voiceEnabled;
    if (highContrast) highContrast.checked = AppState.highContrast;
    if (largeText) largeText.checked = AppState.largeText;
    if (appLanguage && AppState.currentUser) appLanguage.value = AppState.currentUser.language;
}

function toggleVoiceCommands() {
    const checkbox = document.getElementById('voice-enabled');
    if (checkbox.checked) {
        enableVoiceMode();
    } else {
        AppState.voiceEnabled = false;
        saveSettings();
        showSuccess('Voice commands disabled.');
    }
}

function changeLanguage() {
    const languageSelect = document.getElementById('app-language');
    if (languageSelect && AppState.currentUser) {
        AppState.currentUser.language = languageSelect.value;
        localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(AppState.currentUser));
        saveSettings();
        showSuccess('Language preference updated!');
        
        // Update voice recognition language if enabled
        if (recognition) {
            recognition.lang = languageSelect.value;
        }
    }
}

function resetSettings() {
    if (confirm('Reset all settings to default values?')) {
        // Reset app state
        AppState.voiceEnabled = false;
        AppState.highContrast = false;
        AppState.largeText = false;
        
        // Remove CSS classes
        document.body.classList.remove('high-contrast', 'large-text');
        
        // Reset UI
        loadSettingsUI();
        
        // Save default settings
        saveSettings();
        
        showSuccess('Settings reset to default values.');
    }
}

// Admin page functions
function initializeAdmin() {
    showAdminTab('overview');
}

function showAdminTab(tabName) {
    // Hide all admin content
    document.querySelectorAll('.admin-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show target content
    const targetContent = document.getElementById(`admin-${tabName}`);
    if (targetContent) {
        targetContent.classList.add('active');
    }
    
    // Add active class to clicked tab
    const targetTab = document.querySelector(`.admin-tab[onclick="showAdminTab('${tabName}')"]`);
    if (targetTab) {
        targetTab.classList.add('active');
    }
}

function addUser() {
    showSuccess('Add user functionality would be implemented here.');
}

function editUser(userId) {
    showSuccess(`Edit user ${userId} functionality would be implemented here.`);
}

function deactivateUser(userId) {
    if (confirm('Deactivate this user?')) {
        showSuccess(`User ${userId} deactivated.`);
    }
}

function filterLogs() {
    showSuccess('Log filtering functionality would be implemented here.');
}

// Data Hub functions
function initializeDataHub() {
    console.log('Data Hub initialized');
}

function requestDataAccess(datasetId) {
    showSuccess(`Access request submitted for dataset: ${datasetId}`);
}

// Quick action functions (Dashboard)
function openDetection() {
    navigateToPage('detection');
}

function checkWeather() {
    navigateToPage('weather');
}

function getAdvice() {
    navigateToPage('advisory');
}

function askCommunity() {
    navigateToPage('ask-community');
}

function openFieldOps() {
    showSuccess('Field operations management would open here');
}

function showHelp() {
    showSuccess('Help and support system would open here');
}

// Check for saved session
function checkSavedSession() {
    try {
        const savedProfile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
        if (savedProfile) {
            AppState.currentUser = JSON.parse(savedProfile);
            updateUIForRole(AppState.currentUser.role);
            
            // Skip auth screen if user is already logged in
            setTimeout(() => {
                navigateToPage('dashboard');
            }, 1000);
        } else {
            // For testing: Create a temporary user profile to skip authentication
            const tempProfile = {
                phoneNumber: 'test_user_123',
                role: 'farmer',
                language: 'en',
                consents: {
                    dataCollection: true,
                    locationTracking: false
                },
                createdAt: new Date().toISOString()
            };
            
            AppState.currentUser = tempProfile;
            updateUIForRole(tempProfile.role);
            
            // Skip to dashboard for testing
            setTimeout(() => {
                navigateToPage('dashboard');
            }, 1000);
        }
    } catch (error) {
        console.error('Failed to load saved session:', error);
        localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
        
        // Fallback: create temp user for testing
        const tempProfile = {
            phoneNumber: 'test_user_123',
            role: 'farmer',
            language: 'en',
            consents: { dataCollection: true, locationTracking: false },
            createdAt: new Date().toISOString()
        };
        AppState.currentUser = tempProfile;
        updateUIForRole(tempProfile.role);
        navigateToPage('dashboard');
    }
}

// Form submission handler
function handleFormSubmission(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    // Basic form validation and processing would go here
    console.log('Form submitted:', Object.fromEntries(formData));
    
    return false;
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear user session but keep detection history and settings
        AppState.currentUser = null;
        localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
        
        // Stop camera if running
        if (AppState.camera.stream) {
            AppState.camera.stream.getTracks().forEach(track => track.stop());
            AppState.camera.stream = null;
        }
        
        // Navigate to auth screen
        navigateToPage('auth');
        
        showSuccess('Logged out successfully.');
    }
}

// Browser back button support
window.addEventListener('popstate', function(e) {
    const page = e.state?.page || 'auth';
    navigateToPage(page);
});

// Handle direct URL access (e.g., #chatbot)
window.addEventListener('load', function() {
    const hash = window.location.hash.substring(1); // Remove #
    if (hash && ['dashboard', 'detection', 'advisory', 'weather', 'ask-community', 'chatbot', 'data-hub', 'admin', 'profile', 'settings'].includes(hash)) {
        setTimeout(() => {
            navigateToPage(hash);
        }, 2000); // Wait for loading to complete
    }
});

// Loading simulation for initial app load
function simulateLoading() {
    const loadingScreen = document.getElementById('loading-screen');
    const progressBar = document.querySelector('.loading-progress');
    
    if (loadingScreen && progressBar) {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 20;
            progressBar.style.width = Math.min(progress, 100) + '%';
            
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    loadingScreen.classList.add('hidden');
                }, 500);
            }
        }, 200);
    } else {
        // Fallback if loading screen elements are not found
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
            }
        }, 2000);
    }
}

// Error handling for unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    showError('An unexpected error occurred. Please try again.');
    event.preventDefault();
});

// Global error handler
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
    showError('An error occurred. Please refresh the page if problems persist.');
});

/**
 * Check backend connectivity
 */
async function checkBackendStatus() {
    try {
        // Create an AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
        
        const response = await fetch('http://localhost:8005/health', {
            method: 'GET',
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            const data = await response.json();
            AppState.backendStatus.available = true;
            AppState.backendStatus.lastChecked = new Date();
            AppState.backendStatus.info = data;
            updateBackendStatusIndicator(true);
            return true;
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.warn('Backend health check timed out');
        } else {
            console.warn('Backend not available:', error.message);
        }
    }
    
    AppState.backendStatus.available = false;
    AppState.backendStatus.lastChecked = new Date();
    updateBackendStatusIndicator(false);
    return false;
}

/**
 * Update backend status indicator in UI
 */
function updateBackendStatusIndicator(available) {
    const statusIndicator = document.getElementById('backend-status');
    if (!statusIndicator) return;
    
    if (available) {
        statusIndicator.innerHTML = `
            <span class="status-dot online"></span>
            <span class="status-text">AI Assistant Online</span>
        `;
        statusIndicator.className = 'backend-status online';
    } else {
        statusIndicator.innerHTML = `
            <span class="status-dot offline"></span>
            <span class="status-text">AI Assistant Offline</span>
        `;
        statusIndicator.className = 'backend-status offline';
    }
}

/**
 * Ask Community Functions
 */
function initializeAskCommunity() {
    console.log('Initializing Ask Community page...');

    // Check backend status
    checkBackendStatus();

    // Initialize community state
    if (!AppState.communityQuestions) {
        AppState.communityQuestions = [];
    }

    // Set up form event listeners
    setupQuestionForm();

    // Load initial questions
    loadQuestions();

    // Set up filters
    setupFilters();
}

function setupQuestionForm() {
    const form = document.getElementById('question-form');
    const textarea = document.getElementById('question-text');
    const charCount = document.getElementById('char-count');

    if (textarea && charCount) {
        // Character counter
        textarea.addEventListener('input', () => {
            const count = textarea.value.length;
            charCount.textContent = count;
            charCount.style.color = count > 450 ? '#dc2626' : '#6b7280';
        });
    }

    if (form) {
        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await postQuestion();
        });
    }

    // Setup backend query form
    setupBackendQueryForm();
}

function setupBackendQueryForm() {
    const form = document.getElementById('ask-community-form');
    const textarea = document.getElementById('questionInput');
    const charCount = document.getElementById('query-char-count');
    const submitBtn = document.getElementById('query-btn');

    if (!form) return; // Form might not exist on all pages

    // Character counter
    textarea.addEventListener('input', () => {
        const count = textarea.value.length;
        charCount.textContent = count;
        charCount.style.color = count > 450 ? '#dc2626' : '#6b7280';
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const question = textarea.value.trim();
        if (!question) {
            showError('Please enter a question before submitting.');
            return;
        }

        // Disable form during submission
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="spinner small"></div> Processing...';
        textarea.disabled = true;

        const lang = document.getElementById('langSelect').value;
        const translateTo = document.getElementById('translateToSelect').value;

        try {
            const response = await fetch('http://localhost:8005/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: question, lang, translate_to: translateTo })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Server error: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullAnswer = '';
            let originalLang = 'en';
            let statusDiv = document.createElement('div');
            statusDiv.className = 'status-message';
            statusDiv.innerHTML = '<div class="spinner small"></div> Initializing...';

            let answerContainer = document.getElementById('answers-container');
            answerContainer.appendChild(statusDiv);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim());
                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        if (data.error) {
                            throw new Error(data.error);
                        }
                        if (data.response_lang) {
                            originalLang = data.response_lang;
                        }
                        if (data.status) {
                            statusDiv.innerHTML = `<div class="spinner small"></div> ${data.status}`;
                        }
                        if (data.generated_answer_chunk) {
                            fullAnswer += data.generated_answer_chunk;
                            statusDiv.innerHTML = `<div class="spinner small"></div> Generating answer...`;
                        }
                        if (data.status === 'complete') {
                            // Display final answer, contexts, etc.
                            const answerDiv = document.createElement('div');
                            answerDiv.classList.add('answer-item');
                            const answerText = document.createElement('p');
                            answerText.innerHTML = `<strong>AI Answer:</strong> <span class="answer-content">${data.generated_answer}</span>`;
                            answerDiv.appendChild(answerText);

                            if (data.contexts && data.contexts.length > 0) {
                                const sources = document.createElement('div');
                                sources.className = 'sources-section';
                                sources.innerHTML = `<strong>Based on:</strong><br>${data.contexts.slice(0, 2).join('<br>')}`;
                                answerDiv.appendChild(sources);
                            }

                            // Add translation buttons (exclude current lang)
                            const translateDiv = document.createElement('div');
                            translateDiv.classList.add('translate-options');
                            ['en', 'hi', 'te'].forEach(targetLang => {
                                if (targetLang !== originalLang) {
                                    const btn = document.createElement('button');
                                    btn.className = 'translate-btn';
                                    btn.textContent = `Translate to ${targetLang.toUpperCase()}`;
                                    btn.addEventListener('click', async () => {
                                        const originalText = btn.textContent;
                                        btn.disabled = true;
                                        btn.innerHTML = '<div class="spinner tiny"></div> Translating...';

                                        try {
                                            const transRes = await fetch('http://localhost:8005/translate', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ text: fullAnswer, from_lang: originalLang, to_lang: targetLang })
                                            });
                                            if (!transRes.ok) throw new Error('Translation failed');
                                            const transData = await transRes.json();
                                            answerText.querySelector('.answer-content').textContent = transData.translated_text;
                                            btn.textContent = `✓ Translated to ${targetLang.toUpperCase()}`;
                                            btn.classList.add('success');
                                        } catch (err) {
                                            console.error('Translation error:', err);
                                            btn.textContent = 'Translation failed';
                                            btn.classList.add('error');
                                        } finally {
                                            setTimeout(() => {
                                                btn.disabled = false;
                                                btn.textContent = originalText;
                                                btn.classList.remove('success', 'error');
                                            }, 2000);
                                        }
                                    });
                                    translateDiv.appendChild(btn);
                                }
                            });
                            answerDiv.appendChild(translateDiv);

                            answerContainer.appendChild(answerDiv);
                            statusDiv.remove();
                        }
                    } catch (parseError) {
                        console.error('Error parsing response chunk:', parseError);
                        continue;
                    }
                }
            }
        } catch (error) {
            console.error('Query error:', error);
            showError(`Failed to get answer: ${error.message}`);
        } finally {
            // Re-enable form
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="btn-icon">🤖</span> Ask AI';
            textarea.disabled = false;
        }
    });
}

function setupFilters() {
    const filterCategory = document.getElementById('filter-category');
    const sortBy = document.getElementById('sort-by');

    filterCategory.addEventListener('change', () => {
        filterAndDisplayQuestions();
    });

    sortBy.addEventListener('change', () => {
        filterAndDisplayQuestions();
    });
}

async function postQuestion() {
    const text = document.getElementById('question-text').value.trim();
    const category = document.getElementById('question-category').value;
    const imageFile = document.getElementById('question-image').files[0];

    if (!text || !category) {
        showError('Please fill in all required fields.');
        return;
    }

    const btn = document.getElementById('post-question-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<div class="spinner small"></div> Posting...';
    btn.disabled = true;

    try {
        let imageData = null;
        if (imageFile) {
            imageData = await convertImageToBase64(imageFile);
        }

        const questionData = {
            user_id: AppState.currentUser?.id || Date.now().toString(),
            user_name: AppState.currentUser?.name || 'Anonymous Farmer',
            question: text,
            category: category,
            language: document.getElementById('language')?.value || 'en',
            image_data: imageData
        };

        const response = await fetch('http://localhost:8005/community/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(questionData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Server error: ${response.status}`);
        }

        const result = await response.json();

        // Reset form
        document.getElementById('question-form').reset();
        document.getElementById('char-count').textContent = '0';
        document.getElementById('image-preview').innerHTML = '';

        // Refresh questions feed
        await loadQuestions();

        showSuccess('Question posted successfully!');

    } catch (error) {
        console.error('Error posting question:', error);
        showError(`Failed to post question: ${error.message}`);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function loadQuestions() {
    const feed = document.getElementById('questions-feed');
    const loading = document.getElementById('feed-loading');

    loading.style.display = 'block';
    feed.innerHTML = '';

    try {
        const filterCategory = document.getElementById('filter-category')?.value;
        const sortBy = document.getElementById('sort-by')?.value || 'newest';
        
        let url = 'http://localhost:8005/community/questions?';
        const params = new URLSearchParams({
            sort_by: sortBy,
            limit: '20',
            offset: '0'
        });
        
        if (filterCategory) {
            params.append('category', filterCategory);
        }
        
        const response = await fetch(url + params.toString());
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        AppState.communityQuestions = data.questions;
        
        displayQuestions(data.questions);
        
    } catch (error) {
        console.error('Error loading questions from backend:', error);
        // Fallback to local storage
        await loadCommunityData();
        filterAndDisplayQuestions();
    } finally {
        loading.style.display = 'none';
    }
}

function filterAndDisplayQuestions() {
    const filterCategory = document.getElementById('filter-category').value;
    const sortBy = document.getElementById('sort-by').value;

    let questions = [...AppState.communityQuestions];

    // Filter by category
    if (filterCategory) {
        questions = questions.filter(q => q.category === filterCategory);
    }

    // Sort questions
    switch (sortBy) {
        case 'oldest':
            questions.sort((a, b) => new Date(a.created_at || a.timestamp) - new Date(b.created_at || b.timestamp));
            break;
        case 'most_responses':
            questions.sort((a, b) => (b.answer_count || b.responses?.length || 0) - (a.answer_count || a.responses?.length || 0));
            break;
        case 'most_voted':
            questions.sort((a, b) => ((b.upvotes || 0) - (b.downvotes || 0)) - ((a.upvotes || 0) - (a.downvotes || 0)));
            break;
        case 'newest':
        default:
            questions.sort((a, b) => new Date(b.created_at || b.timestamp) - new Date(a.created_at || a.timestamp));
            break;
    }

    displayQuestions(questions);
}

function displayQuestions(questions) {
    const feed = document.getElementById('questions-feed');
    feed.innerHTML = '';

    if (questions.length === 0) {
        feed.innerHTML = '<div class="no-questions">No questions found. Be the first to ask!</div>';
        return;
    }

    questions.forEach(question => {
        const questionElement = createQuestionElement(question);
        feed.appendChild(questionElement);
    });
}

function createQuestionElement(question) {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item';
    questionDiv.innerHTML = `
        <div class="question-header">
            <div class="user-info">
                <div class="user-avatar">${(question.user_name || question.user || 'U').charAt(0).toUpperCase()}</div>
                <div class="user-details">
                    <div class="user-name">${question.user_name || question.user || 'Anonymous'}</div>
                    <div class="question-meta">
                        <span class="category-tag">${question.category}</span>
                        <span class="question-time">${formatDate(question.created_at || question.timestamp)}</span>
                        ${question.language ? `<span class="language-tag">${question.language.toUpperCase()}</span>` : ''}
                    </div>
                </div>
            </div>
            <div class="question-actions">
                <button class="btn btn-sm btn-secondary" onclick="generateAIAnswer(${question.id})">
                    🤖 Get AI Answer
                </button>
            </div>
        </div>
        
        <div class="question-content">
            <p>${question.question || question.text}</p>
            ${question.image_data || question.image ? `<img src="${question.image_data || question.image}" alt="Question image" class="question-image">` : ''}
        </div>
        
        <div class="question-footer">
            <div class="vote-section">
                <button class="vote-btn upvote" onclick="voteOnQuestion(${question.id}, 'up')">
                    👍 ${question.upvotes || 0}
                </button>
                <button class="vote-btn downvote" onclick="voteOnQuestion(${question.id}, 'down')">
                    👎 ${question.downvotes || 0}
                </button>
            </div>
            <div class="response-count">
                💬 ${question.answer_count || question.responses?.length || 0} responses
            </div>
            <button class="btn btn-text" onclick="viewQuestionDetails(${question.id})">
                View Details
            </button>
        </div>
    `;
    
    return questionDiv;
}

async function voteOnQuestion(questionId, voteType) {
    try {
        const voteData = {
            user_id: AppState.currentUser?.id || Date.now().toString(),
            target_type: 'question',
            target_id: questionId,
            vote_type: voteType
        };

        const response = await fetch('http://localhost:8005/community/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(voteData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Server error: ${response.status}`);
        }

        // Refresh the questions to show updated vote counts
        await loadQuestions();

    } catch (error) {
        console.error('Error voting:', error);
        showError(`Failed to record vote: ${error.message}`);
    }
}

async function generateAIAnswer(questionId) {
    try {
        showSuccess('Generating AI answer... This may take a moment.');
        
        const response = await fetch(`http://localhost:8005/community/ai-answer/${questionId}`, {
            method: 'POST'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Server error: ${response.status}`);
        }

        const result = await response.json();
        showSuccess('AI answer generated successfully!');
        
        // Refresh the question details if viewing them
        if (AppState.currentViewingQuestion === questionId) {
            viewQuestionDetails(questionId);
        }

    } catch (error) {
        console.error('Error generating AI answer:', error);
        showError(`Failed to generate AI answer: ${error.message}`);
    }
}

async function viewQuestionDetails(questionId) {
    try {
        AppState.currentViewingQuestion = questionId;
        
        const response = await fetch(`http://localhost:8005/community/questions/${questionId}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Server error: ${response.status}`);
        }

        const data = await response.json();
        displayQuestionDetails(data.question, data.answers);

    } catch (error) {
        console.error('Error loading question details:', error);
        showError(`Failed to load question details: ${error.message}`);
    }
}

function displayQuestionDetails(question, answers) {
    const modal = document.createElement('div');
    modal.className = 'question-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Question Details</h3>
                <button class="modal-close" onclick="closeQuestionModal()">&times;</button>
            </div>
            
            <div class="modal-body">
                <div class="question-detail">
                    <div class="question-user">
                        <div class="user-avatar">${question.user_name.charAt(0).toUpperCase()}</div>
                        <div>
                            <div class="user-name">${question.user_name}</div>
                            <div class="question-time">${formatDate(question.created_at)}</div>
                        </div>
                    </div>
                    
                    <div class="question-content">
                        <p>${question.question}</p>
                        ${question.image_data ? `<img src="${question.image_data}" alt="Question image" class="question-image">` : ''}
                    </div>
                    
                    <div class="vote-section">
                        <button class="vote-btn upvote" onclick="voteOnQuestion(${question.id}, 'up')">
                            👍 ${question.upvotes}
                        </button>
                        <button class="vote-btn downvote" onclick="voteOnQuestion(${question.id}, 'down')">
                            👎 ${question.downvotes}
                        </button>
                    </div>
                </div>
                
                <div class="answers-section">
                    <h4>Answers (${answers.length})</h4>
                    <div class="answers-list">
                        ${answers.map(answer => `
                            <div class="answer-item ${answer.is_ai_answer ? 'ai-answer' : ''}">
                                <div class="answer-header">
                                    <div class="user-info">
                                        <div class="user-avatar">${answer.is_ai_answer ? '🤖' : answer.user_name.charAt(0).toUpperCase()}</div>
                                        <div>
                                            <div class="user-name">${answer.user_name}</div>
                                            <div class="answer-time">${formatDate(answer.created_at)}</div>
                                        </div>
                                    </div>
                                    ${answer.is_ai_answer ? '<span class="ai-badge">AI Answer</span>' : ''}
                                </div>
                                
                                <div class="answer-content">
                                    <p>${answer.answer}</p>
                                </div>
                                
                                <div class="vote-section">
                                    <button class="vote-btn upvote" onclick="voteOnAnswer(${answer.id}, 'up')">
                                        👍 ${answer.upvotes}
                                    </button>
                                    <button class="vote-btn downvote" onclick="voteOnAnswer(${answer.id}, 'down')">
                                        👎 ${answer.downvotes}
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="add-answer-section">
                        <textarea id="new-answer-text" placeholder="Share your knowledge and help fellow farmers..."></textarea>
                        <button class="btn btn-primary" onclick="postAnswer(${question.id})">Post Answer</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeQuestionModal() {
    const modal = document.querySelector('.question-modal');
    if (modal) {
        modal.remove();
    }
    AppState.currentViewingQuestion = null;
}

async function postAnswer(questionId) {
    const answerText = document.getElementById('new-answer-text').value.trim();
    if (!answerText) {
        showError('Please enter an answer before posting.');
        return;
    }

    try {
        const answerData = {
            question_id: questionId,
            user_id: AppState.currentUser?.id || Date.now().toString(),
            user_name: AppState.currentUser?.name || 'Anonymous Farmer',
            answer: answerText
        };

        const response = await fetch('http://localhost:8005/community/answers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(answerData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Server error: ${response.status}`);
        }

        // Clear the textarea
        document.getElementById('new-answer-text').value = '';
        
        // Refresh the question details
        await viewQuestionDetails(questionId);
        
        showSuccess('Answer posted successfully!');

    } catch (error) {
        console.error('Error posting answer:', error);
        showError(`Failed to post answer: ${error.message}`);
    }
}

async function voteOnAnswer(answerId, voteType) {
    try {
        const voteData = {
            user_id: AppState.currentUser?.id || Date.now().toString(),
            target_type: 'answer',
            target_id: answerId,
            vote_type: voteType
        };

        const response = await fetch('http://localhost:8005/community/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(voteData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Server error: ${response.status}`);
        }

        // Refresh the question details to show updated vote counts
        if (AppState.currentViewingQuestion) {
            await viewQuestionDetails(AppState.currentViewingQuestion);
        }

    } catch (error) {
        console.error('Error voting on answer:', error);
        showError(`Failed to record vote: ${error.message}`);
    }
}

function refreshQuestions() {
    loadQuestions();
}



function createQuestionHTML(question) {
    const timeAgo = getTimeAgo(new Date(question.timestamp));
    const categoryClass = question.category.replace('-', '');

    return `
        <div class="question-card" data-id="${question.id}">
            <div class="question-header">
                <div class="question-user">
                    <div class="user-avatar">${question.user.charAt(0).toUpperCase()}</div>
                    <div class="user-info">
                        <span class="user-name">${question.user}</span>
                        <span class="question-time">${timeAgo}</span>
                    </div>
                </div>
                <span class="question-category category-${categoryClass}">${formatCategory(question.category)}</span>
            </div>

            <div class="question-content">
                <p class="question-text">${question.text}</p>
                ${question.image ? `<img src="${question.image}" alt="Question image" class="question-image">` : ''}
            </div>

            <div class="question-actions">
                <button class="action-btn" onclick="toggleResponses('${question.id}')">
                    <span class="btn-icon">💬</span>
                    ${question.responses.length} Response${question.responses.length !== 1 ? 's' : ''}
                </button>
                <button class="action-btn" onclick="showAddResponse('${question.id}')">
                    <span class="btn-icon">✏️</span>
                    Add Response
                </button>
            </div>

            <div class="responses-section" id="responses-${question.id}" style="display: none;">
                <div class="responses-list" id="responses-list-${question.id}">
                    ${question.responses.map(r => createResponseHTML(r)).join('')}
                </div>

                <div class="add-response-form" id="add-response-${question.id}" style="display: none;">
                    <textarea placeholder="Write your response..." id="response-text-${question.id}" maxlength="1000"></textarea>
                    <div class="response-actions">
                        <button class="btn btn-secondary" onclick="cancelResponse('${question.id}')">Cancel</button>
                        <button class="btn btn-primary" onclick="submitResponse('${question.id}')">Submit</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function createResponseHTML(response) {
    const timeAgo = getTimeAgo(new Date(response.timestamp));

    return `
        <div class="response-item">
            <div class="response-header">
                <div class="response-user">
                    <div class="user-avatar small">${response.user.charAt(0).toUpperCase()}</div>
                    <div class="user-info">
                        <span class="user-name">${response.user}</span>
                        <span class="response-time">${timeAgo}</span>
                    </div>
                </div>
            </div>
            <div class="response-content">
                <p class="response-text">${response.text}</p>
            </div>
        </div>
    `;
}

function toggleResponses(questionId) {
    const responsesSection = document.getElementById(`responses-${questionId}`);
    const isVisible = responsesSection.style.display !== 'none';

    responsesSection.style.display = isVisible ? 'none' : 'block';
}

function showAddResponse(questionId) {
    const form = document.getElementById(`add-response-${questionId}`);
    const textarea = document.getElementById(`response-text-${questionId}`);

    form.style.display = 'block';
    textarea.focus();
}

function cancelResponse(questionId) {
    const form = document.getElementById(`add-response-${questionId}`);
    const textarea = document.getElementById(`response-text-${questionId}`);

    form.style.display = 'none';
    textarea.value = '';
}

async function submitResponse(questionId) {
    const textarea = document.getElementById(`response-text-${questionId}`);
    const text = textarea.value.trim();

    if (!text) {
        showError('Please enter a response.');
        return;
    }

    const responseData = {
        user: AppState.currentUser?.name || 'Anonymous User',
        text: text,
        timestamp: new Date().toISOString()
    };

    // Find and update the question
    const question = AppState.communityQuestions.find(q => q.id === questionId);
    if (question) {
        question.responses.push(responseData);
        await saveCommunityData();

        // Update the UI
        const responsesList = document.getElementById(`responses-list-${questionId}`);
        responsesList.insertAdjacentHTML('beforeend', createResponseHTML(responseData));

        // Update response count
        const actionBtn = document.querySelector(`[onclick="toggleResponses('${questionId}')"]`);
        const count = question.responses.length;
        actionBtn.innerHTML = `<span class="btn-icon">💬</span> ${count} Response${count !== 1 ? 's' : ''}`;

        // Hide form
        cancelResponse(questionId);

        showSuccess('Response added successfully!');
    }
}

function loadMoreQuestions() {
    // For now, just show all questions (in production, implement pagination)
    filterAndDisplayQuestions();
    document.getElementById('load-more-btn').style.display = 'none';
}

function refreshQuestions() {
    loadQuestions();
}

function previewImage(input) {
    const preview = document.getElementById('image-preview');

    if (input.files && input.files[0]) {
        const reader = new FileReader();

        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Image preview" style="max-width: 200px; max-height: 200px; border-radius: 8px;">`;
        };

        reader.readAsDataURL(input.files[0]);
    } else {
        preview.innerHTML = '';
    }
}

async function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function saveCommunityData() {
    try {
        const data = JSON.stringify(AppState.communityQuestions);
        localStorage.setItem(STORAGE_KEYS.COMMUNITY_QUESTIONS, data);
    } catch (error) {
        console.error('Error saving community data:', error);
    }
}

async function loadCommunityData() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.COMMUNITY_QUESTIONS);
        if (data) {
            AppState.communityQuestions = JSON.parse(data);
        } else {
            // Add some sample questions for demonstration
            AppState.communityQuestions = [
                {
                    id: "sample-1",
                    user: "Rajesh Kumar",
                    text: "How can I prevent aphids from damaging my tomato plants?",
                    category: "pest-control",
                    image: null,
                    responses: [
                        {
                            user: "Priya Sharma",
                            text: "Try using neem oil spray mixed with water. Apply every 7-10 days. Also, introduce ladybugs as natural predators.",
                            timestamp: new Date(Date.now() - 86400000).toISOString()
                        },
                        {
                            user: "Dr. Singh",
                            text: "Regular monitoring is key. Remove affected leaves immediately and ensure proper plant spacing for air circulation.",
                            timestamp: new Date(Date.now() - 43200000).toISOString()
                        }
                    ],
                    timestamp: new Date(Date.now() - 172800000).toISOString()
                },
                {
                    id: "sample-2",
                    user: "Meera Patel",
                    text: "What's the best time to apply fertilizers to wheat crops?",
                    category: "fertilization",
                    image: null,
                    responses: [
                        {
                            user: "Amit Verma",
                            text: "Apply nitrogen fertilizer at tillering stage (30-35 days after sowing) and again at jointing stage. Use urea or DAP based on soil test results.",
                            timestamp: new Date(Date.now() - 3600000).toISOString()
                        }
                    ],
                    timestamp: new Date(Date.now() - 86400000).toISOString()
                }
            ];
            await saveCommunityData();
        }
    } catch (error) {
        console.error('Error loading community data:', error);
        AppState.communityQuestions = [];
    }
}

function formatCategory(category) {
    return category.split('-').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
}

// Console welcome message
console.log('%c🌱 Agricultural AI Platform', 'color: #059669; font-size: 24px; font-weight: bold;');
console.log('%cWelcome to the AgriAI Platform! This platform helps farmers with AI-powered crop disease detection and advisory services.', 'color: #059669; font-size: 14px;');
console.log('%cFor support or feedback, please contact our team.', 'color: #6b7280; font-size: 12px;');

/**
 * Chatbot Functionality
 */

// Initialize Chatbot
function initializeChatbot() {
    console.log('Initializing chatbot...');
    setupChatEventListeners();
    initializeChatSession();
    loadChatHistory();
    updateChatUI();
}

// Setup chat event listeners
function setupChatEventListeners() {
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const chatCharCount = document.getElementById('chat-char-count');
    const voiceInputBtn = document.getElementById('voice-input-btn');
    
    if (chatForm) {
        chatForm.addEventListener('submit', handleChatSubmit);
    }
    
    if (chatInput) {
        chatInput.addEventListener('input', function() {
            const charCount = this.value.length;
            if (chatCharCount) {
                chatCharCount.textContent = charCount;
            }
            
            if (sendBtn) {
                sendBtn.disabled = charCount === 0;
            }
            
            // Auto-resize textarea
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });
        
        // Enable send on Enter, new line on Shift+Enter
        chatInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (this.value.trim() && !AppState.chatbot.isTyping) {
                    handleChatSubmit(e);
                }
            }
        });
    }
    
    if (voiceInputBtn) {
        voiceInputBtn.addEventListener('click', startVoiceInput);
    }
}

// Initialize chat session
function initializeChatSession() {
    if (!AppState.chatbot.currentSession) {
        AppState.chatbot.currentSession = generateSessionId();
    }
    
    // Create session on backend
    createChatSession(AppState.chatbot.currentSession);
}

// Generate unique session ID
function generateSessionId() {
    const userId = AppState.currentUser?.phoneNumber || 'anonymous';
    const timestamp = Date.now();
    return `${userId}_${timestamp}`;
}

// Create chat session on backend
async function createChatSession(sessionId) {
    try {
        const response = await fetch('http://localhost:8005/chatbot/session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                session_id: sessionId,
                user_id: AppState.currentUser?.phoneNumber || 'anonymous'
            })
        });
        
        if (response.ok) {
            console.log('Chat session created successfully');
            updateChatSessionStatus('online');
        }
    } catch (error) {
        console.error('Failed to create chat session:', error);
        updateChatSessionStatus('offline');
    }
}

// Handle chat form submission
async function handleChatSubmit(e) {
    e.preventDefault();
    
    const chatInput = document.getElementById('chat-input');
    const message = chatInput.value.trim();
    
    if (!message || AppState.chatbot.isTyping) {
        return;
    }
    
    // Clear input
    chatInput.value = '';
    chatInput.style.height = 'auto';
    document.getElementById('chat-char-count').textContent = '0';
    document.getElementById('send-btn').disabled = true;
    
    // Add user message to chat
    addChatMessage('user', message);
    
    // Show typing indicator
    showTypingIndicator();
    
    // Send message to backend
    await sendChatMessage(message);
}

// Send chat message to backend
async function sendChatMessage(message) {
    try {
        AppState.chatbot.isTyping = true;
        
        const language = document.getElementById('chat-language').value;
        const responseLanguage = document.getElementById('chat-response-language').value;
        
        const response = await fetch('http://localhost:8005/chatbot/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                user_id: AppState.currentUser?.phoneNumber || 'anonymous',
                session_id: AppState.chatbot.currentSession,
                language: language || null,
                translate_to: responseLanguage || null
            }),
            signal: AbortSignal.timeout(30000) // 30 second timeout
        });
        
        if (!response.ok) {
            throw new Error('Failed to send message');
        }
        
        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let botResponse = '';
        let botMessageElement = null;
        
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
                try {
                    const data = JSON.parse(line);
                    
                    if (data.response_chunk) {
                        // Hide typing indicator if not done yet
                        hideTypingIndicator();
                        
                        // Create bot message element if not exists
                        if (!botMessageElement) {
                            botMessageElement = addChatMessage('bot', '');
                        }
                        
                        // Update bot response
                        botResponse += data.response_chunk;
                        updateBotMessage(botMessageElement, botResponse);
                        
                    } else if (data.response && data.status === 'complete') {
                        // Final response received
                        hideTypingIndicator();
                        
                        if (!botMessageElement) {
                            addChatMessage('bot', data.response);
                        } else {
                            updateBotMessage(botMessageElement, data.response);
                        }
                        
                        botResponse = data.response;
                        break;
                    } else if (data.error) {
                        hideTypingIndicator();
                        addChatMessage('bot', `Sorry, I encountered an error: ${data.error}`);
                        break;
                    }
                } catch (parseError) {
                    console.error('Error parsing response chunk:', parseError);
                }
            }
        }
        
        // Save to local message history
        AppState.chatbot.messageHistory.push(
            { type: 'user', content: message, timestamp: new Date() },
            { type: 'bot', content: botResponse, timestamp: new Date() }
        );
        
    } catch (error) {
        console.error('Error sending chat message:', error);
        hideTypingIndicator();
        
        let errorMessage = 'Sorry, I\'m having trouble connecting right now. ';
        
        if (error.message.includes('Failed to fetch')) {
            errorMessage += 'Please check if the AI service is running and try again.';
        } else if (error.message.includes('timeout')) {
            errorMessage += 'The request timed out. Please try again.';
        } else if (error.message.includes('TypeError')) {
            errorMessage += 'There was a network error. Please check your connection.';
        } else {
            errorMessage += 'Please try again in a moment.';
        }
        
        addChatMessage('bot', errorMessage);
    } finally {
        AppState.chatbot.isTyping = false;
    }
}

// Add message to chat interface
function addChatMessage(type, content) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return null;
    
    // Remove welcome message if exists
    const welcomeMessage = chatMessages.querySelector('.chat-welcome');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }
    
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${type}-message`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = type === 'user' ? '👤' : '🤖';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    messageText.textContent = content;
    
    const messageTime = document.createElement('div');
    messageTime.className = 'message-time';
    messageTime.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageContent.appendChild(messageText);
    messageContent.appendChild(messageTime);
    
    if (type === 'user') {
        messageElement.appendChild(messageContent);
        messageElement.appendChild(avatar);
    } else {
        messageElement.appendChild(avatar);
        messageElement.appendChild(messageContent);
    }
    
    chatMessages.appendChild(messageElement);
    
    // Scroll to bottom
    scrollChatToBottom();
    
    return messageElement;
}

// Update bot message content (for streaming)
function updateBotMessage(messageElement, content) {
    const messageText = messageElement.querySelector('.message-text');
    if (messageText) {
        messageText.textContent = content;
        scrollChatToBottom();
    }
}

// Show typing indicator
function showTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.style.display = 'flex';
        scrollChatToBottom();
    }
}

// Hide typing indicator
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.style.display = 'none';
    }
}

// Scroll chat to bottom
function scrollChatToBottom() {
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Send quick message
function sendQuickMessage(message) {
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.value = message;
        
        // Trigger input event to enable send button
        const inputEvent = new Event('input', { bubbles: true });
        chatInput.dispatchEvent(inputEvent);
        
        // Submit the form
        const chatForm = document.getElementById('chat-form');
        if (chatForm) {
            const submitEvent = new Event('submit', { bubbles: true });
            chatForm.dispatchEvent(submitEvent);
        }
    }
}

// Clear chat session
async function clearChatSession() {
    try {
        const response = await fetch(`http://localhost:8005/chatbot/conversation/${AppState.chatbot.currentSession}?user_id=${AppState.currentUser?.phoneNumber || 'anonymous'}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Clear UI
            const chatMessages = document.getElementById('chat-messages');
            if (chatMessages) {
                chatMessages.innerHTML = `
                    <div class="chat-welcome">
                        <div class="bot-avatar">🤖</div>
                        <div class="welcome-message">
                            <h3>Hello! I'm your AI farming assistant</h3>
                            <p>Ask me about crop diseases, farming techniques, weather impact, or any agricultural questions you have. I'm here to help!</p>
                            <div class="quick-suggestions">
                                <button class="suggestion-btn" onclick="sendQuickMessage('How do I prevent rice blast disease?')">
                                    🌾 Rice disease prevention
                                </button>
                                <button class="suggestion-btn" onclick="sendQuickMessage('What are the best irrigation practices?')">
                                    💧 Irrigation tips
                                </button>
                                <button class="suggestion-btn" onclick="sendQuickMessage('How does weather affect crop growth?')">
                                    🌤️ Weather impact
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            // Clear local history
            AppState.chatbot.messageHistory = [];
            
            showSuccess('Chat conversation cleared');
        }
    } catch (error) {
        console.error('Error clearing chat session:', error);
        showError('Failed to clear conversation');
    }
}

// Start new chat session
function newChatSession() {
    AppState.chatbot.currentSession = generateSessionId();
    initializeChatSession();
    clearChatSession();
}

// Load chat history
async function loadChatHistory() {
    try {
        const response = await fetch(`http://localhost:8005/chatbot/sessions/${AppState.currentUser?.phoneNumber || 'anonymous'}?limit=10`);
        
        if (response.ok) {
            const data = await response.json();
            AppState.chatbot.sessions = data.sessions || [];
            updateChatHistoryPanel();
        }
    } catch (error) {
        console.error('Error loading chat history:', error);
    }
}

// Update chat history panel
function updateChatHistoryPanel() {
    const historyList = document.getElementById('chat-history-list');
    if (!historyList) return;
    
    if (AppState.chatbot.sessions.length === 0) {
        historyList.innerHTML = '<p class="no-history">No previous conversations</p>';
        return;
    }
    
    historyList.innerHTML = AppState.chatbot.sessions.map(session => `
        <div class="history-item" onclick="loadChatSession('${session.session_id}')">
            <div class="history-info">
                <div class="history-title">Chat Session</div>
                <div class="history-meta">
                    ${session.message_count} messages • ${formatDate(session.last_message || session.created_at)}
                </div>
            </div>
            <button class="history-delete" onclick="deleteChatSession('${session.session_id}', event)" title="Delete session">
                🗑️
            </button>
        </div>
    `).join('');
}

// Load specific chat session
async function loadChatSession(sessionId) {
    try {
        const response = await fetch(`http://localhost:8005/chatbot/conversation/${sessionId}?user_id=${AppState.currentUser?.phoneNumber || 'anonymous'}&limit=50`);
        
        if (response.ok) {
            const data = await response.json();
            AppState.chatbot.currentSession = sessionId;
            
            // Clear current chat
            const chatMessages = document.getElementById('chat-messages');
            if (chatMessages) {
                chatMessages.innerHTML = '';
            }
            
            // Load conversation history
            data.conversation.forEach(msg => {
                addChatMessage(msg.type, msg.content);
            });
            
            showSuccess('Chat session loaded');
        }
    } catch (error) {
        console.error('Error loading chat session:', error);
        showError('Failed to load chat session');
    }
}

// Delete chat session
async function deleteChatSession(sessionId, event) {
    event.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this chat session?')) {
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:8005/chatbot/conversation/${sessionId}?user_id=${AppState.currentUser?.phoneNumber || 'anonymous'}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Remove from local sessions
            AppState.chatbot.sessions = AppState.chatbot.sessions.filter(s => s.session_id !== sessionId);
            updateChatHistoryPanel();
            
            // If current session was deleted, start new one
            if (AppState.chatbot.currentSession === sessionId) {
                newChatSession();
            }
            
            showSuccess('Chat session deleted');
        }
    } catch (error) {
        console.error('Error deleting chat session:', error);
        showError('Failed to delete chat session');
    }
}

// Toggle chat history panel
function toggleChatHistory() {
    const historyPanel = document.getElementById('chat-history-panel');
    if (historyPanel) {
        historyPanel.classList.toggle('expanded');
    }
}

// Update chat session status
function updateChatSessionStatus(status) {
    const statusDot = document.querySelector('.session-status .status-dot');
    const statusText = document.querySelector('.session-status .status-text');
    
    if (statusDot && statusText) {
        statusDot.className = `status-dot ${status}`;
        statusText.textContent = status === 'online' ? 'AI Assistant Online' : 'AI Assistant Offline';
    }
}

// Update chat UI
function updateChatUI() {
    // Auto-focus on chat input when page loads
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        setTimeout(() => chatInput.focus(), 100);
    }
}

// Voice input for chat
function startVoiceInput() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = document.getElementById('chat-language').value || 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        
        recognition.onstart = function() {
            const voiceBtn = document.getElementById('voice-input-btn');
            if (voiceBtn) {
                voiceBtn.style.color = '#ef4444';
                voiceBtn.title = 'Listening... Click to stop';
            }
        };
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            const chatInput = document.getElementById('chat-input');
            if (chatInput) {
                chatInput.value = transcript;
                
                // Trigger input event
                const inputEvent = new Event('input', { bubbles: true });
                chatInput.dispatchEvent(inputEvent);
            }
        };
        
        recognition.onend = function() {
            const voiceBtn = document.getElementById('voice-input-btn');
            if (voiceBtn) {
                voiceBtn.style.color = '';
                voiceBtn.title = 'Voice input';
            }
        };
        
        recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            showError('Voice input failed. Please try again.');
        };
        
        recognition.start();
    } else {
        showError('Voice input is not supported in your browser');
    }
}

// Navigation helper functions
function openChatbot() {
    navigateToPage('chatbot');
}

// Direct chatbot test function (for debugging)
window.testChatbot = function() {
    console.log('Testing chatbot functionality...');
    
    // Ensure user is set
    if (!AppState.currentUser) {
        const tempProfile = {
            phoneNumber: 'test_user_' + Date.now(),
            role: 'farmer',
            language: 'en',
            consents: { dataCollection: true, locationTracking: false },
            createdAt: new Date().toISOString()
        };
        AppState.currentUser = tempProfile;
        updateUIForRole(tempProfile.role);
    }
    
    // Navigate directly to chatbot
    navigateToPage('chatbot');
    
    // Test message after a short delay
    setTimeout(() => {
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.value = 'Hello, can you help me with crop management?';
            chatInput.dispatchEvent(new Event('input'));
            console.log('Test message added to chat input. You can now click send or press Enter.');
        }
    }, 1000);
};
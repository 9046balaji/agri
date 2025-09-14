# Smart Crop Advisory Platform - AI Agent Guidelines

## Project Overview
This is a comprehensive agricultural AI platform (SIH project) serving Indian farmers with AI-powered crop disease detection, personalized advisory, and farm management. The platform supports multiple user roles (farmers, field agents, researchers, admins) with offline-first PWA architecture.

## Architecture & Tech Stack

### Frontend (PWA)
- **Location**: `src/` directory
- **Tech**: Vanilla HTML/CSS/JS with ES6+ features
- **Key Patterns**:
  - Progressive Web App with service worker (`sw.js`) for offline caching
  - Voice command integration using Web Speech API
  - Camera API for disease detection image capture
  - Local storage with IndexedDB-style persistence (`STORAGE_KEYS` constants)
  - Accessibility features (ARIA labels, keyboard navigation, high contrast mode)
  - Responsive design using CSS Grid/Flexbox with mobile-first approach

### Backend (Microservices)
- **Tech**: Node.js + TypeScript, NestJS/Express framework
- **Database**: PostgreSQL with PostGIS for geospatial data
- **Cache/Queue**: Redis, Apache Kafka/AWS SQS
- **Architecture**: Microservices with Auth, Farm, Detection, Advisory, Data Hub, Marketplace services

### ML Components
- **Translation**: Multilingual support (English/Hindi/Telugu) using Helsinki-NLP OPUS-MT and Facebook mBART-50 models
- **Disease Detection**: Computer vision models for crop health analysis
- **Weather Integration**: Real-time agricultural weather data

## Critical Patterns & Conventions

### State Management
```javascript
// Global state pattern used throughout app
const AppState = {
    currentUser: null,
    currentPage: 'auth',
    isOffline: false,
    voiceEnabled: false,
    // ... other state
};
```

### Local Storage Keys
```javascript
const STORAGE_KEYS = {
    USER_PROFILE: 'agri_user_profile',
    SETTINGS: 'agri_settings',
    DETECTION_HISTORY: 'agri_detection_history',
    OFFLINE_QUEUE: 'agri_offline_queue',
    WEATHER_CACHE: 'agri_weather_cache'
};
```

### CSS Architecture
- CSS custom properties for theming (`--primary: #059669`)
- Agricultural color scheme (greens, earth tones)
- Mobile-first responsive design
- Smooth animations and micro-interactions

### Authentication Flow
- JWT with refresh tokens
- OTP/SMS verification for farmers
- Role-based access control (RBAC)
- Multi-factor authentication support

### Offline-First Design
- Service worker caches critical resources
- Bidirectional sync with conflict resolution
- Offline queue for pending operations
- Connection status monitoring

## Development Workflow

### File Organization
- `src/index.html`: Main PWA shell with semantic HTML5
- `src/script.js`: Core application logic (2000+ lines)
- `src/styles.css`: Comprehensive styling with CSS variables
- `src/sw.js`: Service worker for offline functionality
- `src/manifest.json`: PWA manifest configuration
- `translate.ipynb`: ML translation model setup and testing

### Key Directories to Reference
- `backend.md`: Complete backend architecture and API specs
- `READMI.md`, `READMI2.md`: Detailed feature specifications
- `done.md`: Implementation status and completed features
- `next.md`: Roadmap and planned enhancements

### Data Patterns
- Agricultural procurement data in CSV format (`Seasonwiseprocurementdetails2023_0.csv`)
- Multilingual content support (English/Hindi/Telugu)
- Geospatial farm field mapping with PostGIS
- Time-series crop lifecycle tracking

## Common Tasks & Commands

### Frontend Development
- **Start development**: Open `src/index.html` in browser (PWA works offline)
- **Test offline mode**: Use browser dev tools → Network → Offline
- **Voice commands**: Click microphone icon, speak naturally ("show weather", "detect disease")
- **Camera testing**: Use browser dev tools → More tools → Sensors → Camera

### Backend Development
- **Database**: PostgreSQL with PostGIS extensions
- **API Pattern**: RESTful with OpenAPI 3.0 specs
- **Auth**: JWT tokens with refresh mechanism
- **ML Models**: Pre-trained translation models from Hugging Face

### Testing Patterns
- **Offline sync**: Test with network throttling in dev tools
- **Voice recognition**: Test with different accents/dialects
- **Camera fallback**: Test on devices without cameras
- **Multi-language**: Verify RTL text rendering for Hindi/Telugu

## Integration Points

### External Services
- **Weather APIs**: Agricultural weather data integration
- **SMS/IVR**: OTP verification and farmer notifications
- **ML Models**: Hugging Face model hosting and inference
- **Geospatial**: PostGIS for farm field mapping

### Data Flow
1. **User Input** → Voice/Camera/Text → Local processing
2. **Offline Queue** → Network restore → Sync to backend
3. **ML Processing** → Disease detection → Treatment recommendations
4. **Personalization** → User profile + Farm data → Advisory generation

## Security Considerations
- **Data Encryption**: AES-256 for sensitive agricultural data
- **GDPR Compliance**: Consent management for data sharing
- **Audit Logging**: All admin actions and data access tracked
- **Rate Limiting**: Redis-based API rate limiting

## Performance Patterns
- **Lazy Loading**: Images and components loaded on demand
- **Caching Strategy**: Service worker + Redis for optimal performance
- **Bundle Optimization**: Minimal JavaScript for fast mobile loading
- **Progressive Enhancement**: Core features work without JavaScript

## Accessibility Features
- **Screen Reader**: Comprehensive ARIA labels and semantic HTML
- **Keyboard Navigation**: Full keyboard accessibility
- **High Contrast**: Toggle for visually impaired users
- **Large Text**: Font scaling options
- **Voice Commands**: Alternative input method for motor-impaired users

## Deployment Considerations
- **PWA Requirements**: HTTPS mandatory for service workers
- **Mobile Optimization**: Touch targets minimum 44px
- **Offline Strategy**: Critical features cached locally
- **CDN Integration**: Static assets served via CDN

## Key Files for Reference
- `src/script.js` (lines 1-100): App initialization and state management
- `src/styles.css` (lines 20-80): CSS variable definitions and theming
- `backend.md` (lines 50-100): Tech stack and architecture decisions
- `translate.ipynb` (cells 1-10): ML model setup and translation examples</content>
<parameter name="filePath">c:\Users\ggvfj\Downloads\PROJECTS\SIH\.github\copilot-instructions.md
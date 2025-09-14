# Agricultural Backend Platform

A comprehensive backend system for agricultural applications featuring ML-powered crop disease detection, farm management, advisory services, and offline-first mobile support.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Key Features](#key-features)
5. [Getting Started](#getting-started)
6. [Implementation Checklist](#implementation-checklist)
7. [API Documentation](#api-documentation)
8. [Database Schema](#database-schema)
9. [Development Workflow](#development-workflow)
10. [Security & Compliance](#security--compliance)
11. [Monitoring & Observability](#monitoring--observability)
12. [Deployment](#deployment)
13. [Contributing](#contributing)

## Overview

This backend platform powers agricultural applications with a focus on:

- **ML-Powered Detection**: Automated crop disease and pest detection using computer vision
- **Farm Management**: Comprehensive farm and crop lifecycle management
- **Advisory System**: Personalized recommendations and agricultural guidance
- **Data Hub**: Secure data sharing and labeling workflows
- **Marketplace**: Agricultural products and services trading platform
- **Offline-First**: Robust sync capabilities for mobile field operations

## Architecture

The system follows a microservices architecture with the following core components:

```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Auth Service  │ │  RBAC Service   │ │  User Service   │
└─────────────────┘ └─────────────────┘ └─────────────────┘
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Farm Service   │ │Detection Service│ │Advisory Service │
└─────────────────┘ └─────────────────┘ └─────────────────┘
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Data Hub      │ │  Marketplace    │ │   Admin/MLOps   │
└─────────────────┘ └─────────────────┘ └─────────────────┘
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Communication  │ │  Sync Service   │ │Audit & Compliance│
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Tech Stack

### Core Technologies
- **Runtime**: Node.js with TypeScript
- **Framework**: NestJS or Express
- **Database**: PostgreSQL with PostGIS (geospatial support)
- **Cache**: Redis (caching + rate limiting)
- **Queue**: Apache Kafka or AWS SQS
- **Storage**: S3 or S3-compatible object storage
- **Auth**: JWT with refresh tokens, OTP support

### Infrastructure
- **Container**: Docker + Kubernetes
- **CI/CD**: GitHub Actions or GitLab CI
- **Monitoring**: Prometheus + Grafana
- **Security**: TLS 1.3, AES-256 encryption
- **API**: OpenAPI 3.0 specification-first

## Key Features

### 🔐 Authentication & Authorization
- Multi-factor authentication (OTP, SMS)
- Role-based access control (RBAC)
- JWT tokens with refresh mechanism
- Consent management and GDPR compliance

### 🚜 Farm Management
- Farm registration and profile management
- Geospatial field mapping with PostGIS
- Crop lifecycle tracking
- Multi-farm support for enterprise users

### 🔍 ML-Powered Detection
- Image upload with presigned URLs
- Automated disease/pest detection
- Quality control and human-in-the-loop labeling
- Model performance monitoring and drift detection

### 📊 Advisory System
- Personalized crop recommendations
- Weather integration
- Growth stage guidance
- Best practices library

### 📱 Offline-First Mobile Support
- Bidirectional sync with conflict resolution
- Device-specific sync metadata
- Partial sync and resume capabilities
- Vector clock or timestamp-based conflict resolution

### 🏪 Marketplace
- Product listings and price trends
- Transaction management
- Supplier/buyer matching
- Market analytics

## Getting Started

### Prerequisites
- Node.js 18+ or Python 3.9+
- PostgreSQL 13+ with PostGIS extension
- Redis 6+
- Docker and Docker Compose

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd agricultural-backend
```

2. **Install dependencies**
```bash
npm install
# or
pip install -r requirements.txt
```

3. **Environment Setup**
```bash
cp .env.example .env
# Configure your database, Redis, and other service URLs
```

4. **Database Setup**
```bash
# Run migrations
npm run migrate
# Seed initial data
npm run seed
```

5. **Start Development Server**
```bash
npm run dev
```

The API will be available at `http://localhost:3000` with OpenAPI documentation at `/api/docs`.

## Implementation Checklist

The project follows a comprehensive implementation checklist organized into 18 phases:

### Phase A: Foundation (Priority 1)
- [ ] OpenAPI specification for top 20 endpoints
- [ ] RBAC permissions system
- [ ] Core authentication and user management
- [ ] Basic farm CRUD operations

### Phase B: Core Features (Priority 2)
- [ ] Detection upload and ML pipeline
- [ ] Advisory content system
- [ ] Caching layer implementation
- [ ] Basic monitoring setup

### Phase C: Advanced Features (Priority 3)
- [ ] Data Hub workflow
- [ ] Labeling queue and human-in-the-loop
- [ ] MLOps model management
- [ ] Advanced offline sync

### Phase D: Production Ready (Priority 4)
- [ ] Communication services (SMS/IVR)
- [ ] Complete audit logging
- [ ] Security hardening
- [ ] Performance optimization

[View complete implementation checklist](./IMPLEMENTATION_CHECKLIST.md)

## API Documentation

The API follows OpenAPI 3.0 specifications. Key endpoint categories:

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/verify` - OTP verification  
- `POST /auth/token/refresh` - Token refresh

### User Management
- `GET /users/me` - Get user profile
- `PATCH /users/me` - Update profile and consent
- `POST /users/data-export` - GDPR data export
- `DELETE /users/me` - Account deletion

### Farm Management
- `POST /farms` - Create farm
- `GET /farms/{id}` - Get farm details
- `PATCH /farms/{id}` - Update farm

### Detection Services
- `POST /detection/uploads` - Get presigned upload URL
- `POST /detection/submit` - Submit for analysis
- `GET /detection/{id}` - Get detection results
- `POST /detection/{id}/feedback` - Provide feedback

### Advisory Services
- `GET /advisory/crops` - List crop types
- `GET /advisory/crops/{id}/recommendations` - Get recommendations

[View complete API documentation](./api-docs/openapi.yaml)

## Database Schema

### Core Tables

```sql
-- Users and authentication
users (id, phone, email, created_at, consent_flags)
roles (id, name, permissions)
sessions (id, user_id, refresh_token_hash, expires_at)

-- Farm management
farms (id, user_id, name, geom, metadata)
crops (id, farm_id, type, planted_at, growth_stage)

-- Detection system
detections (id, user_id, farm_id, image_url, results, status)
detection_feedback (id, detection_id, correct, notes)

-- Advisory content
advisories (id, crop_type, stage, content, metadata)

-- Audit and compliance
audit_logs (id, user_id, action, resource, timestamp, metadata)
```

[View complete schema migrations](./migrations/)

## Development Workflow

1. **API-First Development**: All endpoints must be defined in OpenAPI spec first
2. **Contract Testing**: Auto-generated tests from OpenAPI specifications
3. **Security by Design**: RBAC checks on all endpoints
4. **Monitoring First**: Instrument metrics from day one

### Code Standards
- TypeScript strict mode
- ESLint + Prettier
- 80%+ test coverage
- Conventional commits

## Security & Compliance

- **Encryption**: AES-256 for sensitive data at rest
- **Transport**: TLS 1.3 for all communications
- **Authentication**: Multi-factor with rate limiting
- **Authorization**: Fine-grained RBAC
- **Audit**: Immutable logs for all actions
- **GDPR**: Data export and deletion capabilities
- **Retention**: Automated data lifecycle management

## Monitoring & Observability

### Key Metrics
- Detection processing latency (p95 < 3s)
- API error rates (< 1%)
- ML model accuracy and drift
- Offline sync success rates

### Alerting
- SLO breach notifications
- Security event alerts
- System health monitoring
- Model performance degradation

## Deployment

The system uses containerized deployment with Kubernetes:

```bash
# Build images
docker build -t agricultural-backend .

# Deploy to K8s
helm upgrade --install agricultural-backend ./helm/

# Rolling updates
kubectl rollout restart deployment/agricultural-backend
```

### Environments
- **Development**: Local Docker Compose
- **Staging**: Single-node K8s cluster
- **Production**: Multi-zone K8s with auto-scaling

## Contributing

1. Fork the repository
2. Create a feature branch from `develop`
3. Implement your changes following the checklist
4. Add tests and update documentation
5. Submit a pull request

### Development Setup
```bash
# Install pre-commit hooks
npm run prepare

# Run tests
npm test

# Check code quality
npm run lint
npm run type-check
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For technical support or questions:
- Create an issue in this repository
- Contact the development team at dev@agricultural-platform.com
- Join our Slack workspace for real-time discussions

---

**Next Steps**: 
1. Generate the OpenAPI specification for the top 20 endpoints
2. Create the RBAC permissions matrix
3. Set up the initial database migrations
4. Implement the detection worker skeleton

**Documentation Links**:
- [Complete Implementation Checklist](./IMPLEMENTATION_CHECKLIST.md)
- [API Documentation](./api-docs/)
- [Database Schema Guide](./docs/database-schema.md)
- [Deployment Guide](./docs/deployment.md)
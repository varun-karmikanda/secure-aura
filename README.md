# 🛡️ Secure Aura - Timing Attack Defense Framework

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/yourusername/secure-aura)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![Docker](https://img.shields.io/badge/docker-%3E%3D20.10.0-blue.svg)](https://docker.com)

> **Production-ready, fully dockerized framework for preventing timing attacks, brute force, and username enumeration in authentication systems.**

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Attack Defenses](#-attack-defenses)
- [API Endpoints](#-api-endpoints)
- [Testing](#-testing)
- [Configuration](#-configuration)
- [Project Structure](#-project-structure)


---

## 🎯 Overview

**Secure Aura** protects authentication systems against timing-based attacks through multi-layered defenses:

### What It Defends Against

| Attack Type | Defense Mechanism | Status |
|-------------|------------------|--------|
| **Timing Attacks** | Constant-time operations, adaptive noise (50-200ms) | ✅ Active |
| **Username Enumeration** | Dummy hash operations, identical response times | ✅ Active |
| **Brute Force** | Rate limiting (30/min), failed login tracking | ✅ Active |
| **Credential Stuffing** | Pattern detection, account lockout | ✅ Active |
| **Password Spray** | Multi-target detection, severity escalation | ✅ Active |
| **Statistical Analysis** | CV/kurtosis analysis, outlier detection | ✅ Active |

### Key Features

- 🔐 **Argon2id** password hashing (PHC winner)
- ⏱️ **Constant-time** authentication (`crypto.timingSafeEqual`)
- 🎯 **Real-time attack detection** (statistical analysis)
- 📊 **Live monitoring dashboard** (React + Chart.js)
- 🐳 **Fully dockerized** (6-service architecture)
- 🔄 **Auto-scaling ready** (Redis distributed state)

---

## 🚀 Quick Start

### Prerequisites

- Docker >= 20.10.0
- Docker Compose >= 2.0.0

### Installation

```bash
# 1. Clone repository
git clone https://github.com/yourusername/secure-aura.git
cd secure-aura

# 2. Start all services
docker-compose up -d

# 3. Wait for services (30-60 seconds)
docker-compose logs -f

# 4. Verify health
curl http://localhost:8000/health  # Auth service
curl http://localhost:8001/health  # Monitor service
```

### Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| Dashboard | http://localhost:3000 | Real-time monitoring UI |
| Auth API | http://localhost:8000 | Authentication endpoints |
| Monitor API | http://localhost:8001 | Analytics & detection |
| Gateway | http://localhost:8080 | Nginx reverse proxy |
| PostgreSQL | localhost:5432 | Database |
| Redis | localhost:6379 | Cache & rate limiting |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│           Nginx Gateway (8080)              │
│         Rate Limiting + Routing             │
└──────────┬──────────────────┬───────────────┘
           │                  │
    ┌──────▼──────┐    ┌──────▼──────────┐
    │ Auth Service│    │ Monitor Service │
    │ (Node.js)   │    │   (Node.js)     │
    │   :8000     │    │     :8001       │
    └──────┬──────┘    └──────┬──────────┘
           │                  │
    ┌──────▼──────────────────▼──────┐
    │     PostgreSQL Database        │
    │  Users | Auth Logs | Events    │
    └────────────────┬────────────────┘
                     │
            ┌────────▼────────┐
            │  Redis Cache    │
            │ Rate Limits     │
            └─────────────────┘
```

### Service Breakdown

**Auth Service (Port 8000)**
- User registration & login
- JWT token generation
- Constant-time password verification
- Adaptive noise injection
- Rate limiting (30 login/min)

**Monitor Service (Port 8001)**
- Statistical timing analysis
- Attack probability scoring
- Security event management
- Threat level calculation
- Runs analysis every 30 seconds

**Dashboard (Port 3000)**
- Real-time charts (Chart.js)
- Security event timeline
- Threat indicators
- System health status

---

## 🛡️ Attack Defenses

### 1. Timing Attack Protection

```javascript
// Constant-time password verification
const isValid = await ConstantTimeAuth.verifyPasswordArgon2(
  password, salt, storedHash
);
// Always takes ~100-150ms regardless of correctness
```

**Mechanisms:**
- Argon2id hashing (memoryCost: 65536, timeCost: 3)
- `crypto.timingSafeEqual()` for comparisons
- Adaptive noise injection (50-200ms based on threat level)

### 2. Username Enumeration Defense

```javascript
if (!user) {
  // Execute dummy Argon2 hash - same timing as real verification
  await UsernameEnumerationDefense.generateDummyHash();
}
// Attacker cannot distinguish valid from invalid usernames
```

**Mechanisms:**
- Dummy hash operations for non-existent users
- Generic error messages ("Invalid username or password")
- Equal response times for all login failures

### 3. Brute Force Detection

```javascript
// Auto-detects after 10+ failures in 5 minutes
if (failedAttempts >= 10) {
  SecurityEventModel.create({
    eventType: 'brute_force_attack',
    severity: 'high',
    confidenceScore: 0.87
  });
}
```

**Mechanisms:**
- Rate limiting: 30 login attempts/minute
- Failed login tracking per IP
- Account lockout after excessive failures
- Real-time threat scoring

### 4. Statistical Attack Detection

The monitor service analyzes:
- **Coefficient of Variation (CV)**: Low CV = suspicious consistency
- **Kurtosis**: Bimodal distribution detection
- **Outliers**: IQR-based anomaly detection
- **Attack Probability**: 0.0-1.0 confidence score

---

## 📡 API Endpoints

### Authentication Service

**Register User**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}

# Response (201)
{
  "access_token": "eyJhbGc...",
  "user_id": "uuid",
  "username": "johndoe",
  "expires_in": 3600
}
```

**Login**
```bash
POST /api/auth/login

{
  "username": "johndoe",
  "password": "SecurePass123!"
}

# Response (200)
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

**Verify Token**
```bash
POST /api/auth/verify-token

{
  "token": "eyJhbGc..."
}
```

**Get User Info**
```bash
GET /api/users/me
Authorization: Bearer eyJhbGc...
```

### Monitoring Service

**System Statistics**
```bash
GET /api/monitor/stats

# Response
{
  "total_auth_attempts": 1523,
  "successful_logins": 1421,
  "failed_logins": 102,
  "security_events": 15,
  "active_threats": 3
}
```

**Security Events**
```bash
GET /api/monitor/events?limit=10&severity=high

# Response
{
  "events": [{
    "event_type": "brute_force_attack",
    "severity": "high",
    "ip_address": "192.168.1.100",
    "confidence_score": 0.87,
    "created_at": "2025-11-15T10:30:00Z"
  }]
}
```

**Timing Analysis**
```bash
GET /api/monitor/timing-analysis?suspicious_only=true
```

---

## 🧪 Testing

### Quick Test Suite

```bash
# Run comprehensive test
cd tests
./quick-test.sh

# Attack simulations
./attack-brute-force.sh       # 50 rapid failed logins
./attack-enumeration.sh        # Username probing
./attack-timing.sh            # Timing pattern analysis
./demo-attack-detection.sh    # Full attack demo

# Verify protections
./verify-protection.sh        # Check all defenses active
```

### Manual Testing with cURL

```bash
# Register user
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"Pass123!"}'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"Pass123!"}'

# Check stats
curl http://localhost:8001/api/monitor/stats | jq
```

### Postman Collection

Import files from `postman/` directory:
- `Secure-Aura-API.postman_collection.json`
- `Secure-Aura-Local.postman_environment.json`

---

## ⚙️ Configuration

### Environment Variables

Create `.env` file:

```bash
# Database
DATABASE_URL=postgresql://secureaura:secureaura_pass_2024@postgres:5432/timing_defense

# Redis
REDIS_URL=redis://:redis_secure_2024@redis:6379/0

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRATION=3600

# Timing Defense
MIN_NOISE_MS=50
MAX_NOISE_MS=200

# Detection
DETECTION_THRESHOLD=0.75
ANALYSIS_WINDOW=300
```

### Rate Limits

Configured in `services/auth-service/src/middleware.js`:

```javascript
requestsPerMinute: 200        // Global limit
loginAttemptsPerMinute: 30    // Login endpoint
registrationPerMinute: 10     // Registration endpoint
```

---

## 📁 Project Structure

```
secure-aura/
├── services/
│   ├── auth-service/          # Node.js authentication API
│   │   ├── src/
│   │   │   ├── server.js           # Express app
│   │   │   ├── constantTimeAuth.js # Timing-safe crypto
│   │   │   ├── database.js         # PostgreSQL models
│   │   │   └── middleware.js       # Rate limiting
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── monitor-service/       # Node.js monitoring API
│   │   ├── src/
│   │   │   ├── server.js           # Express app
│   │   │   ├── detector.js         # Statistical analysis
│   │   │   └── database.js         # Data access layer
│   │   ├── Dockerfile
│   │   └── package.json
│   └── dashboard/             # React frontend
│       ├── src/
│       │   ├── App.js              # Main component
│       │   ├── index.js
│       │   └── styles/
│       ├── public/
│       ├── Dockerfile
│       └── package.json
├── database/
│   └── init.sql               # PostgreSQL schema
├── nginx/
│   ├── nginx.conf             # Reverse proxy config
│   └── ssl/                   # SSL certificates
├── tests/
│   ├── quick-test.sh          # Full API test
│   ├── attack-*.sh            # Attack simulations
│   ├── demo-attack-detection.sh
│   ├── verify-protection.sh
│   └── CURL_EXAMPLES.md
├── postman/
│   ├── Secure-Aura-API.postman_collection.json
│   └── Secure-Aura-Local.postman_environment.json
├── docs/
│   ├── API.md                 # API documentation
│   ├── architecture/
│   │   └── SYSTEM_ARCHITECTURE.md
│   └── guides/
│       └── DEPLOYMENT.md
├── scripts/
│   ├── simulate_attack.sh
│   └── test_api.sh
├── docker-compose.yml         # Service orchestration
├── start.sh                   # Quick start script
└── README.md
```

---

## 🔍 Monitoring & Logs

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f auth-service
docker-compose logs -f monitor-service

# Last 100 lines
docker-compose logs --tail=100 auth-service
```

### Database Queries

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U secureaura -d timing_defense

# View recent auth attempts
SELECT username_attempted, success, processing_time_ms, created_at 
FROM auth_logs 
ORDER BY created_at DESC LIMIT 10;

# View security events
SELECT event_type, severity, ip_address, confidence_score 
FROM security_events 
WHERE resolved = false 
ORDER BY created_at DESC;
```

### Redis Monitoring

```bash
# Connect to Redis
docker-compose exec redis redis-cli -a redis_secure_2024

# Check rate limits
KEYS ratelimit:*

# Check threat levels
KEYS threat:ip:*
```

---

## 🚢 Production Deployment

### Security Checklist

- [ ] Change all default passwords
- [ ] Generate strong JWT secret: `openssl rand -hex 32`
- [ ] Enable SSL/TLS in Nginx
- [ ] Set `ENVIRONMENT=production`
- [ ] Increase `MAX_NOISE_MS` to 300+
- [ ] Configure firewall rules
- [ ] Set up log aggregation
- [ ] Enable database backups

### Docker Compose Production

```bash
# Build and start
docker-compose up -d --build

# Scale services
docker-compose up -d --scale auth-service=3
docker-compose up -d --scale monitor-service=2

# Update single service
docker-compose up -d --no-deps --build auth-service
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/secure-aura/issues)
- **Documentation**: See `docs/` directory
- **Security**: Report vulnerabilities privately

---

<div align="center">

**Built with ❤️ for secure authentication**

[⬆ Back to top](#️-secure-aura---timing-attack-defense-framework)

</div>

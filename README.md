# Secure Aura

**Timing Attack Defense Framework**

Secure Aura is a production-ready framework designed to mitigate timing attacks, username enumeration, and brute-force attempts in authentication systems. It employs quantum timing slots, constant-time operations, and statistical analysis to ensure robust security.

## Key Features

- **Argon2id Hashing**: Utilizes the PHC winner for secure password hashing.
- **Constant-Time Authentication**: Uses `crypto.timingSafeEqual` to prevent timing leaks during verification.
- **Quantum Timing Defense**: Responses are normalized to discrete time slots (100/150/200/250ms) to mask processing time differences.
- **Distributed Attack Protection**: Implements username-based rate limiting to defend against distributed attacks.
- **Real-Time Detection**: Statistical analysis of traffic to detect and mitigate anomalies.
- **Dockerized Architecture**: Fully containerized services for easy deployment and scaling.

## Quick Start

### Prerequisites

- Docker >= 20.10.0
- Docker Compose >= 2.0.0

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/secure-aura.git
   cd secure-aura
   ```

2. Start the services:
   ```bash
   docker-compose up -d
   ```

3. Verify the services are running:
   ```bash
   docker-compose logs -f
   ```

## Architecture

The system is composed of the following services:

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

- **Auth Service**: Handles user registration, login, and token generation with timing protections.
- **Monitor Service**: Analyzes traffic patterns and manages security events.
- **Dashboard**: Provides a real-time UI for monitoring system health and threats.
- **PostgreSQL**: Stores user data and logs.
- **Redis**: Manages rate limits and distributed state.

## Defense Mechanisms

### Timing Attack Protection

Responses are padded or delayed to match specific "quantum" time slots. This prevents attackers from inferring information based on response times.

```javascript
// Quantum timing - fixed time slots instead of random delays
const quantumSlots = [100, 150, 200, 250]; // milliseconds
const targetTime = quantumSlots[cryptoRandomIndex];
```

### Username Enumeration Defense

The system performs dummy hash operations when a user is not found, ensuring that the response time for invalid users matches that of valid users.

```javascript
if (!user) {
  // Execute dummy Argon2 hash - same timing as real verification
  await UsernameEnumerationDefense.generateDummyHash();
}
```

### Brute Force & Distributed Attack Prevention

- **Rate Limiting**: Limits login attempts per IP and per username.
- **Distributed Detection**: Correlates attacks across multiple IPs targeting the same account.

## API Reference

### Auth Service

- `POST /api/auth/register`: Register a new user.
- `POST /api/auth/login`: Authenticate a user.
- `POST /api/auth/verify-token`: Verify a JWT.
- `GET /api/users/me`: Get current user details.

### Monitor Service

- `GET /api/monitor/stats`: Get system statistics.
- `GET /api/monitor/events`: List security events.
- `GET /api/monitor/timing-analysis`: Retrieve timing analysis data.

## Configuration

Configuration is managed via environment variables in the `.env` file.

```bash
# Database
DATABASE_URL=postgresql://secureaura:secureaura_pass_2024@postgres:5432/timing_defense

# Redis
REDIS_URL=redis://:redis_secure_2024@redis:6379/0

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRATION=3600

# Timing Defense
MIN_NOISE_MS=50           # Not used - quantum slots instead
MAX_NOISE_MS=200          # Not used - quantum slots instead
QUANTUM_SLOTS=100,150,200,250  # Fixed timing intervals (ms)

# Detection
DETECTION_THRESHOLD=0.75
ANALYSIS_WINDOW=300

# Rate Limiting
USERNAME_RATE_LIMIT=20    # Max attempts per username in 5 min
IP_RATE_LIMIT=30          # Max login attempts per IP in 1 min
```

### Rate Limits

Configured in `services/auth-service/src/middleware.js`:

```javascript
// IP-based rate limits
requestsPerMinute: 200        // Global limit
loginAttemptsPerMinute: 30    // Login endpoint
registrationPerMinute: 10     // Registration endpoint

// Username-based rate limits (NEW - prevents distributed attacks)
usernameAttemptsPerWindow: 20 // Per username in 5 minutes (from ANY IP)
```

### Quantum Timing Slots

Configured in `services/auth-service/src/constantTimeAuth.js`:

```javascript
// Fixed time slots (not random)
quantumSlots: [100, 150, 200, 250]  // milliseconds

// Threat-adaptive slots
lowThreatSlots: [100, 150]           // Threat level 0.0-0.3
mediumThreatSlots: [150, 200]        // Threat level 0.3-0.7
highThreatSlots: [200, 250, 300]     // Threat level 0.7-1.0
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

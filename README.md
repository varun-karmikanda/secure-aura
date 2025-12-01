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

# Security
JWT_SECRET=your-super-secret-key
QUANTUM_SLOTS=100,150,200,250
```


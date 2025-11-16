# cURL Testing Commands

Complete guide for testing the Secure Aura timing attack defense framework using cURL commands.

---

## Table of Contents
- [Health Check](#health-check)
- [User Registration](#user-registration)
- [User Login](#user-login)
- [Protected Endpoints](#protected-endpoints)
- [Attack Simulations](#attack-simulations)
- [Monitoring & Analytics](#monitoring--analytics)

---

## Health Check

### Check Service Status
```bash
curl -X GET http://localhost:8080/
```

### Health Check Endpoint
```bash
curl -X GET http://localhost:8080/health
```

---

## User Registration

### Successful Registration (New User)
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser1",
    "email": "test1@example.com",
    "password": "SecurePass123!"
  }' \
  -w "\nHTTP Status: %{http_code}\n"
```

### Register Multiple Users
```bash
# User 2
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser2",
    "email": "test2@example.com",
    "password": "SecurePass456!"
  }'

# User 3
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser3",
    "email": "test3@example.com",
    "password": "SecurePass789!"
  }'
```

### Registration - Duplicate Username (Should Fail)
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser1",
    "email": "newemail@example.com",
    "password": "SecurePass123!"
  }' \
  -w "\nHTTP Status: %{http_code}\n"
```

### Registration - Duplicate Email (Should Fail)
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newusername",
    "email": "test1@example.com",
    "password": "SecurePass123!"
  }' \
  -w "\nHTTP Status: %{http_code}\n"
```

### Registration - Invalid Password (Too Short)
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser4",
    "email": "test4@example.com",
    "password": "Short1!"
  }' \
  -w "\nHTTP Status: %{http_code}\n"
```

### Registration - Invalid Password (No Special Character)
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser5",
    "email": "test5@example.com",
    "password": "SecurePass123"
  }' \
  -w "\nHTTP Status: %{http_code}\n"
```

---

## User Login

### Successful Login (Correct Credentials)
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser1",
    "password": "SecurePass123!"
  }' \
  -w "\nHTTP Status: %{http_code}\n"
```

### Save Token for Later Use
```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser1",
    "password": "SecurePass123!"
  }' | jq -r '.access_token')

echo "Token: $TOKEN"
```

### Login - Wrong Password (Valid User)
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser1",
    "password": "WrongPassword123!"
  }' \
  -w "\nHTTP Status: %{http_code}\n"
```

### Login - Non-Existent User
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "nonexistentuser",
    "password": "AnyPassword123!"
  }' \
  -w "\nHTTP Status: %{http_code}\n"
```

---

## Protected Endpoints

### Verify Token
```bash
# Using saved token
curl -X GET http://localhost:8080/api/auth/verify \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nHTTP Status: %{http_code}\n"

# Or with explicit token
curl -X GET http://localhost:8080/api/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -w "\nHTTP Status: %{http_code}\n"
```

### Get User Information
```bash
curl -X GET http://localhost:8080/api/auth/user \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nHTTP Status: %{http_code}\n"
```

### Get User Information - Invalid Token
```bash
curl -X GET http://localhost:8080/api/auth/user \
  -H "Authorization: Bearer invalid.token.here" \
  -w "\nHTTP Status: %{http_code}\n"
```

### Get User Information - No Token
```bash
curl -X GET http://localhost:8080/api/auth/user \
  -w "\nHTTP Status: %{http_code}\n"
```

---

## Attack Simulations

### Brute Force Attack (15 Rapid Attempts)
```bash
echo "=== BRUTE FORCE ATTACK - 15 Attempts ==="
for i in {1..15}; do
  echo -n "Attempt $i: "
  curl -s -X POST http://localhost:8080/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "username": "testuser1",
      "password": "wrongpass'$i'"
    }' \
    -w "Status: %{http_code}\n" | grep -E "(error|Status)" | tr '\n' ' '
  echo ""
  sleep 0.1
done
```

### Brute Force Attack (35 Attempts - Triggers Rate Limit)
```bash
echo "=== BRUTE FORCE ATTACK - 35 Attempts (Rate Limit Test) ==="
for i in {1..35}; do
  echo -n "Attempt $i: "
  curl -s -X POST http://localhost:8080/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "username": "testuser1",
      "password": "wrongpass'$i'"
    }' \
    -w "Status: %{http_code}\n" | grep -E "(error|Status)" | tr '\n' ' '
  echo ""
  sleep 0.1
done
```

### Credential Stuffing Attack (Multiple Users)
```bash
echo "=== CREDENTIAL STUFFING ATTACK ==="
for user in user1 user2 user3 admin testuser root; do
  echo "Testing: $user"
  curl -s -X POST http://localhost:8080/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "username": "'$user'",
      "password": "CommonPassword123!"
    }' \
    -w "Status: %{http_code}\n"
  sleep 0.2
done
```

### Username Enumeration Attack
```bash
echo "=== USERNAME ENUMERATION ATTACK ==="
for username in testuser1 testuser2 nonexistent admin root alice bob; do
  echo -n "Testing: $username - "
  START=$(date +%s%3N)
  curl -s -X POST http://localhost:8080/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "username": "'$username'",
      "password": "password123"
    }' > /dev/null
  END=$(date +%s%3N)
  DURATION=$((END - START))
  echo "Response time: ${DURATION}ms"
  sleep 0.1
done
```

### Timing Attack Test (Compare Response Times)
```bash
echo "=== TIMING ATTACK TEST ==="

echo "Test 1: Valid user, wrong password"
time curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser1","password":"wrongpass"}' > /dev/null

echo -e "\nTest 2: Invalid user"
time curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"nonexistent","password":"wrongpass"}' > /dev/null

echo -e "\nTest 3: Valid credentials"
time curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser1","password":"SecurePass123!"}' > /dev/null
```

### Password Spray Attack
```bash
echo "=== PASSWORD SPRAY ATTACK ==="
COMMON_PASSWORDS=("Password123!" "Admin123!" "Welcome123!" "Test123!" "Secure123!")

for password in "${COMMON_PASSWORDS[@]}"; do
  echo "Testing password: $password"
  for user in testuser1 testuser2 testuser3 admin; do
    curl -s -X POST http://localhost:8080/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{
        "username": "'$user'",
        "password": "'$password'"
      }' > /dev/null
    sleep 0.2
  done
  echo "---"
done
```

### Registration Timing Test
```bash
echo "=== REGISTRATION TIMING TEST ==="

echo "Test 1: New user registration"
time curl -s -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "timingtest1",
    "email": "timing1@example.com",
    "password": "SecurePass123!"
  }' > /dev/null

echo -e "\nTest 2: Duplicate username"
time curl -s -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "timingtest1",
    "email": "different@example.com",
    "password": "SecurePass123!"
  }' > /dev/null

echo -e "\nTest 3: Duplicate email"
time curl -s -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "differentuser",
    "email": "timing1@example.com",
    "password": "SecurePass123!"
  }' > /dev/null
```

---

## Monitoring & Analytics

### View Recent Security Events
```bash
# Check database for security events
docker-compose exec -T postgres psql -U secureaura -d timing_defense -c \
  "SELECT event_type, ip_address, severity, confidence_score, created_at 
   FROM security_events 
   WHERE created_at > NOW() - INTERVAL '10 minutes' 
   ORDER BY created_at DESC 
   LIMIT 10;"
```

### View Failed Login Attempts
```bash
docker-compose exec -T postgres psql -U secureaura -d timing_defense -c \
  "SELECT username_attempted, COUNT(*) as failed_attempts, MAX(created_at) as last_attempt 
   FROM auth_logs 
   WHERE success = false AND created_at > NOW() - INTERVAL '10 minutes' 
   GROUP BY username_attempted 
   ORDER BY failed_attempts DESC 
   LIMIT 10;"
```

### View Timing Statistics
```bash
docker-compose exec -T postgres psql -U secureaura -d timing_defense -c \
  "SELECT event_type, 
          AVG(processing_time_ms) as avg_time, 
          MIN(processing_time_ms) as min_time, 
          MAX(processing_time_ms) as max_time, 
          COUNT(*) as count 
   FROM auth_logs 
   WHERE created_at > NOW() - INTERVAL '10 minutes' 
   GROUP BY event_type;"
```

### View Auth Service Logs
```bash
# View all logs
docker-compose logs auth-service

# View last 50 lines
docker-compose logs auth-service | tail -50

# Follow logs in real-time
docker-compose logs -f auth-service

# View timing-specific logs
docker-compose logs auth-service | grep -E "(Username check|Password check|Actual processing|Noise injection|TOTAL TIME)"
```

### View Monitor Service Logs
```bash
# View all monitor logs
docker-compose logs monitor-service

# View brute force detections
docker-compose logs monitor-service | grep "BRUTE FORCE"

# View timing analysis
docker-compose logs monitor-service | grep "Analyzing IP"
```

### Check Redis for Threat Levels
```bash
docker-compose exec redis redis-cli -a redis_secure_2024 --no-auth-warning KEYS "threat:ip:*"
docker-compose exec redis redis-cli -a redis_secure_2024 --no-auth-warning GET "threat:ip:172.18.0.1"
```

### Check Rate Limiting Status
```bash
docker-compose exec redis redis-cli -a redis_secure_2024 --no-auth-warning KEYS "ratelimit:*"
docker-compose exec redis redis-cli -a redis_secure_2024 --no-auth-warning TTL "ratelimit:172.18.0.1"
```

---

## Complete Testing Workflow

### Step 1: Start Services
```bash
docker-compose up -d
docker-compose ps
```

### Step 2: Register Test Users
```bash
# Register 3 users
for i in {1..3}; do
  curl -X POST http://localhost:8080/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{
      "username": "testuser'$i'",
      "email": "test'$i'@example.com",
      "password": "SecurePass123!"
    }'
  echo ""
done
```

### Step 3: Test Valid Login
```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser1",
    "password": "SecurePass123!"
  }' | jq -r '.access_token')

echo "Token obtained: $TOKEN"
```

### Step 4: Test Protected Endpoints
```bash
curl -X GET http://localhost:8080/api/auth/verify \
  -H "Authorization: Bearer $TOKEN"

curl -X GET http://localhost:8080/api/auth/user \
  -H "Authorization: Bearer $TOKEN"
```

### Step 5: Simulate Brute Force Attack
```bash
for i in {1..35}; do
  curl -s -X POST http://localhost:8080/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"testuser1","password":"wrong'$i'"}' > /dev/null
  sleep 0.1
done
```

### Step 6: Check Detection Results
```bash
# Wait for monitor to analyze (runs every 30 seconds)
sleep 35

# Check security events
docker-compose exec -T postgres psql -U secureaura -d timing_defense -c \
  "SELECT event_type, severity, confidence_score, created_at 
   FROM security_events 
   ORDER BY created_at DESC LIMIT 5;"

# Check monitor logs
docker-compose logs monitor-service | grep "BRUTE FORCE" | tail -5
```

### Step 7: View Detailed Timing Logs
```bash
# Registration timing
docker-compose logs auth-service | grep -A7 "Username check" | tail -30

# Login timing
docker-compose logs auth-service | grep -A7 "User lookup" | tail -30
```

---

## Tips

- Use `jq` to format JSON responses: `curl ... | jq .`
- Use `-w "\nHTTP Status: %{http_code}\n"` to see HTTP status codes
- Use `-s` flag for silent mode (no progress bar)
- Use `-v` flag for verbose output (see headers)
- Save tokens in variables for reuse: `TOKEN=$(curl ... | jq -r '.access_token')`
- Check logs in real-time: `docker-compose logs -f auth-service`

---

## Expected Results

### Successful Registration
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user_id": "uuid-here",
  "username": "testuser1"
}
```

### Successful Login
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user_id": "uuid-here",
  "username": "testuser1"
}
```

### Failed Login (Rate Limited after 30 attempts)
```json
{
  "error": "Account is temporarily locked due to multiple failed login attempts"
}
```

### Brute Force Detection
```sql
event_type          | severity | confidence_score
--------------------+----------+-----------------
brute_force_attack  | critical | 0.99
```

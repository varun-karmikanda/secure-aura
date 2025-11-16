# User-Agent Enhancement for Analytics & Threat Monitoring

## Overview
User-agent information has been enhanced throughout the secure-aura system to provide better tracking and analysis of authentication attempts and security threats.

## Changes Made

### 1. Database Schema Updates (`database/init.sql`)

#### `timing_analysis` Table
- **Added field**: `user_agent TEXT`
- **Purpose**: Store the user-agent of requests used in timing analysis
- **Helps identify**: Browser/client-based attack patterns

#### `security_events` Table  
- **Added field**: `user_agent TEXT`
- **Purpose**: Track which user-agents are associated with detected threats
- **Helps identify**: Tool-based attacks, automated scanners, botnet traffic

### 2. Monitor Service Updates (`services/monitor-service/src/`)

#### `database.js` Changes
- **`TimingAnalysisModel.create()`**: Now accepts and stores `userAgent` parameter
- **`SecurityEventModel.create()`**: Now accepts and stores `userAgent` parameter
- All database insert statements updated to include the new user-agent fields

#### `server.js` Changes

**In `analyzeIpTimingPatterns()` function:**
- Extracts and analyzes user-agent distribution from login attempts
- Identifies the most common user-agent for the IP address
- Stores it in timing analysis records
- Includes user-agent distribution in security event evidence

**In `detectBruteForce()` function:**
- Tracks unique user-agents used in brute force attempts
- Includes user-agent distribution in security event evidence
- Helps identify coordinated attacks using multiple tools/clients

**API Response Enhancements:**
- `/api/monitor/events` - Now returns `user_agent` field
- `/api/monitor/timing-analysis` - Now returns `user_agent` field

### 3. Evidence & Analytics Improvements

The `evidence` field in security events now includes:

```javascript
{
  timingAnalysis: {...},
  enumerationDetection: {...},
  requestCount: number,
  uniqueUserAgents: number,        // NEW: Count of distinct user-agents
  userAgentDistribution: {          // NEW: Breakdown of each user-agent used
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64)": 5,
    "Python-Requests/2.28.0": 3,
    "curl/7.85.0": 2,
    ...
  }
}
```

## Use Cases

### 1. **Attack Pattern Recognition**
- Multiple user-agents from same IP + timing patterns = distributed/tool-based attack
- Single user-agent with suspicious timing = potential automated attack script

### 2. **Threat Intelligence**
- Identify specific bots/scanners (e.g., "nmap", "nikto", "sqlmap")
- Detect use of automation frameworks (Python requests, curl, etc.)
- Recognize credential stuffing tools

### 3. **Dashboard Analytics**
The dashboard can now display:
- Top attacking user-agents
- User-agent diversity metrics
- Attack correlation with specific tools
- Geographical/tool-based threat patterns

### 4. **Response Actions**
Security teams can:
- Block specific user-agents at WAF/rate-limiter level
- Correlate attacks across services using user-agent fingerprinting
- Identify compromised clients/automation tools

## Data Flow

```
Auth Service (captures user-agent)
    ↓
Auth Logs (user_agent field)
    ↓
Monitor Service (continuous analysis)
    ↓
Timing Analysis & Security Events (user_agent stored)
    ↓
Dashboard API (returns user_agent data)
    ↓
Dashboard UI (displays threat intelligence)
```

## Query Examples

### Get attacks by specific user-agent:
```sql
SELECT event_type, severity, COUNT(*) as count
FROM security_events
WHERE user_agent LIKE '%Python%'
AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY event_type, severity;
```

### Identify distributed attacks:
```sql
SELECT ip_address, COUNT(DISTINCT user_agent) as unique_agents, COUNT(*) as total_attempts
FROM auth_logs
WHERE event_type = 'login_failure'
AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
HAVING COUNT(DISTINCT user_agent) > 1
ORDER BY total_attempts DESC;
```

### Track tool-based attacks:
```sql
SELECT user_agent, COUNT(*) as attempts, COUNT(DISTINCT ip_address) as unique_ips
FROM security_events
WHERE severity IN ('high', 'critical')
AND created_at > NOW() - INTERVAL '7 days'
GROUP BY user_agent
ORDER BY attempts DESC;
```

## Testing the Enhancement

### Manual Testing:
1. Test login with different browsers/clients
2. Monitor the security_events and timing_analysis tables
3. Verify user-agent is captured correctly:
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "User-Agent: MyCustomBot/1.0" \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

### Monitoring:
1. Check monitor service logs for user-agent tracking
2. Query the `/api/monitor/events` endpoint for user_agent in responses
3. Verify evidence field contains userAgentDistribution

## Backward Compatibility

- Existing queries without user-agent filtering will continue to work
- User-agent fields default to NULL for historical records
- All APIs remain backward compatible (only adds new fields)

## Future Enhancements

1. **User-Agent Fingerprinting**: Hash user-agent strings for privacy
2. **Bot Detection**: Integrate with bot detection libraries
3. **Geographic Correlation**: Cross-reference user-agent with IP geolocation
4. **ML-Based Clustering**: Identify new attack patterns automatically
5. **Dashboard Widgets**: Real-time user-agent threat heatmaps

## Deployment Notes

1. **Database Migration**: Run `database/init.sql` to add user_agent columns
2. **No Breaking Changes**: Existing code continues to work
3. **Gradual Adoption**: Monitor service will start capturing immediately
4. **Data Cleanup**: Consider indexing user_agent for large deployments

```sql
-- Performance optimization (optional)
CREATE INDEX idx_security_events_user_agent ON security_events(user_agent);
CREATE INDEX idx_timing_analysis_user_agent ON timing_analysis(user_agent);
```

---

**Status**: ✅ Implementation Complete
**User-Agent Tracking**: Enabled across all services
**Analytics Ready**: Available via monitor service APIs

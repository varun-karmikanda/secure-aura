import { useState, useEffect } from "react";
import { StatsCard } from "./StatsCard";
import { Users, Shield, Activity, AlertTriangle, Server, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_MONITOR_API_URL || "http://localhost:8001";

const serviceHealth = [
  { name: "Auth Service", status: "healthy", uptime: "99.9%", latency: "12ms" },
  { name: "Monitor Service", status: "healthy", uptime: "99.8%", latency: "8ms" },
  { name: "API Gateway", status: "healthy", uptime: "100%", latency: "5ms" },
  { name: "Database", status: "healthy", uptime: "99.95%", latency: "3ms" },
];

export function Overview() {
  const [stats, setStats] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // Refresh data every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, eventsRes, timingRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/monitor/stats`),
        axios.get(`${API_BASE_URL}/api/monitor/events?limit=10`),
        axios.get(`${API_BASE_URL}/api/monitor/timing-analysis?limit=100`),
      ]);

      setStats(statsRes.data);
      setEvents(eventsRes.data.events || []);

      // Process timing data for charts
      const timingData = timingRes.data.analyses || [];
      const chartData = processTimingData(timingData, eventsRes.data.events || []);
      setActivityData(chartData);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const processTimingData = (timingAnalyses: any[], securityEvents: any[]) => {
    const now = new Date();
    const hourlyData: { [key: string]: { requests: number; threats: number; timestamp: Date } } = {};

    // Initialize last 12 hours (more reasonable view)
    for (let i = 11; i >= 0; i--) {
      const hourDate = new Date(now.getTime() - i * 60 * 60 * 1000);
      const timeKey = hourDate.getHours().toString().padStart(2, '0');
      hourlyData[timeKey] = {
        requests: 0,
        threats: 0,
        timestamp: hourDate
      };
    }

    // Count requests from timing analysis
    timingAnalyses.forEach(analysis => {
      if (!analysis.created_at) return;
      const date = new Date(analysis.created_at);
      const hoursSinceCreation = (now.getTime() - date.getTime()) / (60 * 60 * 1000);

      // Only include data from last 12 hours
      if (hoursSinceCreation <= 12) {
        const timeKey = date.getHours().toString().padStart(2, '0');
        if (hourlyData[timeKey]) {
          hourlyData[timeKey].requests += analysis.request_count || 1;
        }
      }
    });

    // Count threats from security events
    securityEvents.forEach(event => {
      if (!event.created_at) return;
      const date = new Date(event.created_at);
      const hoursSinceCreation = (now.getTime() - date.getTime()) / (60 * 60 * 1000);

      // Only include data from last 12 hours
      if (hoursSinceCreation <= 12) {
        const timeKey = date.getHours().toString().padStart(2, '0');
        if (hourlyData[timeKey]) {
          hourlyData[timeKey].threats += 1;
        }
      }
    });

    // Convert to array for chart and format time labels
    return Object.keys(hourlyData)
      .sort()
      .map((hourKey) => {
        const data = hourlyData[hourKey];
        const hour = data.timestamp.getHours();

        // Format time label - just show hour
        let timeLabel: string;
        if (hour === now.getHours() && now.getMinutes() < 30) {
          timeLabel = 'Now';
        } else {
          timeLabel = hour.toString().padStart(2, '0');
        }

        return {
          time: timeLabel,
          requests: data.requests,
          threats: data.threats,
        };
      });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/10 text-red-400 border-red-500/50";
      case "high":
        return "bg-orange-500/10 text-orange-400 border-orange-500/50";
      case "medium":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/50";
      case "low":
        return "bg-blue-500/10 text-blue-400 border-blue-500/50";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/50";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold gradient-text">Dashboard Overview</h1>
        {/* <p className="text-muted-foreground mt-1">Monitor your system health and security metrics</p> */}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Auth Attempts"
          value={stats?.total_auth_attempts?.toString() || "0"}
          change={`${stats?.successful_logins || 0} successful`}
          changeType="neutral"
          icon={Users}
          delay={100}
        />
        <StatsCard
          title="Successful Logins"
          value={stats?.successful_logins?.toString() || "0"}
          change={`${stats?.failed_logins || 0} failed`}
          changeType={stats?.successful_logins > stats?.failed_logins ? "increase" : "decrease"}
          icon={Activity}
          iconColor="text-success"
          delay={200}
        />
        <StatsCard
          title="Security Events"
          value={stats?.security_events?.toString() || "0"}
          change="Last 24 hours"
          changeType="neutral"
          icon={Shield}
          iconColor="text-info"
          delay={300}
        />
        <StatsCard
          title="Active Threats"
          value={stats?.active_threats?.toString() || "0"}
          change={stats?.active_threats > 0 ? "Requires attention" : "All clear"}
          changeType={stats?.active_threats > 0 ? "decrease" : "increase"}
          icon={AlertTriangle}
          iconColor={stats?.active_threats > 0 ? "text-warning" : "text-success"}
          delay={400}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="glass rounded-xl p-5 animate-fade-in-up gradient-border" style={{ animationDelay: "500ms" }}>
          <h3 className="text-lg font-semibold text-foreground mb-4">Request Activity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(187, 100%, 50%)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(187, 100%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 20%)" />
                <XAxis
                  dataKey="time"
                  stroke="hsl(215, 20%, 55%)"
                  fontSize={12}
                  label={{ value: 'Hour', position: 'insideBottom', offset: -5, fill: 'hsl(215, 20%, 55%)' }}
                />
                <YAxis
                  stroke="hsl(215, 20%, 55%)"
                  fontSize={12}
                  label={{ value: 'Requests', angle: -90, position: 'insideLeft', fill: 'hsl(215, 20%, 55%)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222, 47%, 8%)",
                    border: "1px solid hsl(217, 33%, 20%)",
                    borderRadius: "8px"
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke="hsl(187, 100%, 50%)"
                  fillOpacity={1}
                  fill="url(#colorRequests)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Threats Chart */}
        <div className="glass rounded-xl p-5 animate-fade-in-up gradient-border" style={{ animationDelay: "600ms" }}>
          <h3 className="text-lg font-semibold text-foreground mb-4">Threats Detected</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 20%)" />
                <XAxis
                  dataKey="time"
                  stroke="hsl(215, 20%, 55%)"
                  fontSize={12}
                  label={{ value: 'Hour', position: 'insideBottom', offset: -5, fill: 'hsl(215, 20%, 55%)' }}
                />
                <YAxis
                  stroke="hsl(215, 20%, 55%)"
                  fontSize={12}
                  label={{ value: 'Threats', angle: -90, position: 'insideLeft', fill: 'hsl(215, 20%, 55%)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222, 47%, 8%, 0.7)",
                    border: "1px solid hsl(217, 33%, 20%)",
                    borderRadius: "8px",
                    opacity: 0.9
                  }}
                />
                <Bar
                  dataKey="threats"
                  fill="hsl(0, 84%, 60%)"
                  fillOpacity={0.1}
                  radius={[4, 4, 0, 0]}
                  activeBar={{ fillOpacity: 0.5 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Service Health & Recent Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Health */}
        <div className="glass rounded-xl p-5 animate-fade-in-up gradient-border" style={{ animationDelay: "700ms" }}>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" />
            Service Health
          </h3>
          <div className="space-y-3">
            {serviceHealth.map((service, index) => (
              <div
                key={service.name}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="font-medium text-foreground">{service.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">{service.uptime}</span>
                  <span className="text-primary font-mono">{service.latency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Events */}
        <div className="glass rounded-xl p-5 animate-fade-in-up gradient-border" style={{ animationDelay: "800ms" }}>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Recent Events
          </h3>
          <div className="space-y-3">
            {events.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No recent events</p>
            ) : (
              events.slice(0, 5).map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full mt-2 ${event.severity === "critical" || event.severity === "high" ? "bg-destructive" :
                    event.severity === "medium" ? "bg-warning" :
                      "bg-info"
                    }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded border ${getSeverityColor(event.severity)}`}>
                        {event.severity.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-foreground">{event.event_type.replace(/_/g, " ")}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {event.ip_address}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Confidence: {(event.confidence_score * 100).toFixed(0)}%
                      </span>
                    </div>
                    {event.attack_vector && (
                      <p className="text-xs text-muted-foreground truncate mb-1">
                        {event.attack_vector}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">{formatTimeAgo(event.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

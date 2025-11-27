import { StatsCard } from "./StatsCard";
import { Users, Shield, Activity, AlertTriangle, Server, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const activityData = [
  { time: "00:00", requests: 120, threats: 2 },
  { time: "04:00", requests: 80, threats: 1 },
  { time: "08:00", requests: 350, threats: 5 },
  { time: "12:00", requests: 520, threats: 8 },
  { time: "16:00", requests: 480, threats: 3 },
  { time: "20:00", requests: 290, threats: 2 },
  { time: "Now", requests: 180, threats: 1 },
];

const serviceHealth = [
  { name: "Auth Service", status: "healthy", uptime: "99.9%", latency: "12ms" },
  { name: "Monitor Service", status: "healthy", uptime: "99.8%", latency: "8ms" },
  { name: "API Gateway", status: "healthy", uptime: "100%", latency: "5ms" },
  { name: "Database", status: "healthy", uptime: "99.95%", latency: "3ms" },
];

const recentEvents = [
  { id: 1, type: "login", message: "User admin@secure-aura.dev logged in", time: "2 min ago", severity: "info" },
  { id: 2, type: "threat", message: "Rate limit exceeded from 192.168.1.100", time: "5 min ago", severity: "warning" },
  { id: 3, type: "security", message: "Failed login attempt blocked", time: "12 min ago", severity: "error" },
  { id: 4, type: "system", message: "Database backup completed", time: "1 hour ago", severity: "success" },
  { id: 5, type: "login", message: "New user registration: user@example.com", time: "2 hours ago", severity: "info" },
];

export function Overview() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold gradient-text">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">Monitor your system health and security metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Users"
          value="2,847"
          change="+12.5% from last week"
          changeType="increase"
          icon={Users}
          delay={100}
        />
        <StatsCard
          title="Active Sessions"
          value="384"
          change="Currently online"
          changeType="neutral"
          icon={Activity}
          iconColor="text-success"
          delay={200}
        />
        <StatsCard
          title="Threats Blocked"
          value="156"
          change="-8.3% from last week"
          changeType="decrease"
          icon={Shield}
          iconColor="text-info"
          delay={300}
        />
        <StatsCard
          title="Alert Events"
          value="23"
          change="3 require attention"
          changeType="neutral"
          icon={AlertTriangle}
          iconColor="text-warning"
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
                    <stop offset="5%" stopColor="hsl(187, 100%, 50%)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(187, 100%, 50%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 20%)" />
                <XAxis dataKey="time" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
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
                <XAxis dataKey="time" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(222, 47%, 8%)", 
                    border: "1px solid hsl(217, 33%, 20%)",
                    borderRadius: "8px"
                  }}
                />
                <Bar 
                  dataKey="threats" 
                  fill="hsl(0, 84%, 60%)" 
                  radius={[4, 4, 0, 0]}
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
            {recentEvents.map((event) => (
              <div 
                key={event.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  event.severity === "error" ? "bg-destructive" :
                  event.severity === "warning" ? "bg-warning" :
                  event.severity === "success" ? "bg-success" :
                  "bg-info"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{event.message}</p>
                  <p className="text-xs text-muted-foreground">{event.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

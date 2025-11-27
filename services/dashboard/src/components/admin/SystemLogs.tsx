import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Download, 
  RefreshCw,
  Filter,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  Server
} from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  level: "error" | "warn" | "info" | "debug";
  service: "auth" | "monitor" | "api" | "database";
  message: string;
}

const mockLogs: LogEntry[] = [
  { id: "1", timestamp: "2024-03-28 14:32:15.234", level: "error", service: "auth", message: "Failed login attempt: Invalid credentials for user admin@test.com" },
  { id: "2", timestamp: "2024-03-28 14:32:14.891", level: "warn", service: "monitor", message: "Rate limit threshold reached for IP 192.168.1.100 (95/100 requests)" },
  { id: "3", timestamp: "2024-03-28 14:32:14.567", level: "info", service: "api", message: "GET /api/profile - 200 OK - 12ms" },
  { id: "4", timestamp: "2024-03-28 14:32:13.234", level: "info", service: "auth", message: "User john.doe@example.com successfully authenticated" },
  { id: "5", timestamp: "2024-03-28 14:32:12.891", level: "debug", service: "database", message: "Query executed: SELECT * FROM users WHERE email = $1" },
  { id: "6", timestamp: "2024-03-28 14:32:11.567", level: "info", service: "monitor", message: "Threat detection scan completed: 0 threats found" },
  { id: "7", timestamp: "2024-03-28 14:32:10.234", level: "warn", service: "auth", message: "Token refresh requested for expired session" },
  { id: "8", timestamp: "2024-03-28 14:32:09.891", level: "error", service: "api", message: "POST /api/register - 400 Bad Request - Email already exists" },
  { id: "9", timestamp: "2024-03-28 14:32:08.567", level: "info", service: "database", message: "Connection pool: 5 active, 15 idle connections" },
  { id: "10", timestamp: "2024-03-28 14:32:07.234", level: "info", service: "auth", message: "New user registration: alice.johnson@example.com" },
  { id: "11", timestamp: "2024-03-28 14:32:06.891", level: "warn", service: "monitor", message: "Suspicious activity detected: Multiple failed logins from same IP" },
  { id: "12", timestamp: "2024-03-28 14:32:05.567", level: "info", service: "api", message: "PUT /api/profile - 200 OK - 8ms" },
  { id: "13", timestamp: "2024-03-28 14:32:04.234", level: "debug", service: "auth", message: "JWT token validated successfully for user_id: usr_abc123" },
  { id: "14", timestamp: "2024-03-28 14:32:03.891", level: "info", service: "monitor", message: "System health check: All services operational" },
  { id: "15", timestamp: "2024-03-28 14:32:02.567", level: "error", service: "database", message: "Connection timeout after 30s - retrying..." },
];

const levelConfig = {
  error: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30" },
  warn: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", border: "border-warning/30" },
  info: { icon: Info, color: "text-info", bg: "bg-info/10", border: "border-info/30" },
  debug: { icon: CheckCircle, color: "text-muted-foreground", bg: "bg-muted/30", border: "border-border" },
};

const serviceColors = {
  auth: "text-primary",
  monitor: "text-warning",
  api: "text-success",
  database: "text-info",
};

export function SystemLogs() {
  const [logs, setLogs] = useState<LogEntry[]>(mockLogs);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [isLive, setIsLive] = useState(false);

  // Simulate live log streaming
  useEffect(() => {
    if (!isLive) return;
    
    const interval = setInterval(() => {
      const services = ["auth", "monitor", "api", "database"] as const;
      const levels = ["error", "warn", "info", "debug"] as const;
      const messages = [
        "Request processed successfully",
        "Cache invalidated for user session",
        "Background job completed",
        "Webhook delivery attempted",
        "Rate limit check passed",
      ];
      
      const newLog: LogEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString().replace("T", " ").slice(0, -1),
        level: levels[Math.floor(Math.random() * 4)],
        service: services[Math.floor(Math.random() * 4)],
        message: messages[Math.floor(Math.random() * messages.length)],
      };
      
      setLogs(prev => [newLog, ...prev.slice(0, 49)]);
    }, 2000);

    return () => clearInterval(interval);
  }, [isLive]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === "all" || log.level === levelFilter;
    const matchesService = serviceFilter === "all" || log.service === serviceFilter;
    return matchesSearch && matchesLevel && matchesService;
  });

  const logCounts = {
    error: logs.filter(l => l.level === "error").length,
    warn: logs.filter(l => l.level === "warn").length,
    info: logs.filter(l => l.level === "info").length,
    debug: logs.filter(l => l.level === "debug").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold gradient-text">System Logs</h1>
          <p className="text-muted-foreground mt-1">Real-time monitoring and log analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={isLive ? "glow" : "outline"}
            onClick={() => setIsLive(!isLive)}
            className={cn(isLive && "animate-pulse-glow")}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isLive && "animate-spin")} />
            {isLive ? "Live" : "Paused"}
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Log Level Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(["error", "warn", "info", "debug"] as const).map((level, index) => {
          const config = levelConfig[level];
          const Icon = config.icon;
          return (
            <div 
              key={level}
              className={cn(
                "glass rounded-xl p-4 animate-fade-in-up cursor-pointer transition-all",
                levelFilter === level && "ring-2 ring-primary",
                config.bg, config.border, "border"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => setLevelFilter(levelFilter === level ? "all" : level)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground capitalize">{level}</p>
                  <p className={cn("text-2xl font-bold", config.color)}>{logCounts[level]}</p>
                </div>
                <Icon className={cn("w-6 h-6", config.color)} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logs..."
            className="pl-10 bg-muted/50 border-border/50"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-muted/30">
            <Server className="w-4 h-4 text-muted-foreground" />
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="bg-transparent text-sm focus:outline-none cursor-pointer"
            >
              <option value="all">All Services</option>
              <option value="auth">Auth</option>
              <option value="monitor">Monitor</option>
              <option value="api">API</option>
              <option value="database">Database</option>
            </select>
          </div>
        </div>
      </div>

      {/* Log List */}
      <div className="glass rounded-xl overflow-hidden animate-fade-in-up gradient-border" style={{ animationDelay: "500ms" }}>
        <div className="max-h-[600px] overflow-y-auto">
          {filteredLogs.map((log, index) => {
            const config = levelConfig[log.level];
            const Icon = config.icon;
            return (
              <div
                key={log.id}
                className={cn(
                  "flex items-start gap-3 p-3 border-b border-border/30 hover:bg-muted/30 transition-colors",
                  index === 0 && isLive && "animate-fade-in bg-primary/5"
                )}
              >
                <div className={cn("p-1.5 rounded-md", config.bg)}>
                  <Icon className={cn("w-4 h-4", config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("text-xs font-semibold uppercase", serviceColors[log.service])}>
                      [{log.service}]
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {log.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-foreground font-mono">{log.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

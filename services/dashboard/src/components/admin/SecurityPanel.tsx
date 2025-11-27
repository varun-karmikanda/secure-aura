import { cn } from "@/lib/utils";
import { 
  Shield, 
  Lock, 
  Key, 
  AlertTriangle, 
  CheckCircle,
  Globe,
  Fingerprint,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const securityFeatures = [
  { 
    id: "rate-limiting", 
    name: "Rate Limiting", 
    description: "Limit requests per IP address",
    enabled: true, 
    icon: Globe,
    status: "Active - 100 req/min"
  },
  { 
    id: "jwt-auth", 
    name: "JWT Authentication", 
    description: "Secure token-based authentication",
    enabled: true, 
    icon: Key,
    status: "RS256 Algorithm"
  },
  { 
    id: "brute-force", 
    name: "Brute Force Protection", 
    description: "Auto-lock after failed attempts",
    enabled: true, 
    icon: Lock,
    status: "5 attempts / 15 min"
  },
  { 
    id: "threat-detection", 
    name: "Threat Detection", 
    description: "ML-powered anomaly detection",
    enabled: true, 
    icon: Eye,
    status: "Real-time monitoring"
  },
  { 
    id: "2fa", 
    name: "Two-Factor Auth", 
    description: "Optional 2FA for users",
    enabled: false, 
    icon: Fingerprint,
    status: "Disabled"
  },
];

const recentThreats = [
  { id: 1, type: "Brute Force", ip: "192.168.1.100", time: "5 min ago", blocked: true },
  { id: 2, type: "SQL Injection", ip: "10.0.0.55", time: "12 min ago", blocked: true },
  { id: 3, type: "Rate Limit", ip: "172.16.0.23", time: "28 min ago", blocked: true },
  { id: 4, type: "Invalid Token", ip: "192.168.2.50", time: "1 hour ago", blocked: true },
];

export function SecurityPanel() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold gradient-text">Security Center</h1>
        <p className="text-muted-foreground mt-1">Monitor and configure security settings</p>
      </div>

      {/* Security Score */}
      <div className="glass rounded-xl p-6 animate-fade-in-up gradient-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Security Score</h3>
            <p className="text-muted-foreground text-sm">Based on enabled features and recent activity</p>
          </div>
          <div className="relative">
            <svg className="w-24 h-24 -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="hsl(var(--muted))"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="url(#scoreGradient)"
                strokeWidth="8"
                fill="none"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 * 0.15}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(187, 100%, 50%)" />
                  <stop offset="100%" stopColor="hsl(142, 76%, 45%)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold gradient-text">85</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Features */}
        <div className="glass rounded-xl p-5 animate-fade-in-up gradient-border" style={{ animationDelay: "100ms" }}>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Security Features
          </h3>
          <div className="space-y-3">
            {securityFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={feature.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors animate-fade-in"
                  style={{ animationDelay: `${200 + index * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      feature.enabled ? "bg-primary/10" : "bg-muted"
                    )}>
                      <Icon className={cn(
                        "w-4 h-4",
                        feature.enabled ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{feature.name}</p>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-xs px-2 py-1 rounded",
                      feature.enabled ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    )}>
                      {feature.status}
                    </span>
                    <Switch checked={feature.enabled} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Threats */}
        <div className="glass rounded-xl p-5 animate-fade-in-up gradient-border" style={{ animationDelay: "200ms" }}>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Recent Threats Blocked
          </h3>
          <div className="space-y-3">
            {recentThreats.map((threat, index) => (
              <div 
                key={threat.id}
                className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20 animate-fade-in"
                style={{ animationDelay: `${300 + index * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{threat.type}</p>
                    <p className="text-xs text-muted-foreground font-mono">{threat.ip}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{threat.time}</span>
                  <CheckCircle className="w-4 h-4 text-success" />
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4">
            View All Threats
          </Button>
        </div>
      </div>
    </div>
  );
}

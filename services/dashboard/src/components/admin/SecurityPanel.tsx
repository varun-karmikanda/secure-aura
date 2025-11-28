import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Shield,
  Lock,
  Key,
  AlertTriangle,
  CheckCircle,
  Globe,
  Fingerprint,
  Eye,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8000';
const MONITOR_API_URL = import.meta.env.VITE_MONITOR_API_URL || 'http://localhost:8001';

interface SecurityFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  icon: any;
  status: string;
  value?: any;
}

const defaultFeatures: SecurityFeature[] = [
  {
    id: "rate-limiting",
    name: "Rate Limiting",
    description: "Limit requests per IP address",
    enabled: true,
    icon: Globe,
    status: "Active - 100 req/min",
    value: 100
  },
  {
    id: "jwt-auth",
    name: "JWT Authentication",
    description: "Secure token-based authentication",
    enabled: true,
    icon: Key,
    status: "RS256 Algorithm",
    value: "RS256"
  },
  {
    id: "brute-force",
    name: "Brute Force Protection",
    description: "Auto-lock after failed attempts",
    enabled: true,
    icon: Lock,
    status: "5 attempts / 15 min",
    value: 5
  },
  {
    id: "threat-detection",
    name: "Threat Detection",
    description: "ML-powered anomaly detection",
    enabled: true,
    icon: Eye,
    status: "Real-time monitoring",
    value: "active"
  },
];

const recentThreats = [
  { id: 1, type: "Brute Force", ip: "192.168.1.100", time: "5 min ago", blocked: true },
  { id: 2, type: "SQL Injection", ip: "10.0.0.55", time: "12 min ago", blocked: true },
  { id: 3, type: "Rate Limit", ip: "172.16.0.23", time: "28 min ago", blocked: true },
  { id: 4, type: "Invalid Token", ip: "192.168.2.50", time: "1 hour ago", blocked: true },
];

export function SecurityPanel({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [securityFeatures, setSecurityFeatures] = useState<SecurityFeature[]>(defaultFeatures);
  const [loading, setLoading] = useState(false);
  const [threats, setThreats] = useState<any[]>([]);
  const [isLive, setIsLive] = useState(false);

  // Fetch security settings and threats
  useEffect(() => {
    fetchSettings();
    fetchThreats();

    let interval: NodeJS.Timeout;
    if (isLive) {
      interval = setInterval(fetchThreats, 5000);
    }
    return () => clearInterval(interval);
  }, [isLive]);

  const fetchThreats = async () => {
    try {
      const response = await fetch(`${MONITOR_API_URL}/api/monitor/events?limit=5`);
      if (response.ok) {
        const data = await response.json();
        setThreats(data.events || []);
      }
    } catch (error) {
      console.error('Error fetching threats:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${AUTH_API_URL}/api/admin/security/settings`);
      if (response.ok) {
        const data = await response.json();
        const settings = data.settings;

        // Update features with API data
        const updatedFeatures = defaultFeatures.map(feature => {
          const apiSetting = settings[feature.id];
          if (apiSetting) {
            return {
              ...feature,
              enabled: apiSetting.enabled,
              value: apiSetting.value,
              status: getStatus(feature.id, apiSetting.enabled, apiSetting.value)
            };
          }
          return feature;
        });

        setSecurityFeatures(updatedFeatures);
      }
    } catch (error) {
      console.error('Error fetching security settings:', error);
    }
  };

  const getStatus = (id: string, enabled: boolean, value: any): string => {
    if (!enabled) return "Disabled";

    switch (id) {
      case "rate-limiting":
        return `Active - ${value} req/min`;
      case "brute-force":
        return `${value} attempts / 15 min`;
      case "jwt-auth":
        return `${value} Algorithm`;
      case "threat-detection":
        return "Real-time monitoring";
      case "2fa":
        return enabled ? "Enabled" : "Disabled";
      default:
        return enabled ? "Enabled" : "Disabled";
    }
  };

  const handleToggle = async (featureId: string, currentEnabled: boolean) => {
    setLoading(true);
    try {
      const feature = securityFeatures.find(f => f.id === featureId);
      const newEnabled = !currentEnabled;

      const response = await fetch(`${AUTH_API_URL}/api/admin/security/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settingId: featureId,
          enabled: newEnabled,
          value: feature?.value
        }),
      });

      if (response.ok) {
        // Update local state
        setSecurityFeatures(prev => prev.map(f => {
          if (f.id === featureId) {
            return {
              ...f,
              enabled: newEnabled,
              status: getStatus(f.id, newEnabled, f.value)
            };
          }
          return f;
        }));
      } else {
        console.error('Failed to update setting');
      }
    } catch (error) {
      console.error('Error updating security setting:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Security Center</h1>
          {/* <p className="text-muted-foreground mt-1">Monitor and configure security settings</p> */}
        </div>
        <Button
          variant={isLive ? "glow" : "outline"}
          onClick={() => setIsLive(!isLive)}
          className={cn(isLive && "animate-pulse-glow")}
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", isLive && "animate-spin")} />
          {isLive ? "Live" : "Paused"}
        </Button>
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
                strokeDashoffset={251.2 * (1 - (securityFeatures.filter(f => f.enabled).length / securityFeatures.length))}
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
              <span className="text-2xl font-bold gradient-text">
                {Math.round((securityFeatures.filter(f => f.enabled).length / securityFeatures.length) * 100)}
              </span>
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
                    <Switch
                      checked={feature.enabled}
                      onCheckedChange={() => handleToggle(feature.id, feature.enabled)}
                      disabled={loading}
                    />
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
            {threats.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No recent threats detected</p>
            ) : (
              threats.map((threat, index) => (
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
                      <p className="font-medium text-foreground text-sm">{threat.event_type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground font-mono">{threat.ip_address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{formatTimeAgo(threat.created_at)}</span>
                    <CheckCircle className="w-4 h-4 text-success" />
                  </div>
                </div>
              ))
            )}
          </div>
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => onNavigate?.('logs')}
          >
            View All Threats
          </Button>
        </div>
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, 
  Database, 
  Key, 
  Mail, 
  Bell, 
  Globe,
  Save,
  RefreshCw
} from "lucide-react";

const configSections = [
  {
    id: "api",
    title: "API Configuration",
    icon: Globe,
    settings: [
      { key: "API_BASE_URL", value: "http://localhost:8080", type: "text" },
      { key: "API_TIMEOUT", value: "30000", type: "text" },
      { key: "CORS_ENABLED", value: true, type: "toggle" },
    ]
  },
  {
    id: "database",
    title: "Database",
    icon: Database,
    settings: [
      { key: "DB_HOST", value: "localhost", type: "text" },
      { key: "DB_PORT", value: "5432", type: "text" },
      { key: "DB_POOL_SIZE", value: "20", type: "text" },
    ]
  },
  {
    id: "auth",
    title: "Authentication",
    icon: Key,
    settings: [
      { key: "JWT_EXPIRES_IN", value: "1h", type: "text" },
      { key: "REFRESH_TOKEN_EXPIRES", value: "7d", type: "text" },
      { key: "REQUIRE_EMAIL_VERIFICATION", value: false, type: "toggle" },
    ]
  },
  {
    id: "notifications",
    title: "Notifications",
    icon: Bell,
    settings: [
      { key: "EMAIL_ALERTS", value: true, type: "toggle" },
      { key: "SLACK_WEBHOOK", value: "", type: "text" },
      { key: "ALERT_THRESHOLD", value: "10", type: "text" },
    ]
  },
];

export function SettingsPanel() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure your system preferences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button className="glow">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {configSections.map((section, sectionIndex) => {
          const Icon = section.icon;
          return (
            <div 
              key={section.id}
              className="glass rounded-xl p-5 animate-fade-in-up gradient-border"
              style={{ animationDelay: `${sectionIndex * 100}ms` }}
            >
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Icon className="w-5 h-5 text-primary" />
                {section.title}
              </h3>
              <div className="space-y-4">
                {section.settings.map((setting, index) => (
                  <div 
                    key={setting.key}
                    className="flex items-center justify-between animate-fade-in"
                    style={{ animationDelay: `${(sectionIndex * 100) + (index * 50) + 100}ms` }}
                  >
                    <label className="text-sm font-mono text-muted-foreground">
                      {setting.key}
                    </label>
                    {setting.type === "toggle" ? (
                      <Switch checked={setting.value as boolean} />
                    ) : (
                      <Input
                        defaultValue={setting.value as string}
                        className="w-48 bg-muted/30 border-border/50 font-mono text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Environment Info */}
      <div className="glass rounded-xl p-5 animate-fade-in-up gradient-border" style={{ animationDelay: "400ms" }}>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          Environment Information
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Environment", value: "Development" },
            { label: "Version", value: "1.0.0" },
            { label: "Node Version", value: "v20.10.0" },
            { label: "Platform", value: "Docker" },
          ].map((item, index) => (
            <div 
              key={item.label}
              className="p-3 rounded-lg bg-muted/30 animate-fade-in"
              style={{ animationDelay: `${500 + index * 50}ms` }}
            >
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-sm font-mono text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

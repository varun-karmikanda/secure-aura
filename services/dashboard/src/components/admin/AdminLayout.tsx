import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import {
  LayoutDashboard,
  Send,
  Users,
  FileText,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  LogOut,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "api-tester", label: "API Tester", icon: Send },
  { id: "users", label: "Users", icon: Users },
  { id: "logs", label: "System Logs", icon: FileText },
  { id: "security", label: "Security", icon: Shield },
];

export function AdminLayout({ children, activeTab, onTabChange }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin-aura/login");
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full glass-strong z-50 flex flex-col transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="h-24 border-b border-primary/20 flex items-center justify-center">
          <div className="flex items-center justify-center gap-3">

            <img src="/SecureAura.png" alt="Secure Aura" className="w-16 h-16 object-contain pt-2" />
            {!collapsed && (
              <div className="animate-fade-in">
                <h1 className="font-semibold text-foreground">SecureAura</h1>
                <p className="text-xs text-muted-foreground">Admin Panel</p>
              </div>
            )}
          </div>
        </div>

        {/* Admin User Info */}
        {!collapsed && user && (
          <div className="p-3 border-b border-primary/20 bg-accent/20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user.username}</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  "hover:bg-accent/50 group hover:border hover:border-primary/30",
                  isActive && "bg-primary/10 border border-primary/50 glow",
                  !collapsed && "animate-fade-in"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {!collapsed && (
                  <span
                    className={cn(
                      "text-sm font-medium transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Back to Home */}
        <div className="p-3 border-t border-border/50 mt-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className={cn(
              "w-full text-muted-foreground hover:text-foreground",
              collapsed ? "justify-center" : "justify-start"
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            {!collapsed && <span className="ml-2">Back to Home</span>}
          </Button>
        </div>

        {/* Logout Button */}
        <div className="p-3 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className={cn(
              "w-full text-destructive hover:text-destructive hover:bg-destructive/10",
              collapsed ? "justify-center" : "justify-start"
            )}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>

        {/* Collapse Toggle */}
        <div className="p-3 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full justify-center"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300",
          collapsed ? "ml-16" : "ml-64"
        )}
      >
        <div className="p-6 min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}

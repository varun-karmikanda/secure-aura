import { Link } from "react-router-dom";
import { Shield, Lock, Terminal, Copy, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { HeroSection } from "@/components/landing/HeroSection";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-zinc-950 text-slate-200 font-sans selection:bg-cyan-500/30">
      {/* Navigation */}
      <nav className="border-b border-cyan-500/10 backdrop-blur-md bg-zinc-950/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <img src="/SecureAura.png" alt="Secure Aura" className="w-16 h-16 object-contain pt-2" />
              <h1 className="text-xl font-bold text-white tracking-tight">
                Secure<span className="text-cyan-400">Aura</span>
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/simulate"
                className="group flex items-center gap-2 px-4 py-2 hover:bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg transition-all duration-200"
              >
                <Terminal className="w-4 h-4 group-hover:text-purple-300 transition-colors" />
                <span className="font-medium">Simulation</span>
              </Link>
              <Link
                to="/admin-aura"
                className="group flex items-center gap-2 px-4 py-2 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded-lg transition-all duration-200"
              >
                <Lock className="w-4 h-4 group-hover:text-cyan-300 transition-colors" />
                <span className="font-medium">Admin Portal</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <HeroSection />

        {/* API Documentation Section */}
        <div id="api-docs" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-zinc-800/50">
          <div className="mb-16 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-6">
              <Terminal className="w-3 h-3" />
              API Reference
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">
              Developer <span className="text-cyan-400">Documentation</span>
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              Integrate advanced timing attack protection directly into your applications with our simple, secure API endpoints.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Sidebar Navigation (Desktop) */}
            <div className="hidden lg:block lg:col-span-3 space-y-8 sticky top-24 self-start">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider pl-3 border-l-2 border-cyan-500">
                  Services
                </h3>
                <nav className="space-y-1">
                  <a href="#auth-service" className="block px-3 py-2 text-sm text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/5 rounded-md transition-colors">
                    Auth Service
                  </a>
                  <a href="#monitor-service" className="block px-3 py-2 text-sm text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/5 rounded-md transition-colors">
                    Monitor Service
                  </a>
                  <a href="#admin-api" className="block px-3 py-2 text-sm text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/5 rounded-md transition-colors">
                    Admin API
                  </a>
                </nav>
              </div>
            </div>

            {/* API Content */}
            <div className="lg:col-span-9 space-y-16">

              {/* Auth Service */}
              <section id="auth-service" className="space-y-6 scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                    <Lock className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Auth Service</h2>
                    <p className="text-slate-400 text-sm">Authentication and user management endpoints.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <EndpointCard
                    method="POST"
                    path="/api/auth/register"
                    description="Register a new user account with secure password hashing."
                    params={[
                      { name: "username", type: "string", required: true, desc: "Unique username" },
                      { name: "password", type: "string", required: true, desc: "User password (min 8 chars)" },
                      { name: "email", type: "string", required: true, desc: "Valid email address" }
                    ]}
                  />
                  <EndpointCard
                    method="POST"
                    path="/api/auth/login"
                    description="Authenticate a user and receive a JWT token. Protected against timing attacks."
                    params={[
                      { name: "username", type: "string", required: true, desc: "Registered username" },
                      { name: "password", type: "string", required: true, desc: "User password" }
                    ]}
                  />
                  <EndpointCard
                    method="GET"
                    path="/api/auth/verify"
                    description="Verify the validity of a JWT token."
                    authRequired
                  />
                </div>
              </section>

              {/* Monitor Service */}
              <section id="monitor-service" className="space-y-6 scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                    <Activity className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Monitor Service</h2>
                    <p className="text-slate-400 text-sm">System health, metrics, and security event monitoring.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <EndpointCard
                    method="GET"
                    path="/api/monitor/stats"
                    description="Retrieve aggregated system statistics and health metrics."
                  />
                  <EndpointCard
                    method="GET"
                    path="/api/monitor/events"
                    description="List recent security events and detected threats."
                    params={[
                      { name: "limit", type: "number", required: false, desc: "Number of events to return (default: 50)" },
                      { name: "severity", type: "string", required: false, desc: "Filter by severity (low, medium, high, critical)" }
                    ]}
                  />
                  <EndpointCard
                    method="GET"
                    path="/api/monitor/logs"
                    description="Fetch system authentication logs."
                    params={[
                      { name: "limit", type: "number", required: false, desc: "Max logs to retrieve" }
                    ]}
                  />
                  <EndpointCard
                    method="GET"
                    path="/api/monitor/timing-analysis"
                    description="Get analysis data on request timing for anomaly detection."
                  />
                </div>
              </section>

              {/* Admin API */}
              <section id="admin-api" className="space-y-6 scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                    <Shield className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Admin API</h2>
                    <p className="text-slate-400 text-sm">Administrative controls and security configuration.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <EndpointCard
                    method="POST"
                    path="/api/auth/admin/login"
                    description="Admin authentication endpoint."
                    params={[
                      { name: "username", type: "string", required: true, desc: "Admin username" },
                      { name: "password", type: "string", required: true, desc: "Admin password" }
                    ]}
                  />
                  <EndpointCard
                    method="GET"
                    path="/api/auth/admin/security/settings"
                    description="Retrieve current security configuration settings."
                    authRequired
                    adminOnly
                  />
                  <EndpointCard
                    method="PUT"
                    path="/api/auth/admin/security/settings"
                    description="Update security settings."
                    authRequired
                    adminOnly
                    params={[
                      { name: "settings", type: "object", required: true, desc: "JSON object with security flags" }
                    ]}
                  />
                  <EndpointCard
                    method="POST"
                    path="/api/auth/admin/security/settings/reset"
                    description="Reset all security settings to default values."
                    authRequired
                    adminOnly
                  />
                </div>
              </section>

            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-cyan-500/10 bg-zinc-950 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-500" />
              <span className="text-slate-300 font-semibold">SecureAura</span>
            </div>
            <p className="text-slate-500 text-sm">
              &copy; {new Date().getFullYear()} SecureAura. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Helper Components

interface EndpointCardProps {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  authRequired?: boolean;
  adminOnly?: boolean;
  params?: { name: string; type: string; required: boolean; desc: string }[];
}

const EndpointCard = ({ method, path, description, authRequired, adminOnly, params }: EndpointCardProps) => {
  const methodColors = {
    GET: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    POST: "text-green-400 bg-green-400/10 border-green-400/20",
    PUT: "text-orange-400 bg-orange-400/10 border-orange-400/20",
    DELETE: "text-red-400 bg-red-400/10 border-red-400/20",
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(path);
    toast.success("Path copied to clipboard");
  };

  return (
    <div className="group rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-cyan-500/30 hover:bg-zinc-900/80 transition-all duration-300 overflow-hidden">
      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 font-mono text-sm">
            <span className={cn("px-2.5 py-1 rounded-md border font-bold", methodColors[method])}>
              {method}
            </span>
            <span className="text-slate-300 group-hover:text-cyan-300 transition-colors">{path}</span>
          </div>
          <div className="flex items-center gap-2">
            {authRequired && (
              <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] uppercase font-bold tracking-wider border border-zinc-700">
                Auth
              </span>
            )}
            {adminOnly && (
              <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] uppercase font-bold tracking-wider border border-purple-500/20">
                Admin
              </span>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-cyan-400" onClick={copyToClipboard}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <p className="text-slate-400 text-sm leading-relaxed mb-4">
          {description}
        </p>

        {params && params.length > 0 && (
          <div className="mt-4 pt-4 border-t border-zinc-800/50">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Parameters</h4>
            <div className="space-y-2">
              {params.map((param) => (
                <div key={param.name} className="grid grid-cols-12 gap-2 text-sm">
                  <div className="col-span-3 font-mono text-cyan-400/90 text-xs">{param.name}</div>
                  <div className="col-span-2 text-slate-500 text-xs">{param.type}</div>
                  <div className="col-span-7 text-slate-400 text-xs">
                    {param.required && <span className="text-red-400 mr-1">*</span>}
                    {param.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;


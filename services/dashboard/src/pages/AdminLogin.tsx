import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Shield, Lock, User, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password);
      navigate("/admin-aura");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}

      {/* Login Card */}
      <div className="w-full max-w-md relative animate-fade-in">
        {/* Card Glow Effect */}

        <div className="relative rounded bg-zinc-950 p-8 space-y-8 animate-glow">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="relative mx-auto w-20 h-20">
              {/* <div className="absolute inset-0 bg-primary/20 rounded blur-xl animate-pulse-glow" />
              <div className="relative w-full h-full bg-gradient-to-br from-primary to-info rounded-2xl flex items-center justify-center">
                <Shield className="w-10 h-10 text-primary-foreground" />
              </div> */}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Secure Aura</h1>
              <p className="text-muted-foreground text-sm mt-1">Admin Control Panel</p>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/30 animate-scale-in">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground">Username</Label>
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="text-base rounded w-full px-4 py-1 border-white focus:outline-none focus:ring mx-auto placeholder:text-sm placeholder:italic  animate-glow-pink bg-transparent text-foreground"
                required
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-base rounded w-full px-4 py-1 border-white focus:outline-none focus:ring mx-auto placeholder:text-sm placeholder:italic animate-glow-pink bg-transparent text-foreground"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="w-full text-[17px] px-6 py-3 rounded-md border-[2px] border-cyan-300 bg-zinc-950 border-solid pinkShadow duration-300 hover-animate-color-fade-button hover:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              <p className='font-mono font-bold text-xl sm:text-2xl text-foreground'>
                {loading ? "Authenticating..." : "Sign In"}
              </p>
            </button>
          </form>

          {/* Footer */}
          {/* <div className="text-center space-y-3 pt-4 border-t border-border/30">
            <p className="text-xs text-muted-foreground">
              Protected by Secure Aura Authentication
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground/60">
              <span>256-bit Encryption</span>
              <span className="w-1 h-1 bg-muted-foreground/40 rounded-full" />
              <span>Multi-Factor Ready</span>
            </div>
          </div> */}
        </div>

        {/* Demo Credentials Hint */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded bg-card/50 border border-border/30 text-xs text-muted-foreground">
            <span>SECURE AURA</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

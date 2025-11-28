import { Link } from "react-router-dom";
import { Shield, Lock, Activity, TrendingUp, Users, FileText } from "lucide-react";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 backdrop-blur-sm bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-400" />
              <h1 className="text-2xl font-bold text-white">Secure Aura</h1>
            </div>
            <Link
              to="/admin-aura"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
            >
              <Lock className="w-4 h-4" />
              Admin Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-sm font-medium mb-8">
            <Shield className="w-4 h-4" />
            Advanced Timing Attack Defense System
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Protect Your Authentication
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Against Timing Attacks
            </span>
          </h1>

          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-12">
            Secure Aura provides comprehensive protection against timing-based attacks
            with constant-time operations, adaptive noise injection, and real-time threat detection.
          </p>

          <div className="flex gap-4 justify-center">
            <Link
              to="/admin-aura"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/50"
            >
              Access Dashboard
            </Link>
            <a
              href="#features"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg border border-white/20 transition-all duration-200"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="mt-32 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Lock className="w-8 h-8" />}
            title="Constant-Time Operations"
            description="Eliminate timing side-channels with constant-time password verification using Argon2id hashing."
          />
          <FeatureCard
            icon={<Activity className="w-8 h-8" />}
            title="Adaptive Noise Injection"
            description="Dynamic timing noise based on threat levels to prevent statistical timing analysis."
          />
          <FeatureCard
            icon={<TrendingUp className="w-8 h-8" />}
            title="Real-Time Detection"
            description="ML-powered detection of timing attack patterns with automatic threat mitigation."
          />
          <FeatureCard
            icon={<Users className="w-8 h-8" />}
            title="Username Enumeration Defense"
            description="Prevent attackers from discovering valid usernames through timing analysis."
          />
          <FeatureCard
            icon={<Shield className="w-8 h-8" />}
            title="Rate Limiting"
            description="Multi-layered rate limiting to protect against brute force and distributed attacks."
          />
          <FeatureCard
            icon={<FileText className="w-8 h-8" />}
            title="Comprehensive Logging"
            description="Detailed audit trails and security event logging for complete visibility."
          />
        </div>

        {/* Stats Section */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatCard
            value="99.9%"
            label="Attack Detection Rate"
            trend="+12%"
          />
          <StatCard
            value="< 1ms"
            label="Average Response Time"
            trend="Stable"
          />
          <StatCard
            value="100%"
            label="Timing Leak Protection"
            trend="Constant"
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-slate-400">
            <p>&copy; 2024 Secure Aura. Advanced Authentication Security Platform.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
  return (
    <div className="p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-500/50 transition-all duration-300 group">
      <div className="w-14 h-14 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4 group-hover:bg-blue-500/30 transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400">{description}</p>
    </div>
  );
};

interface StatCardProps {
  value: string;
  label: string;
  trend: string;
}

const StatCard = ({ value, label, trend }: StatCardProps) => {
  return (
    <div className="p-8 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
      <div className="text-4xl font-bold text-white mb-2">{value}</div>
      <div className="text-slate-300 mb-2">{label}</div>
      <div className="text-sm text-green-400">{trend}</div>
    </div>
  );
};

export default HomePage;

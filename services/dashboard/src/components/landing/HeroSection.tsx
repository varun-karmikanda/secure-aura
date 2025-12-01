import { Button } from "@/components/ui/button";
import { ChevronRight, Shield, Lock, Zap, Terminal } from "lucide-react";
import { useEffect, useState } from "react";

export const HeroSection = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const scrollToDocs = () => {
    const element = document.getElementById("api-docs");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative min-h-[95vh] flex items-center justify-center overflow-hidden bg-zinc-950 selection:bg-cyan-500/30">
      {/* Dynamic Background Grid */}
      <div
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          transform: `perspective(1000px) rotateX(60deg) translateY(-100px) translateZ(-200px)`,
          maskImage: 'linear-gradient(to bottom, transparent, black 40%, black 80%, transparent)'
        }}
      />

      {/* Animated Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse"
          style={{ transform: `translate(${mousePosition.x * -50}px, ${mousePosition.y * -50}px)` }}
        />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[120px] animate-pulse delay-1000"
          style={{ transform: `translate(${mousePosition.x * 50}px, ${mousePosition.y * 50}px)` }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">

        {/* Floating Badge */}
        <div className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/40 border border-zinc-800 backdrop-blur-md mb-2 hover:border-cyan-500/50 transition-all duration-300 cursor-default animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="relative text-sm font-medium text-slate-300 group-hover:text-cyan-300 transition-colors">
            v1.0.0
          </span>
        </div>

        {/* Logo */}
        <div className="mb-0 animate-in fade-in zoom-in duration-1000 delay-100">
          <div className="relative w-24 h-24 md:w-48 md:h-48 mx-auto">
            <div className="absolute inset-0 bg-white/10 blur-2xl rounded-full animate-pulse" />
            <img src="/SecureAura.png" alt="SecureAura Logo" className="relative w-full h-full object-contain drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
          </div>
        </div>

        {/* Main Title with Glitch/Gradient Effect */}
        <div className="md:text-8xl font-black text-white tracking-tight mb-0 -mt-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100 drop-shadow-2xl">
          <span className="block relative inline-block mb-0">
            <span className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 blur-2xl opacity-30"></span>
            <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 animate-gradient-x">
              SecureAura
            </span>
          </span>
        </div>
        <div className="mb-1 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100 drop-shadow-2xl tracking-tight">
          <span className="text-2xl md:text-4xl block text-slate-400 font-medium tracking-wide uppercase">
            Defend Against
          </span>
          <span className="relative inline-block">
            <span className="absolute bg-gradient-to-r from-purple-600 to-pink-600 blur-2xl opacity-30"></span>
            <span className="font-black text-6xl relative text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 animate-gradient-x">
              Timing Attacks
            </span>
          </span>
        </div>

        <p className="max-w-2xl mx-auto text-xl md:text-2xl text-slate-400 mb-8 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          SecureAura provides <span className="text-cyan-400 font-semibold">quantum-safe</span> timing defenses and real-time threat monitoring for your applications.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          <Button
            size="lg"
            className="h-16 px-10 text-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-full shadow-[0_0_40px_-10px_rgba(6,182,212,0.6)] hover:shadow-[0_0_60px_-15px_rgba(6,182,212,0.8)] transition-all hover:scale-105 active:scale-95"
            onClick={scrollToDocs}
          >
            Explore API Docs
            <ChevronRight className="ml-2 w-5 h-5" />
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="h-16 px-10 text-lg border-zinc-800 bg-zinc-950/50 backdrop-blur-sm text-slate-300 hover:bg-zinc-900 hover:text-white hover:border-zinc-700 rounded-full transition-all hover:scale-105 active:scale-95 group"
            onClick={() => window.open("https://github.com/varun-karmikanda/secure-aura", "_blank")}
          >
            <Terminal className="mr-2 w-5 h-5 group-hover:text-cyan-400 transition-colors" />
            View on GitHub
          </Button>
        </div>
      </div>
    </div>
  );
};

// Helper for the icon
const ActivityIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

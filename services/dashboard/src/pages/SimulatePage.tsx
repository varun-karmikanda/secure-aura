import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Lock, Users, Clock, AlertTriangle, Play, FileText, Activity, Terminal, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";
import { cn } from "@/lib/utils";

const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8000';
const MONITOR_API_URL = import.meta.env.VITE_MONITOR_API_URL || 'http://localhost:8001';

const SimulatePage = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
  };

  const clearLogs = () => setLogs([]);

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-200 p-8 font-sans selection:bg-cyan-500/30">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-center mb-8 relative">
          <Link to="/" className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center text-slate-400 hover:text-cyan-400 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center justify-center gap-3">
              <img src="/SecureAura.png" alt="Secure Aura" className="w-16 h-16 object-contain pt-2" />
              Attack Simulation
            </h1>
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Simulation Area */}
          <div className="lg:col-span-1">
            <Tabs defaultValue="brute-force" className="space-y-6">
              <TabsList className="bg-zinc-900/50 border border-zinc-800 p-1">
                <TabsTrigger value="brute-force" className="data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400">Brute Force</TabsTrigger>
                <TabsTrigger value="stuffing" className="data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400">Cred Stuffing</TabsTrigger>
                <TabsTrigger value="enum" className="data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400">User Enum</TabsTrigger>
                <TabsTrigger value="timing" className="data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400">Timing</TabsTrigger>
              </TabsList>

              <TabsContent value="brute-force">
                <BruteForceSim addLog={addLog} setLoading={setLoading} loading={loading} />
              </TabsContent>

              <TabsContent value="stuffing">
                <CredentialStuffingSim addLog={addLog} setLoading={setLoading} loading={loading} />
              </TabsContent>

              <TabsContent value="enum">
                <UsernameEnumSim addLog={addLog} setLoading={setLoading} loading={loading} />
              </TabsContent>

              <TabsContent value="timing">
                <TimingAttackSim addLog={addLog} setLoading={setLoading} loading={loading} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Live Logs Console */}
          <div className="lg:col-span-1">
            <Card className="bg-zinc-900/50 border-zinc-800 h-[600px] flex flex-col">
              <CardHeader className="pb-2 border-b border-zinc-800">
                <CardTitle className="text-sm font-mono text-slate-400 flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    Simulation Logs
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearLogs}
                    className="h-6 px-2 text-xs text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10"
                  >
                    <Terminal></Terminal>Clear
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                {logs.length === 0 ? (
                  <div className="text-zinc-600 italic text-center mt-20">No logs yet...</div>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="break-all border-l-2 border-cyan-500/20 pl-2 py-0.5">
                      <span className="text-zinc-500">{log.split(']')[0]}]</span>
                      <span className={cn(
                        "ml-2",
                        log.includes("Error") || log.includes("Failed") ? "text-red-400" :
                          log.includes("Success") ? "text-green-400" :
                            log.includes("Warning") ? "text-yellow-400" :
                              "text-slate-300"
                      )}>
                        {log.split(']').slice(1).join(']')}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Simulation Components ---

const BruteForceSim = ({ addLog, setLoading, loading }: any) => {
  const [iterations, setIterations] = useState(10);

  const runSimulation = async () => {
    setLoading(true);
    addLog(`Starting Brute Force Simulation (${iterations} iterations)...`);

    for (let i = 0; i < iterations; i++) {
      const password = `wrongpass${Math.floor(Math.random() * 10000)}`;
      const start = performance.now();
      try {
        await axios.post(`${AUTH_API_URL}/api/auth/login`, {
          username: "testuser1",
          password: password
        });
        const end = performance.now();
        addLog(`[Attempt ${i + 1}] Success? (Unexpected) - Time: ${(end - start).toFixed(2)}ms`);
      } catch (error: any) {
        const end = performance.now();
        addLog(`[Attempt ${i + 1}] Failed (${error.response?.status}) - Time: ${(end - start).toFixed(2)}ms`);
      }
      // Small delay to not completely freeze UI
      await new Promise(r => setTimeout(r, 100));
    }

    addLog("Brute Force Simulation Complete.");
    setLoading(false);
  };

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Lock className="w-5 h-5 text-red-400" />
          Brute Force Attack
        </CardTitle>
        <CardDescription>Simulate rapid login attempts with random passwords.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Number of Iterations</Label>
          <Input
            type="number"
            value={iterations}
            onChange={(e) => setIterations(parseInt(e.target.value))}
            className="bg-zinc-950 border-zinc-700 text-white"
          />
        </div>
        <Button
          onClick={runSimulation}
          disabled={loading}
          className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
        >
          {loading ? <Activity className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
          Start Simulation
        </Button>
      </CardContent>
    </Card>
  );
};

const CredentialStuffingSim = ({ addLog, setLoading, loading }: any) => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFile(e.target.files[0]);
  };

  const runSimulation = async () => {
    if (!file) return addLog("Error: No CSV file selected.");

    setLoading(true);
    addLog(`Starting Credential Stuffing using ${file.name}...`);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').slice(1); // Skip header

      for (const line of lines) {
        if (!line.trim()) continue;
        const [username, password] = line.split(',');

        const start = performance.now();
        try {
          await axios.post(`${AUTH_API_URL}/api/auth/login`, {
            username: username.trim(),
            password: password.trim()
          });
          const end = performance.now();
          addLog(`[${username}] Login Success - Time: ${(end - start).toFixed(2)}ms`);
        } catch (error: any) {
          const end = performance.now();
          addLog(`[${username}] Login Failed (${error.response?.status}) - Time: ${(end - start).toFixed(2)}ms`);
        }
        await new Promise(r => setTimeout(r, 200));
      }
      addLog("Credential Stuffing Complete.");
      setLoading(false);
    };
    reader.readAsText(file);
  };

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-orange-400" />
          Credential Stuffing
        </CardTitle>
        <CardDescription>Test a list of compromised credentials from a CSV file.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Upload CSV (username,password,source)</Label>
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="bg-zinc-950 border-zinc-700 text-slate-300 file:text-cyan-400 file:bg-cyan-500/10 file:border-0 file:rounded-md"
          />
        </div>
        <Button
          onClick={runSimulation}
          disabled={loading || !file}
          className="w-full bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20"
        >
          {loading ? <Activity className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
          Run Attack
        </Button>
      </CardContent>
    </Card>
  );
};

const UsernameEnumSim = ({ addLog, setLoading, loading }: any) => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFile(e.target.files[0]);
  };

  const runSimulation = async () => {
    if (!file) return addLog("Error: No CSV file selected.");

    setLoading(true);
    addLog(`Starting Username Enumeration Check...`);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').slice(1);

      for (const line of lines) {
        if (!line.trim()) continue;
        const [username] = line.split(',');

        const start = performance.now();
        try {
          await axios.post(`${AUTH_API_URL}/api/auth/login`, {
            username: username.trim(),
            password: "password123" // Fixed password
          });
          const end = performance.now();
          addLog(`[${username}] Response: Success? - Time: ${(end - start).toFixed(2)}ms`);
        } catch (error: any) {
          const end = performance.now();
          addLog(`[${username}] Response: ${error.response?.status} - Time: ${(end - start).toFixed(2)}ms`);
        }
        await new Promise(r => setTimeout(r, 200));
      }
      addLog("Enumeration Check Complete.");
      setLoading(false);
    };
    reader.readAsText(file);
  };

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-yellow-400" />
          Username Enumeration
        </CardTitle>
        <CardDescription>Check for timing discrepancies when guessing usernames.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Upload CSV (username list)</Label>
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="bg-zinc-950 border-zinc-700 text-slate-300 file:text-cyan-400 file:bg-cyan-500/10 file:border-0 file:rounded-md"
          />
        </div>
        <Button
          onClick={runSimulation}
          disabled={loading || !file}
          className="w-full bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20"
        >
          {loading ? <Activity className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
          Check Timings
        </Button>
      </CardContent>
    </Card>
  );
};

const TimingAttackSim = ({ addLog, setLoading, loading }: any) => {

  const testLoginTiming = async (isValidUser: boolean) => {
    setLoading(true);
    const username = isValidUser ? "testuser1" : "nonexistent_user";
    const type = isValidUser ? "Valid User" : "Invalid User";

    addLog(`Testing Login Timing for ${type}...`);

    const start = performance.now();
    try {
      await axios.post(`${AUTH_API_URL}/api/auth/login`, {
        username,
        password: "wrongpassword"
      });
      const end = performance.now();
      addLog(`[${type}] Response Time: ${(end - start).toFixed(2)}ms`);
    } catch (error: any) {
      const end = performance.now();
      addLog(`[${type}] Response Time: ${(end - start).toFixed(2)}ms (Status: ${error.response?.status})`);
    }
    setLoading(false);
  };

  const testRegisterTiming = async (isDuplicate: boolean) => {
    setLoading(true);
    const type = isDuplicate ? "Duplicate User" : "New User";
    const username = isDuplicate ? "testuser1" : `testuser_${Math.floor(Math.random() * 10000)}`;
    const email = isDuplicate ? "test@example.com" : `test_${Math.floor(Math.random() * 10000)}@example.com`;

    addLog(`Testing Registration Timing for ${type}...`);

    const start = performance.now();
    try {
      await axios.post(`${AUTH_API_URL}/api/auth/register`, {
        username,
        email,
        password: "SecurePass123!"
      });
      const end = performance.now();
      addLog(`[${type}] Response Time: ${(end - start).toFixed(2)}ms`);
    } catch (error: any) {
      const end = performance.now();
      addLog(`[${type}] Response Time: ${(end - start).toFixed(2)}ms (Status: ${error.response?.status})`);
    }
    setLoading(false);
  };

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-400" />
          Timing Attack Analysis
        </CardTitle>
        <CardDescription>Compare response times for different scenarios.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-300">Login Timing (Wrong Password)</h4>
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => testLoginTiming(true)}
              disabled={loading}
              variant="outline"
              className="border-cyan-500/20 hover:bg-cyan-500/10 text-cyan-400"
            >
              Valid User
            </Button>
            <Button
              onClick={() => testLoginTiming(false)}
              disabled={loading}
              variant="outline"
              className="border-cyan-500/20 hover:bg-cyan-500/10 text-cyan-400"
            >
              Invalid User
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-300">Registration Timing</h4>
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => testRegisterTiming(false)}
              disabled={loading}
              variant="outline"
              className="border-green-500/20 hover:bg-green-500/10 text-green-400"
            >
              New User
            </Button>
            <Button
              onClick={() => testRegisterTiming(true)}
              disabled={loading}
              variant="outline"
              className="border-red-500/20 hover:bg-red-500/10 text-red-400"
            >
              Duplicate User
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimulatePage;

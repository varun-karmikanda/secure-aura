import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  Plus,
  Clock,
  Folder,
  ChevronDown,
  Copy,
  Check,
  Trash2,
  Save
} from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { toast } from "sonner";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface SavedRequest {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body: string;
}

interface RequestHistory {
  id: string;
  method: HttpMethod;
  url: string;
  status: number;
  time: string;
  duration: string;
}

const methodColors: Record<HttpMethod, string> = {
  GET: "bg-success/20 text-success border-success/30",
  POST: "bg-info/20 text-info border-info/30",
  PUT: "bg-warning/20 text-warning border-warning/30",
  DELETE: "bg-destructive/20 text-destructive border-destructive/30",
  PATCH: "bg-primary/20 text-primary border-primary/30",
};

const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8000';
const MONITOR_API_URL = import.meta.env.VITE_MONITOR_API_URL || 'http://localhost:8001';

const secureAuraEndpoints: SavedRequest[] = [
  {
    id: "1",
    name: "Register User",
    method: "POST",
    url: `${MONITOR_API_URL}/api/monitor/health`,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "newuser" + Date.now(),
      email: "user" + Date.now() + "@example.com",
      password: "SecurePass123!"
    }, null, 2),
  },
  {
    id: "2",
    name: "Login",
    method: "POST",
    url: `${AUTH_API_URL}/api/auth/login`,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "testuser",
      password: "SecurePass123!"
    }, null, 2),
  },
  {
    id: "3",
    name: "Verify Token",
    method: "POST",
    url: `${AUTH_API_URL}/api/auth/verify-token`,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: "{{access_token}}"
    }, null, 2),
  },
  {
    id: "4",
    name: "User Profile",
    method: "GET",
    url: `${AUTH_API_URL}/api/users/me`,
    headers: { "Authorization": "Bearer {{access_token}}" },
    body: "",
  },
  {
    id: "5",
    name: "Auth Health Check",
    method: "GET",
    url: `${AUTH_API_URL}/health`,
    headers: {},
    body: "",
  },
];

export function ApiTester() {
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState<Array<{ key: string; value: string }>>([
    { key: "Content-Type", value: "application/json" }
  ]);
  const [body, setBody] = useState("");
  const [response, setResponse] = useState<{
    status: number;
    statusText: string;
    data: unknown;
    time: number;
    headers: Record<string, string>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"body" | "headers">("body");
  const [responseTab, setResponseTab] = useState<"body" | "headers">("body");
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<RequestHistory[]>([]);

  const [activeTokens, setActiveTokens] = useState<{
    accessToken?: string;
  }>({});

  const handleSend = async () => {
    if (!url.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    setIsLoading(true);
    const startTime = Date.now();

    try {
      const headerObj: Record<string, string> = {};
      headers.forEach(h => {
        if (h.key && h.value) {
          // Substitute token placeholders in headers
          let value = h.value;
          if (value.includes("{{access_token}}") && activeTokens.accessToken) {
            value = value.replace("{{access_token}}", activeTokens.accessToken);
          }
          headerObj[h.key] = value;
        }
      });

      const options: RequestInit = {
        method,
        headers: headerObj,
      };

      if (body && ["POST", "PUT", "PATCH"].includes(method)) {
        // Substitute token placeholders in body
        let processedBody = body;
        if (processedBody.includes("{{access_token}}") && activeTokens.accessToken) {
          processedBody = processedBody.replace("{{access_token}}", activeTokens.accessToken);
        }
        options.body = processedBody;
      }

      const res = await fetch(url, options);
      const endTime = Date.now();
      const duration = endTime - startTime;

      let data;
      const contentType = res.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        data = await res.json();

        // Auto-capture tokens from successful responses
        if (res.ok && data) {
          if (data.access_token) {
            setActiveTokens({ accessToken: data.access_token });
            localStorage.setItem("auth_token", data.access_token);
            toast.success("Access token captured automatically!");
          }
        }
      } else {
        data = await res.text();
      }

      const resHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        resHeaders[key] = value;
      });

      setResponse({
        status: res.status,
        statusText: res.statusText,
        data,
        time: duration,
        headers: resHeaders,
      });

      // Add to history
      setHistory(prev => [{
        id: Date.now().toString(),
        method,
        url,
        status: res.status,
        time: new Date().toLocaleTimeString(),
        duration: `${duration}ms`,
      }, ...prev.slice(0, 9)]);

      toast.success(`Request completed in ${duration}ms`);
    } catch (error) {
      const endTime = Date.now();
      setResponse({
        status: 0,
        statusText: "Network Error",
        data: { error: error instanceof Error ? error.message : "Failed to connect" },
        time: endTime - startTime,
        headers: {},
      });
      toast.error("Request failed");
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedRequest = (request: SavedRequest) => {
    setMethod(request.method);
    setUrl(request.url);
    setHeaders(Object.entries(request.headers).map(([key, value]) => ({ key, value })));

    // Make Register User dynamic so it always creates a new user
    if (request.id === "1") {
      const timestamp = Date.now();
      setBody(JSON.stringify({
        username: `user_${timestamp}`,
        email: `user_${timestamp}@example.com`,
        password: "SecurePass123!"
      }, null, 2));
    } else {
      setBody(request.body);
    }

    toast.success(`Loaded: ${request.name}`);
  };

  const copyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response.data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied to clipboard");
    }
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast.success("Token copied to clipboard");
  };

  const clearTokens = () => {
    setActiveTokens({});
    localStorage.removeItem("auth_token");
    toast.success("Tokens cleared");
  };

  const addHeader = () => {
    setHeaders([...headers, { key: "", value: "" }]);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold gradient-text">API Tester</h1>
        {/* <p className="text-muted-foreground mt-1">Test and debug your API endpoints</p> */}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Saved Collections */}
        <div className="glass rounded-xl p-4 animate-slide-in-left gradient-border">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Folder className="w-4 h-4 text-primary" />
            SecureAura Endpoints
          </h3>
          <div className="space-y-2">
            {secureAuraEndpoints.map((endpoint) => (
              <button
                key={endpoint.id}
                onClick={() => loadSavedRequest(endpoint)}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left group"
              >
                <span className={cn(
                  "px-2 py-0.5 rounded text-xs font-mono font-semibold border",
                  methodColors[endpoint.method]
                )}>
                  {endpoint.method}
                </span>
                <span className="text-sm text-muted-foreground group-hover:text-foreground truncate">
                  {endpoint.name}
                </span>
              </button>
            ))}
          </div>

          {/* Active Tokens Section */}
          <div className="border-t border-border/50 my-4" />
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Save className="w-4 h-4 text-success" />
              Token Management
            </h3>
            <Button variant="ghost" size="sm" onClick={clearTokens} className="h-6 text-xs text-muted-foreground hover:text-destructive">
              Clear
            </Button>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Access Token</label>
              <div className="flex gap-2">
                <Input
                  value={activeTokens.accessToken || ""}
                  onChange={(e) => setActiveTokens(prev => ({ ...prev, accessToken: e.target.value }))}
                  placeholder="Paste access token..."
                  className="h-8 text-xs font-mono bg-muted/30"
                />
                {activeTokens.accessToken && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToken(activeTokens.accessToken!)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <>
              <div className="border-t border-border/50 my-4" />
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                History
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-xs"
                  >
                    <span className={cn(
                      "px-1.5 py-0.5 rounded font-mono font-semibold border",
                      methodColors[item.method]
                    )}>
                      {item.method}
                    </span>
                    <span className={cn(
                      "font-mono",
                      item.status >= 200 && item.status < 300 ? "text-success" :
                        item.status >= 400 ? "text-destructive" : "text-warning"
                    )}>
                      {item.status}
                    </span>
                    <span className="text-muted-foreground">{item.duration}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Request Builder */}
        <div className="xl:col-span-3 space-y-4">
          {/* URL Bar */}
          <div className="glass rounded-xl p-4 animate-fade-in-up gradient-border" style={{ animationDelay: "100ms" }}>
            <div className="flex gap-2">
              <div className="relative">
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as HttpMethod)}
                  className={cn(
                    "appearance-none px-4 py-2.5 rounded-lg font-mono font-semibold text-sm cursor-pointer border",
                    "bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50",
                    methodColors[method]
                  )}
                >
                  {(["GET", "POST", "PUT", "DELETE", "PATCH"] as HttpMethod[]).map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
              </div>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter request URL"
                className="flex-1 bg-muted/50 border-border/50 font-mono text-sm"
              />
              <Button
                onClick={handleSend}
                disabled={isLoading}
                className="glow"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send
              </Button>
            </div>
          </div>

          {/* Request Tabs */}
          <div className="glass rounded-xl overflow-hidden animate-fade-in-up gradient-border" style={{ animationDelay: "200ms" }}>
            <div className="flex border-b border-border/50">
              <button
                onClick={() => setActiveTab("body")}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium transition-colors",
                  activeTab === "body"
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Body
              </button>
              <button
                onClick={() => setActiveTab("headers")}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium transition-colors",
                  activeTab === "headers"
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Headers
              </button>
            </div>
            <div className="p-4">
              {activeTab === "body" ? (
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Request body (JSON)"
                  className="w-full h-40 bg-muted/30 rounded-lg p-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              ) : (
                <div className="space-y-2">
                  {headers.map((header, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={header.key}
                        onChange={(e) => {
                          const newHeaders = [...headers];
                          newHeaders[index].key = e.target.value;
                          setHeaders(newHeaders);
                        }}
                        placeholder="Header name"
                        className="flex-1 bg-muted/30 border-border/50 font-mono text-sm"
                      />
                      <Input
                        value={header.value}
                        onChange={(e) => {
                          const newHeaders = [...headers];
                          newHeaders[index].value = e.target.value;
                          setHeaders(newHeaders);
                        }}
                        placeholder="Value"
                        className="flex-1 bg-muted/30 border-border/50 font-mono text-sm"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeHeader(index)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" onClick={addHeader} className="mt-2">
                    <Plus className="w-4 h-4 mr-1" /> Add Header
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Response */}
          {response && (
            <div className="glass rounded-xl overflow-hidden animate-scale-in gradient-border">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "px-3 py-1 rounded-lg font-mono font-semibold text-sm",
                    response.status >= 200 && response.status < 300
                      ? "bg-success/20 text-success"
                      : response.status >= 400
                        ? "bg-destructive/20 text-destructive"
                        : "bg-warning/20 text-warning"
                  )}>
                    {response.status} {response.statusText}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {response.time}ms
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={copyResponse}>
                  {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>

              {/* Response Tabs */}
              <div className="flex border-b border-border/50">
                <button
                  onClick={() => setResponseTab("body")}
                  className={cn(
                    "px-4 py-2 text-sm font-medium transition-colors",
                    responseTab === "body"
                      ? "text-primary border-b-2 border-primary bg-primary/5"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Body
                </button>
                <button
                  onClick={() => setResponseTab("headers")}
                  className={cn(
                    "px-4 py-2 text-sm font-medium transition-colors",
                    responseTab === "headers"
                      ? "text-primary border-b-2 border-primary bg-primary/5"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Headers
                </button>
              </div>

              <div className="max-h-96 overflow-auto">
                {responseTab === "body" ? (
                  <SyntaxHighlighter
                    language="json"
                    style={oneDark}
                    customStyle={{
                      margin: 0,
                      padding: "1rem",
                      background: "transparent",
                      fontSize: "0.875rem",
                    }}
                    className="syntax-highlighter"
                  >
                    {typeof response.data === "string"
                      ? response.data
                      : JSON.stringify(response.data, null, 2)}
                  </SyntaxHighlighter>
                ) : (
                  <div className="p-4 space-y-1">
                    {Object.entries(response.headers).map(([key, value]) => (
                      <div key={key} className="flex gap-2 text-sm font-mono">
                        <span className="text-primary">{key}:</span>
                        <span className="text-muted-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

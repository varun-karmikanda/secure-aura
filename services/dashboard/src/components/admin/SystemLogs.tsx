import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Download,
  RefreshCw,
  Filter,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  Server
} from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  level: "error" | "warn" | "info" | "debug";
  service: "auth" | "monitor" | "api" | "database";
  message: string;
}

const mockLogs: LogEntry[] = [
  { id: "1", timestamp: "2024-03-28 14:32:15.234", level: "error", service: "auth", message: "Failed login attempt: Invalid credentials for user admin@test.com" },
  { id: "2", timestamp: "2024-03-28 14:32:14.891", level: "warn", service: "monitor", message: "Rate limit threshold reached for IP 192.168.1.100 (95/100 requests)" },
  { id: "3", timestamp: "2024-03-28 14:32:14.567", level: "info", service: "api", message: "GET /api/profile - 200 OK - 12ms" },
  { id: "4", timestamp: "2024-03-28 14:32:13.234", level: "info", service: "auth", message: "User john.doe@example.com successfully authenticated" },
  { id: "5", timestamp: "2024-03-28 14:32:12.891", level: "debug", service: "database", message: "Query executed: SELECT * FROM users WHERE email = $1" },
  { id: "6", timestamp: "2024-03-28 14:32:11.567", level: "info", service: "monitor", message: "Threat detection scan completed: 0 threats found" },
  { id: "7", timestamp: "2024-03-28 14:32:10.234", level: "warn", service: "auth", message: "Token refresh requested for expired session" },
  { id: "8", timestamp: "2024-03-28 14:32:09.891", level: "error", service: "api", message: "POST /api/register - 400 Bad Request - Email already exists" },
  { id: "9", timestamp: "2024-03-28 14:32:08.567", level: "info", service: "database", message: "Connection pool: 5 active, 15 idle connections" },
  { id: "10", timestamp: "2024-03-28 14:32:07.234", level: "info", service: "auth", message: "New user registration: alice.johnson@example.com" },
  { id: "11", timestamp: "2024-03-28 14:32:06.891", level: "warn", service: "monitor", message: "Suspicious activity detected: Multiple failed logins from same IP" },
  { id: "12", timestamp: "2024-03-28 14:32:05.567", level: "info", service: "api", message: "PUT /api/profile - 200 OK - 8ms" },
  { id: "13", timestamp: "2024-03-28 14:32:04.234", level: "debug", service: "auth", message: "JWT token validated successfully for user_id: usr_abc123" },
  { id: "14", timestamp: "2024-03-28 14:32:03.891", level: "info", service: "monitor", message: "System health check: All services operational" },
  { id: "15", timestamp: "2024-03-28 14:32:02.567", level: "error", service: "database", message: "Connection timeout after 30s - retrying..." },
];

const levelConfig = {
  error: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30" },
  warn: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", border: "border-warning/30" },
  info: { icon: Info, color: "text-info", bg: "bg-info/10", border: "border-info/30" },
  debug: { icon: CheckCircle, color: "text-muted-foreground", bg: "bg-muted/30", border: "border-border" },
};

const serviceColors = {
  auth: "text-primary",
  monitor: "text-warning",
  api: "text-success",
  database: "text-info",
};

export function SystemLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [isLive, setIsLive] = useState(false);
  const [logCounts, setLogCounts] = useState({
    error: 0,
    warn: 0,
    info: 0,
    debug: 0,
  });

  // Format ISO timestamp to readable format
  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  };

  // Fetch logs from API
  const fetchLogs = async () => {
    try {
      const url = new URL('http://localhost:8001/api/monitor/logs');
      url.searchParams.append('limit', '50');
      if (levelFilter !== 'all') {
        url.searchParams.append('level', levelFilter);
      }

      const response = await fetch(url.toString());
      if (response.ok) {
        const data = await response.json();
        // Format timestamps for all logs
        const logsWithFormattedTimestamps = (data.logs || []).map((log: any) => ({
          ...log,
          timestamp: formatTimestamp(log.timestamp)
        }));
        setLogs(logsWithFormattedTimestamps);
        setLogCounts(data.counts || { error: 0, warn: 0, info: 0, debug: 0 });
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  // Initial fetch and refresh when filters change
  useEffect(() => {
    fetchLogs();
  }, [levelFilter]);

  // Live log streaming
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      fetchLogs();
    }, 2000);

    return () => clearInterval(interval);
  }, [isLive, levelFilter]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const [showExportMenu, setShowExportMenu] = useState(false);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showExportMenu && !target.closest('.export-menu-container')) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

  // Export logs to CSV
  const exportToCSV = () => {
    const logsToExport = filteredLogs.length > 0 ? filteredLogs : logs;

    // CSV Headers
    const headers = ['Timestamp', 'Level', 'Service', 'Message'];

    // Convert logs to CSV rows
    const csvRows = logsToExport.map(log => {
      return [
        log.timestamp,
        log.level.toUpperCase(),
        log.service.toUpperCase(),
        `"${log.message.replace(/"/g, '""')}"` // Escape quotes in message
      ].join(',');
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...csvRows
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    link.setAttribute('href', url);
    link.setAttribute('download', `system-logs-${timestamp}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  // Export logs to JSON
  const exportToJSON = () => {
    const logsToExport = filteredLogs.length > 0 ? filteredLogs : logs;

    const jsonContent = JSON.stringify({
      exportDate: new Date().toISOString(),
      totalLogs: logsToExport.length,
      counts: logCounts,
      logs: logsToExport
    }, null, 2);

    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    link.setAttribute('href', url);
    link.setAttribute('download', `system-logs-${timestamp}.json`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  // Export logs to PDF
  const exportToPDF = () => {
    const logsToExport = filteredLogs.length > 0 ? filteredLogs : logs;

    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>System Logs Export</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; border-bottom: 2px solid #666; padding-bottom: 10px; }
          .meta { color: #666; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #f0f0f0; padding: 10px; text-align: left; border: 1px solid #ddd; font-weight: bold; }
          td { padding: 8px; border: 1px solid #ddd; font-size: 12px; }
          .error { color: #dc2626; font-weight: bold; }
          .warn { color: #f59e0b; font-weight: bold; }
          .info { color: #3b82f6; font-weight: bold; }
          .debug { color: #6b7280; font-weight: bold; }
          tr:nth-child(even) { background: #f9f9f9; }
        </style>
      </head>
      <body>
        <h1>System Logs Report</h1>
        <div class="meta">
          <p><strong>Export Date:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Total Logs:</strong> ${logsToExport.length}</p>
          <p><strong>Counts:</strong> Errors: ${logCounts.error}, Warnings: ${logCounts.warn}, Info: ${logCounts.info}, Debug: ${logCounts.debug}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Level</th>
              <th>Service</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            ${logsToExport.map(log => `
              <tr>
                <td>${log.timestamp}</td>
                <td class="${log.level}">${log.level.toUpperCase()}</td>
                <td>${log.service.toUpperCase()}</td>
                <td>${log.message}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    // Open print dialog
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
    setShowExportMenu(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold gradient-text">System Logs</h1>
          {/* <p className="text-muted-foreground mt-1">Real-time monitoring and log analysis</p> */}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isLive ? "glow" : "outline"}
            onClick={() => setIsLive(!isLive)}
            className={cn(isLive && "animate-pulse-glow")}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isLive && "animate-spin")} />
            {isLive ? "Live" : "Paused"}
          </Button>

          <div className="relative export-menu-container">
            <Button
              variant="outline"
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 glass rounded-xl border border-border/50 shadow-xl z-50 overflow-hidden">
                <div className="p-2">
                  <button
                    onClick={exportToCSV}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors flex items-center gap-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    <div>
                      <div className="font-medium">CSV</div>
                      <div className="text-xs text-muted-foreground">Spreadsheet format</div>
                    </div>
                  </button>
                  <button
                    onClick={exportToJSON}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors flex items-center gap-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    <div>
                      <div className="font-medium">JSON</div>
                      <div className="text-xs text-muted-foreground">Developer format</div>
                    </div>
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors flex items-center gap-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    <div>
                      <div className="font-medium">PDF</div>
                      <div className="text-xs text-muted-foreground">Print/report format</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Log Level Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(["error", "warn", "info", "debug"] as const).map((level, index) => {
          const config = levelConfig[level];
          const Icon = config.icon;
          return (
            <div
              key={level}
              className={cn(
                "glass rounded-xl p-4 animate-fade-in-up cursor-pointer transition-all",
                levelFilter === level && "ring-2 ring-primary",
                config.bg, config.border, "border"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => setLevelFilter(levelFilter === level ? "all" : level)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground capitalize">{level}</p>
                  <p className={cn("text-2xl font-bold", config.color)}>{logCounts[level]}</p>
                </div>
                <Icon className={cn("w-6 h-6", config.color)} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logs..."
            className="pl-10 bg-muted/50 border-border/50"
          />
        </div>
      </div>

      {/* Log List */}
      <div className="glass rounded-xl overflow-hidden animate-fade-in-up gradient-border" style={{ animationDelay: "500ms" }}>
        <div className="max-h-[600px] overflow-y-auto">
          {filteredLogs.map((log, index) => {
            const config = levelConfig[log.level];
            const Icon = config.icon;
            return (
              <div
                key={log.id}
                className={cn(
                  "flex items-start gap-3 p-3 border-b border-border/30 hover:bg-muted/30 transition-colors",
                  index === 0 && isLive && "animate-fade-in bg-primary/5"
                )}
              >
                <div className={cn("p-1.5 rounded-md", config.bg)}>
                  <Icon className={cn("w-4 h-4", config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("text-xs font-semibold uppercase", serviceColors[log.service])}>
                      [{log.service}]
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {log.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-foreground font-mono">{log.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

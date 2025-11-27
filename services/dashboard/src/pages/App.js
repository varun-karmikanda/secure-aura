import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/App.css';

const API_BASE_URL = process.env.REACT_APP_MONITOR_API_URL || 'http://localhost:8001';

function App() {
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [timingAnalysis, setTimingAnalysis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Create Matrix rain effect
    const createMatrixRain = () => {
      const container = document.querySelector('.matrix-bg');
      if (!container) return;

      const columns = Math.floor(window.innerWidth / 20);
      
      for (let i = 0; i < columns; i++) {
        const column = document.createElement('div');
        column.className = 'matrix-column';
        column.style.left = `${i * 20}px`;
        column.style.animationDuration = `${Math.random() * 10 + 10}s`;
        column.style.animationDelay = `${Math.random() * 5}s`;
        
        // Generate random binary string
        let binaryString = '';
        for (let j = 0; j < 30; j++) {
          binaryString += Math.random() > 0.5 ? '1' : '0';
          binaryString += '\n';
        }
        column.textContent = binaryString;
        
        container.appendChild(column);
      }
    };

    createMatrixRain();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, eventsRes, timingRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/monitor/stats`),
        axios.get(`${API_BASE_URL}/api/monitor/events?limit=20`),
        axios.get(`${API_BASE_URL}/api/monitor/timing-analysis?limit=20`),
      ]);

      setStats(statsRes.data);
      setEvents(eventsRes.data.events);
      setTimingAnalysis(timingRes.data.analyses);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getThreatLevelColor = (probability) => {
    if (probability >= 0.8) return 'text-red-600';
    if (probability >= 0.6) return 'text-orange-600';
    if (probability >= 0.4) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getSystemStatus = () => {
    // System down/error state
    if (!stats && !loading) {
      return (
        <div className="flex items-center bg-gradient-to-r from-red-500/10 to-red-500/10 border border-red-500/20 px-4 py-2 rounded-full">
          <div className="w-2 h-2 bg-red-500 rounded-full mr-2 shadow-lg shadow-red-500/50"></div>
          <span className="text-red-400 text-sm font-bold tracking-wide">OFFLINE</span>
        </div>
      );
    }
    
    // Loading state
    if (!stats) {
      return (
        <div className="flex items-center bg-gradient-to-r from-gray-500/10 to-gray-500/10 border border-gray-500/20 px-4 py-2 rounded-full">
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse mr-2 shadow-lg shadow-gray-500/50"></div>
          <span className="text-gray-400 text-sm font-bold tracking-wide">CONNECTING</span>
        </div>
      );
    }

    // System is online
    return (
      <div className="flex items-center bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 px-4 py-2 rounded-full">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2 shadow-lg shadow-green-500/50"></div>
        <span className="text-green-400 text-sm font-bold tracking-wide">ONLINE</span>
      </div>
    );
  };

  const getThreatStatus = () => {
    if (!stats) return null;

    const activeThreatCount = stats.active_threats || 0;
    const totalEvents = stats.security_events || 0;
    
    // Critical: Multiple active threats
    if (activeThreatCount >= 3) {
      return (
        <div className="flex items-center bg-gradient-to-r from-red-500/10 to-red-500/10 border border-red-500/20 px-4 py-2 rounded-full">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2 shadow-lg shadow-red-500/50"></div>
          <span className="text-red-400 text-sm font-bold tracking-wide">⚠️ CRITICAL</span>
        </div>
      );
    }
    
    // Warning: Some active threats
    if (activeThreatCount > 0) {
      return (
        <div className="flex items-center bg-gradient-to-r from-orange-500/10 to-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-full">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse mr-2 shadow-lg shadow-orange-500/50"></div>
          <span className="text-orange-400 text-sm font-bold tracking-wide">🔶 ALERT</span>
        </div>
      );
    }
    
    // Normal: No active threats but has detected some events
    if (totalEvents > 0) {
      return (
        <div className="flex items-center bg-gradient-to-r from-blue-500/10 to-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2 shadow-lg shadow-blue-500/50"></div>
          <span className="text-blue-400 text-sm font-bold tracking-wide">👁️ MONITORING</span>
        </div>
      );
    }
    
    // All clear
    return (
      <div className="flex items-center bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20 px-4 py-2 rounded-full">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2 shadow-lg shadow-emerald-500/50"></div>
        <span className="text-emerald-400 text-sm font-bold tracking-wide">✓ SECURE</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Matrix Rain Background */}
      <div className="matrix-bg"></div>
      
      {/* Content with higher z-index */}
      <div className="relative z-10">
      {/* Header */}
      <header className="bg-zinc-950/50 backdrop-blur-xl border-b border-zinc-800/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img 
                  src="/secure-aura.png" 
                  alt="Secure Aura Logo" 
                  className="w-14 h-14 rounded-2xl shadow-lg shadow-cyan-500/30"
                />
              </div>
              <div className="ml-4">
                <h1 className="text-3xl font-black text-white tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Secure Aura</h1>
                <p className="text-sm text-gray-500 font-semibold tracking-wide">TIMING ATTACK DEFENSE FRAMEWORK</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {getSystemStatus()}
              {getThreatStatus()}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-zinc-950/50 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-2">
            {['overview', 'threats', 'analytics'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-6 font-bold text-sm uppercase tracking-wider transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-t-xl shadow-lg shadow-blue-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-zinc-800/50 rounded-t-xl'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Auth Attempts"
                value={stats?.total_auth_attempts || 0}
                icon="🔐"
                color="blue"
              />
              <StatCard
                title="Successful Logins"
                value={stats?.successful_logins || 0}
                icon="✅"
                color="green"
              />
              <StatCard
                title="Security Events"
                value={stats?.security_events || 0}
                icon="⚠️"
                color="orange"
              />
              <StatCard
                title="Active Threats"
                value={stats?.active_threats || 0}
                icon="🚨"
                color="red"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Authentication Stats */}
              <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl p-8 border border-zinc-800/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                <h3 className="text-xl font-black text-white mb-6 tracking-tight">
                  Authentication Overview
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 font-semibold">Successful Logins</span>
                    <span className="text-2xl font-bold text-green-400">{stats?.successful_logins || 0}</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${(stats?.successful_logins / (stats?.total_auth_attempts || 1)) * 100}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-6">
                    <span className="text-gray-400 font-semibold">Failed Attempts</span>
                    <span className="text-2xl font-bold text-red-400">{stats?.failed_logins || 0}</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${(stats?.failed_logins / (stats?.total_auth_attempts || 1)) * 100}%` }}
                    ></div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-zinc-800">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-sm font-semibold">Success Rate</span>
                      <span className="text-xl font-bold text-cyan-400">
                        {((stats?.successful_logins / (stats?.total_auth_attempts || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Threat Stats */}
              <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl p-8 border border-zinc-800/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                <h3 className="text-xl font-black text-white mb-6 tracking-tight">Threat Status</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <div>
                      <p className="text-sm text-gray-400 font-semibold">Active Threats</p>
                      <p className="text-3xl font-black text-red-400 mt-1">{stats?.active_threats || 0}</p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center">
                      <span className="text-3xl">⚠️</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <div>
                      <p className="text-sm text-gray-400 font-semibold">Total Events</p>
                      <p className="text-3xl font-black text-blue-400 mt-1">{stats?.security_events || 0}</p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                      <span className="text-3xl">🛡️</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Events */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl p-8 border border-zinc-800/50 shadow-xl">
              <h3 className="text-xl font-black text-white mb-6 tracking-tight">Recent Security Events</h3>
              <div className="space-y-3">
                {events.slice(0, 5).map((event) => (
                  <div
                    key={event.id}
                    className="bg-zinc-900/50 backdrop-blur rounded-xl p-5 flex items-center justify-between border border-zinc-800/30 hover:border-zinc-700/50 transition-all duration-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${getSeverityColor(
                            event.severity
                          )}`}
                        >
                          {event.severity.toUpperCase()}
                        </span>
                        <span className="text-white font-medium">{event.event_type}</span>
                      </div>
                      <p className="text-gray-400 text-sm mt-1">
                        IP: {event.ip_address} | Confidence: {(event.confidence_score * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-gray-400 text-sm">
                      {new Date(event.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'threats' && (
          <div className="space-y-6">
            <div className="bg-zinc-950 rounded-lg p-6 border border-zinc-800">
              <h3 className="text-lg font-semibold text-white mb-4">All Security Events</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-800">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Severity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        IP Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Confidence
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {events.map((event) => (
                      <tr key={event.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {new Date(event.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {event.event_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded ${getSeverityColor(
                              event.severity
                            )}`}
                          >
                            {event.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {event.ip_address}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {(event.confidence_score * 100).toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {event.resolved ? (
                            <span className="text-green-400">✓ Resolved</span>
                          ) : (
                            <span className="text-red-400">⚠ Active</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-zinc-950 rounded-lg p-6 border border-zinc-800">
              <h3 className="text-lg font-semibold text-white mb-4">Timing Analysis Results</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-800">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        IP Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Requests
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Avg Time (ms)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Attack Probability
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {timingAnalysis.map((analysis) => (
                      <tr key={analysis.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {new Date(analysis.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {analysis.ip_address}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {analysis.request_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {analysis.avg_processing_time?.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={getThreatLevelColor(analysis.attack_probability)}>
                            {(analysis.attack_probability * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {analysis.is_suspicious ? (
                            <span className="text-red-400 font-semibold">🚨 SUSPICIOUS</span>
                          ) : (
                            <span className="text-green-400">✓ Normal</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
  };

  return (
    <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl p-8 border border-zinc-800/50 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value.toLocaleString()}</p>
        </div>
        <div
          className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color]} rounded-lg flex items-center justify-center text-2xl`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export default App;

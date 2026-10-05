import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Radio, Play, Square, Activity, Zap, TrendingUp, Clock,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer,
} from 'recharts';
import { generateFlow, flowToAlert } from '@/lib/dataGenerator';
import { addSimulatedFlow, getDashboardStats } from '@/lib/dataStore';
import { formatTime, timeAgo } from '@/lib/format';
import {
  SeverityBadge, PredictionBadge, DetectionTypeBadge,
} from '@/components/ui/Badges';
import type { NetworkFlow, Alert } from '@/types';

interface LiveEvent {
  flow: NetworkFlow;
  alert?: Alert;
}

interface RatePoint {
  time: string;
  rate: number;
}

export function LiveMonitoringPage() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [rateData, setRateData] = useState<RatePoint[]>([]);
  const [flowRate, setFlowRate] = useState(0);
  const [totalGenerated, setTotalGenerated] = useState(0);
  const [suspiciousDetected, setSuspiciousDetected] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const eventsEndRef = useRef<HTMLDivElement>(null);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (rateIntervalRef.current) {
      clearInterval(rateIntervalRef.current);
      rateIntervalRef.current = null;
    }
  }, []);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    setEvents([]);
    setRateData([]);
    setTotalGenerated(0);
    setSuspiciousDetected(0);

    // Generate flows at a rate of ~1-3 per second
    intervalRef.current = setInterval(() => {
      const flow = generateFlow({ suspiciousRatio: 0.3, secondsAgo: 0 });
      flow.timestamp = new Date().toISOString();
      addSimulatedFlow(flow);

      const event: LiveEvent = { flow };
      if (flow.label === 'SUSPICIOUS') {
        event.alert = flowToAlert(flow);
        setSuspiciousDetected((s) => s + 1);
      }

      setEvents((prev) => [event, ...prev].slice(0, 100));
      setTotalGenerated((t) => t + 1);
    }, 400 + Math.random() * 600);

    // Update rate chart every 2 seconds
    rateIntervalRef.current = setInterval(() => {
      const rate = Math.floor(Math.random() * 40 + 20);
      setFlowRate(rate);
      setRateData((prev) => [
        ...prev,
        { time: formatTime(new Date().toISOString()), rate },
      ].slice(-30));
    }, 2000);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (rateIntervalRef.current) clearInterval(rateIntervalRef.current);
    };
  }, []);

  // Auto-scroll to top when new events arrive
  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [events.length]);

  const stats = getDashboardStats();
  const normalEvents = totalGenerated - suspiciousDetected;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Simulation notice */}
      <div className="card border-status-warning/30 bg-status-warning/5 p-4 flex items-center gap-3">
        <Radio className="w-5 h-5 text-status-warning flex-shrink-0" />
        <div>
          <p className="text-sm text-status-warning font-medium">SIMULATION MODE</p>
          <p className="text-xs text-slate-400">
            This page generates synthetic network-flow records and classifies them with the ML model.
            No real network traffic is captured or scanned.
          </p>
        </div>
      </div>

      {/* Control panel */}
      <div className="card p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isMonitoring ? 'bg-status-normal/10 border border-status-normal/30' : 'bg-base-800 border border-base-700'
            }`}>
              <Activity className={`w-6 h-6 ${isMonitoring ? 'text-status-normal animate-pulseGlow' : 'text-slate-500'}`} />
            </div>
            <div>
              <p className="font-semibold text-slate-100">
                {isMonitoring ? 'Monitoring Active' : 'Monitoring Stopped'}
              </p>
              <p className="text-xs text-slate-500">
                {isMonitoring ? 'Generating and classifying flows in real time...' : 'Click start to begin simulation'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isMonitoring ? (
              <button onClick={startMonitoring} className="btn-success">
                <Play className="w-4 h-4" /> Start Monitoring
              </button>
            ) : (
              <button onClick={stopMonitoring} className="btn-danger">
                <Square className="w-4 h-4" /> Stop Monitoring
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Live stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-glow" />
            <span className="text-xs text-slate-400">Current Rate</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{flowRate} <span className="text-sm text-slate-500">flows/s</span></p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-glow" />
            <span className="text-xs text-slate-400">Total Generated</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{totalGenerated}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-status-normal" />
            <span className="text-xs text-slate-400">Normal</span>
          </div>
          <p className="text-2xl font-bold text-status-normal">{normalEvents}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-status-critical" />
            <span className="text-xs text-slate-400">Suspicious</span>
          </div>
          <p className="text-2xl font-bold text-status-critical">{suspiciousDetected}</p>
        </div>
      </div>

      {/* Rate chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-100">Traffic Rate</h3>
            <p className="text-xs text-slate-500">Flows per second</p>
          </div>
          <Clock className="w-5 h-5 text-cyan-glow" />
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={rateData}>
            <defs>
              <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
            <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
            <RTooltip
              contentStyle={{ background: '#0b1220', border: '1px solid #1a2540', borderRadius: '8px', fontSize: '12px' }}
            />
            <Area type="monotone" dataKey="rate" stroke="#22d3ee" strokeWidth={2} fill="url(#rateGrad)" name="Flows/s" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Live event stream */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-100">Live Event Stream</h3>
            <p className="text-xs text-slate-500">Real-time flow classification</p>
          </div>
          {isMonitoring && (
            <span className="flex items-center gap-1.5 text-xs text-status-normal">
              <span className="w-2 h-2 bg-status-normal rounded-full animate-pulseGlow" /> LIVE
            </span>
          )}
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12">
            <Radio className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">
              {isMonitoring ? 'Waiting for flows...' : 'Start monitoring to see live events'}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {events.map((event, idx) => (
              <div
                key={`${event.flow.id}-${idx}`}
                className={`flex items-center gap-3 p-3 rounded-lg border animate-slideIn ${
                  event.flow.label === 'SUSPICIOUS'
                    ? 'bg-status-critical/5 border-status-critical/20'
                    : 'bg-base-900 border-base-700/50'
                }`}
              >
                <span className="text-xs font-mono text-slate-500 w-16 flex-shrink-0">
                  {formatTime(event.flow.timestamp)}
                </span>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  event.flow.label === 'SUSPICIOUS' ? 'bg-status-critical' : 'bg-status-normal'
                }`} />
                <span className="font-mono text-xs text-slate-300 hidden sm:inline">
                  {event.flow.source_ip}:{event.flow.source_port} → {event.flow.destination_ip}:{event.flow.destination_port}
                </span>
                <span className="font-mono text-xs text-slate-400 sm:hidden">
                  {event.flow.source_ip} → :{event.flow.destination_port}
                </span>
                <span className="text-xs text-slate-500 hidden md:inline">{event.flow.protocol}</span>
                <div className="flex items-center gap-2 ml-auto">
                  <DetectionTypeBadge type={event.flow.detection_type} />
                  <PredictionBadge label={event.flow.label} />
                  {event.alert && <SeverityBadge severity={event.alert.severity} />}
                </div>
              </div>
            ))}
            <div ref={eventsEndRef} />
          </div>
        )}
      </div>

      {/* System stats footer */}
      <div className="card p-4 flex items-center justify-between text-xs text-slate-500">
        <span>System Detection Rate: <span className="text-cyan-glow font-medium">{stats.detectionRate}%</span></span>
        <span>Total System Alerts: <span className="text-status-warning font-medium">{stats.alertCount}</span></span>
      </div>
    </div>
  );
}

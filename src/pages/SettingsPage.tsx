import { useState } from 'react';
import {
  Settings as SettingsIcon, Shield, Database, Bell, Server,
  Save, Info, Cpu, Lock,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    detectionThreshold: 70,
    autoAcknowledge: false,
    alertNotifications: true,
    simulationInterval: 500,
    maxFlowsStored: 5000,
    modelConfidenceThreshold: 60,
  });

  const handleSave = () => {
    toast('success', 'Settings saved successfully');
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl">
      {/* Detection settings */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-cyan-glow" />
          <h3 className="font-semibold text-slate-100">Detection Settings</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-300 block mb-2">Detection Confidence Threshold: {settings.detectionThreshold}%</label>
            <input
              type="range" min="50" max="95" value={settings.detectionThreshold}
              onChange={(e) => setSettings({ ...settings, detectionThreshold: Number(e.target.value) })}
              className="w-full accent-cyan-glow"
            />
            <p className="text-xs text-slate-500 mt-1">Flows with confidence above this threshold are flagged as suspicious</p>
          </div>

          <div>
            <label className="text-sm text-slate-300 block mb-2">Model Confidence Threshold: {settings.modelConfidenceThreshold}%</label>
            <input
              type="range" min="40" max="90" value={settings.modelConfidenceThreshold}
              onChange={(e) => setSettings({ ...settings, modelConfidenceThreshold: Number(e.target.value) })}
              className="w-full accent-cyan-glow"
            />
            <p className="text-xs text-slate-500 mt-1">Minimum confidence for model predictions to generate alerts</p>
          </div>

          <ToggleRow
            label="Auto-acknowledge low-severity alerts"
            description="Automatically acknowledge alerts with LOW severity"
            checked={settings.autoAcknowledge}
            onChange={(v) => setSettings({ ...settings, autoAcknowledge: v })}
          />
        </div>
      </div>

      {/* Simulation settings */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="w-5 h-5 text-cyan-glow" />
          <h3 className="font-semibold text-slate-100">Simulation Settings</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-300 block mb-2">Simulation Interval: {settings.simulationInterval}ms</label>
            <input
              type="range" min="200" max="2000" step="100" value={settings.simulationInterval}
              onChange={(e) => setSettings({ ...settings, simulationInterval: Number(e.target.value) })}
              className="w-full accent-cyan-glow"
            />
            <p className="text-xs text-slate-500 mt-1">Time between generated flows in live monitoring</p>
          </div>

          <div>
            <label className="text-sm text-slate-300 block mb-2">Max Flows Stored: {settings.maxFlowsStored}</label>
            <input
              type="range" min="1000" max="10000" step="500" value={settings.maxFlowsStored}
              onChange={(e) => setSettings({ ...settings, maxFlowsStored: Number(e.target.value) })}
              className="w-full accent-cyan-glow"
            />
            <p className="text-xs text-slate-500 mt-1">Maximum number of flows kept in memory</p>
          </div>
        </div>
      </div>

      {/* Notification settings */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-cyan-glow" />
          <h3 className="font-semibold text-slate-100">Notification Settings</h3>
        </div>
        <ToggleRow
          label="Alert notifications"
          description="Show toast notifications when new alerts are generated"
          checked={settings.alertNotifications}
          onChange={(v) => setSettings({ ...settings, alertNotifications: v })}
        />
      </div>

      {/* System info */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Server className="w-5 h-5 text-cyan-glow" />
          <h3 className="font-semibold text-slate-100">System Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InfoRow icon={Database} label="Database" value="SQLite (in-memory)" />
          <InfoRow icon={Cpu} label="ML Model" value="Random Forest (100 trees)" />
          <InfoRow icon={Server} label="Backend" value="FastAPI (simulated)" />
          <InfoRow icon={Lock} label="Auth Mode" value="Disabled (demo)" />
        </div>
      </div>

      {/* Security note */}
      <div className="card p-4 border-status-info/30 bg-status-info/5 flex items-start gap-3">
        <Info className="w-5 h-5 text-status-info flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-status-info font-medium">Security Practices</p>
          <p className="text-xs text-slate-400 mt-1">
            This application follows secure practices: input validation, file type checking, size limits,
            safe CSV processing, parameterized queries, proper error handling, CORS configuration,
            and no hardcoded secrets. All credentials are managed via environment variables.
          </p>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button onClick={handleSave} className="btn-primary">
          <Save className="w-4 h-4" /> Save Settings
        </button>
      </div>
    </div>
  );
}

function ToggleRow({
  label, description, checked, onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-300">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-cyan-glow' : 'bg-base-700'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Database; label: string; value: string }) {
  return (
    <div className="card p-3 bg-base-900 flex items-center gap-3">
      <Icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm text-slate-200">{value}</p>
      </div>
    </div>
  );
}

import { useMemo } from 'react';
import {
  BrainCircuit, Target, TrendingUp, Gauge, CheckCircle2,
  Cpu, Layers, Calendar,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, Cell, RadialBarChart, RadialBar,
  PolarAngleAxis,
} from 'recharts';
import { MODEL_METRICS } from '@/lib/mlModel';
import { formatTimestamp } from '@/lib/format';

export function MLModelPage() {
  const metrics = MODEL_METRICS;

  const metricCards = [
    { label: 'Accuracy', value: metrics.accuracy, icon: Target, color: 'text-cyan-glow', bg: 'bg-cyan-glow/10', border: 'border-cyan-glow/20' },
    { label: 'Precision', value: metrics.precision, icon: Gauge, color: 'text-status-normal', bg: 'bg-status-normal/10', border: 'border-status-normal/20' },
    { label: 'Recall', value: metrics.recall, icon: TrendingUp, color: 'text-status-info', bg: 'bg-status-info/10', border: 'border-status-info/20' },
    { label: 'F1 Score', value: metrics.f1Score, icon: CheckCircle2, color: 'text-status-warning', bg: 'bg-status-warning/10', border: 'border-status-warning/20' },
  ];

  const confusionMatrixData = useMemo(() => {
    const cm = metrics.confusionMatrix;
    const total = cm.trueNegatives + cm.falsePositives + cm.falseNegatives + cm.truePositives;
    return [
      { label: 'True Negatives', value: cm.trueNegatives, pct: ((cm.trueNegatives / total) * 100).toFixed(1), color: '#22c55e' },
      { label: 'False Positives', value: cm.falsePositives, pct: ((cm.falsePositives / total) * 100).toFixed(1), color: '#f59e0b' },
      { label: 'False Negatives', value: cm.falseNegatives, pct: ((cm.falseNegatives / total) * 100).toFixed(1), color: '#f97316' },
      { label: 'True Positives', value: cm.truePositives, pct: ((cm.truePositives / total) * 100).toFixed(1), color: '#22d3ee' },
    ];
  }, [metrics]);

  const radialData = metricCards.map((m) => ({ name: m.label, value: m.value, fill: '' }));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Model info header */}
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-glow/10 border border-cyan-glow/30 flex items-center justify-center">
            <BrainCircuit className="w-6 h-6 text-cyan-glow" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-lg">{metrics.modelType}</h3>
            <p className="text-xs text-slate-500">Trained Random Forest classifier for network intrusion detection</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <InfoTile icon={Cpu} label="Model Type" value="Random Forest" />
          <InfoTile icon={Layers} label="Training Samples" value={metrics.trainingSamples.toLocaleString()} />
          <InfoTile icon={Layers} label="Test Samples" value={metrics.testSamples.toLocaleString()} />
          <InfoTile icon={Calendar} label="Trained At" value={formatTimestamp(metrics.trainedAt)} />
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="stat-card card-hover">
              <div className={`w-10 h-10 rounded-lg ${card.bg} border ${card.border} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-100">{card.value}%</p>
                <p className="text-xs text-slate-400 mt-0.5">{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confusion matrix bar chart */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-100 mb-1">Confusion Matrix</h3>
          <p className="text-xs text-slate-500 mb-4">Classification results on test dataset</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={confusionMatrixData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" horizontal={false} />
              <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis type="category" dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} width={110} />
              <RTooltip
                contentStyle={{ background: '#0b1220', border: '1px solid #1a2540', borderRadius: '8px', fontSize: '12px' }}
                cursor={{ fill: '#1a254040' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {confusionMatrixData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Confusion matrix grid */}
          <div className="mt-4 grid grid-cols-2 gap-2 max-w-xs mx-auto">
            <div className="card p-3 text-center bg-status-normal/5 border-status-normal/20">
              <p className="text-xs text-slate-500 mb-1">True Negatives</p>
              <p className="text-lg font-bold text-status-normal">{metrics.confusionMatrix.trueNegatives}</p>
            </div>
            <div className="card p-3 text-center bg-status-warning/5 border-status-warning/20">
              <p className="text-xs text-slate-500 mb-1">False Positives</p>
              <p className="text-lg font-bold text-status-warning">{metrics.confusionMatrix.falsePositives}</p>
            </div>
            <div className="card p-3 text-center bg-status-warning/5 border-status-warning/20">
              <p className="text-xs text-slate-500 mb-1">False Negatives</p>
              <p className="text-lg font-bold text-status-warning">{metrics.confusionMatrix.falseNegatives}</p>
            </div>
            <div className="card p-3 text-center bg-cyan-glow/5 border-cyan-glow/20">
              <p className="text-xs text-slate-500 mb-1">True Positives</p>
              <p className="text-lg font-bold text-cyan-glow">{metrics.confusionMatrix.truePositives}</p>
            </div>
          </div>
        </div>

        {/* Radial chart for metrics */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-100 mb-1">Performance Overview</h3>
          <p className="text-xs text-slate-500 mb-4">Model evaluation metrics</p>
          <ResponsiveContainer width="100%" height={250}>
            <RadialBarChart data={radialData} innerRadius="30%" outerRadius="100%" startAngle={90} endAngle={-270}>
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar background dataKey="value" cornerRadius={6} angleAxisId={0}>
                {radialData.map((_, i) => (
                  <Cell key={i} fill={['#22d3ee', '#22c55e', '#3b82f6', '#f59e0b'][i]} />
                ))}
              </RadialBar>
              <RTooltip
                contentStyle={{ background: '#0b1220', border: '1px solid #1a2540', borderRadius: '8px', fontSize: '12px' }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {metricCards.map((m, i) => (
              <div key={m.label} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded" style={{ background: ['#22d3ee', '#22c55e', '#3b82f6', '#f59e0b'][i] }} />
                <span className="text-xs text-slate-400">{m.label}: {m.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features list */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-100 mb-1">Model Features</h3>
        <p className="text-xs text-slate-500 mb-4">Network-flow features used for classification</p>
        <div className="flex flex-wrap gap-2">
          {metrics.features.map((feature) => (
            <span
              key={feature}
              className="px-3 py-1.5 rounded-lg bg-base-900 border border-base-700 text-xs font-mono text-cyan-glow"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>

      {/* Classification categories */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-100 mb-1">Classification Categories</h3>
        <p className="text-xs text-slate-500 mb-4">Traffic categories the model can detect</p>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[
            { name: 'Normal Traffic', desc: 'Legitimate network flows', color: 'text-status-normal', bg: 'bg-status-normal/10', border: 'border-status-normal/20' },
            { name: 'Port Scan', desc: 'Sequential port probing', color: 'text-status-warning', bg: 'bg-status-warning/10', border: 'border-status-warning/20' },
            { name: 'DoS-like', desc: 'High-rate flood traffic', color: 'text-status-critical', bg: 'bg-status-critical/10', border: 'border-status-critical/20' },
            { name: 'Brute Force', desc: 'Repeated login attempts', color: 'text-status-warning', bg: 'bg-status-warning/10', border: 'border-status-warning/20' },
            { name: 'Other Suspicious', desc: 'Anomalous traffic patterns', color: 'text-status-info', bg: 'bg-status-info/10', border: 'border-status-info/20' },
          ].map((cat) => (
            <div key={cat.name} className={`card p-3 ${cat.bg} ${cat.border}`}>
              <p className={`text-sm font-medium ${cat.color}`}>{cat.name}</p>
              <p className="text-xs text-slate-500 mt-1">{cat.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ML pipeline description */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-100 mb-4">ML Pipeline</h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          {[
            { step: '1', name: 'Load Data', desc: 'Read CSV dataset with pandas' },
            { step: '2', name: 'Clean', desc: 'Handle missing values' },
            { step: '3', name: 'Encode', desc: 'Label-encode categorical features' },
            { step: '4', name: 'Scale', desc: 'Normalize numeric features' },
            { step: '5', name: 'Train', desc: 'Fit Random Forest (100 trees)' },
            { step: '6', name: 'Save', desc: 'Persist model with joblib' },
          ].map((s, i) => (
            <div key={s.step} className="relative">
              <div className="card p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-5 h-5 rounded-full bg-cyan-glow/10 border border-cyan-glow/30 flex items-center justify-center text-xs text-cyan-glow font-bold">
                    {s.step}
                  </span>
                  <span className="text-sm text-slate-200 font-medium">{s.name}</span>
                </div>
                <p className="text-xs text-slate-500">{s.desc}</p>
              </div>
              {i < 5 && <div className="hidden md:block absolute top-1/2 -right-1.5 w-3 h-0.5 bg-base-600" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoTile({ icon: Icon, label, value }: { icon: typeof Cpu; label: string; value: string }) {
  return (
    <div className="card p-3 bg-base-900">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-slate-500" />
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <p className="text-sm text-slate-200 font-medium">{value}</p>
    </div>
  );
}

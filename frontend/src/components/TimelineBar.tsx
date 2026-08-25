interface TimelineEntry {
  name: string;
  start: number;
  end: number;
}

interface Props {
  timeline: TimelineEntry[];
  totalMs: number;
}

const PHASE_COLORS: Record<string, string> = {
  'DNS Lookup': 'bg-gray-500',
  'Connect + Send': 'bg-blue-500',
  'Wait (TTFB)': 'bg-yellow-500',
  'Receive': 'bg-green-500',
  'Total': 'bg-transparent',
};

const PHASE_NAMES: Record<string, string> = {
  'DNS Lookup': 'DNS',
  'Connect + Send': 'Connect',
  'Wait (TTFB)': 'TTFB',
  'Receive': 'Receive',
  'Total': 'Total',
};

export default function TimelineBar({ timeline, totalMs }: Props) {
  if (!timeline.length || totalMs <= 0) return null;

  // Filter out Total and compute segments
  const phases = timeline.filter(t => t.name !== 'Total');
  const maxEnd = Math.max(...phases.map(t => t.end), totalMs);

  return (
    <div className="px-4 py-3">
      {/* Bar */}
      <div className="h-3 flex rounded overflow-hidden bg-gray-800">
        {phases.map((phase, idx) => {
          const duration = phase.end - phase.start;
          const pct = Math.max(0.5, (duration / maxEnd) * 100);
          const color = PHASE_COLORS[phase.name] || 'bg-gray-600';
          return (
            <div
              key={idx}
              className={`${color} h-full transition-all`}
              style={{ width: `${pct}%`, minWidth: '2px' }}
              title={`${phase.name}: ${Math.round(duration)}ms`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2 text-[11px]">
        {phases.map((phase, idx) => {
          const duration = phase.end - phase.start;
          const color = PHASE_COLORS[phase.name] || 'bg-gray-600';
          const name = PHASE_NAMES[phase.name] || phase.name;
          return (
            <div key={idx} className="flex items-center gap-1.5 text-gray-400">
              <span className={`w-2 h-2 rounded-full ${color}`} />
              <span>{name}</span>
              <span className="text-gray-500">{Math.round(duration)}ms</span>
            </div>
          );
        })}
        <div className="flex items-center gap-1.5 text-gray-400 ml-auto">
          <span className="text-gray-500">Total:</span>
          <span className="text-gray-300 font-medium">{totalMs}ms</span>
        </div>
      </div>
    </div>
  );
}

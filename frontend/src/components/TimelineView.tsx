interface Props {
  timeline: Array<{ name: string; start: number; end: number }>;
}

export default function TimelineView({ timeline }: Props) {
  const total = timeline.length > 0 ? timeline[timeline.length - 1].end : 1;

  return (
    <div className="space-y-2">
      {timeline.map((t, i) => {
        const pct = total > 0 ? ((t.end - t.start) / total) * 100 : 0;
        const offset = total > 0 ? (t.start / total) * 100 : 0;
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-28 truncate">{t.name}</span>
            <div className="flex-1 h-4 bg-gray-800 rounded overflow-hidden relative">
              <div
                className="absolute h-full bg-blue-500 rounded"
                style={{ left: `${offset}%`, width: `${Math.max(pct, 1)}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 w-16 text-right">{(t.end - t.start).toFixed(1)}ms</span>
          </div>
        );
      })}
    </div>
  );
}

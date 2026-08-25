interface Props {
  results: Array<{ name: string; passed: boolean; error?: string }>;
}

export default function TestResults({ results }: Props) {
  if (results.length === 0) {
    return <div className="text-gray-500 text-sm">No tests executed</div>;
  }

  const passed = results.filter(r => r.passed).length;

  return (
    <div className="space-y-2">
      <div className="text-sm mb-2">
        <span className="text-green-400">{passed} passed</span>
        <span className="text-gray-500 mx-2">/</span>
        <span className="text-red-400">{results.length - passed} failed</span>
      </div>
      {results.map((r, i) => (
        <div key={i} className={`px-3 py-2 rounded text-sm ${r.passed ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>
          <div className="flex items-center gap-2">
            <span>{r.passed ? '✓' : '✗'}</span>
            <span>{r.name}</span>
          </div>
          {r.error && <div className="text-xs mt-1 text-red-300">{r.error}</div>}
        </div>
      ))}
    </div>
  );
}

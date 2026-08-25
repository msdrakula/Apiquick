import { useState, useMemo } from 'react';
import { ExecuteResponse } from '../types';
import TimelineView from './TimelineView';
import TestResults from './TestResults';
import TimelineBar from './TimelineBar';
import { getSuitableLenses } from './lenses/registry';
import JSONLens from './lenses/JSONLens';
import XMLLens from './lenses/XMLLens';
import HTMLLens from './lenses/HTMLLens';
import ImageLens from './lenses/ImageLens';
import RawLens from './lenses/RawLens';
import { lineDiff } from '../lib/diff';

interface Props {
  response: ExecuteResponse | null;
  previousResponse?: ExecuteResponse | null;
  runSummary?: string;
  loading: boolean;
  wsMessages?: Array<{ type: 'in' | 'out' | 'status'; data: string; time: string }>;
  isWS?: boolean;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function statusColor(status: number) {
  if (status === 0) return 'bg-red-900/40 text-red-400 border-red-800';
  if (status < 300) return 'bg-green-900/40 text-green-400 border-green-800';
  if (status < 400) return 'bg-yellow-900/40 text-yellow-400 border-yellow-800';
  return 'bg-red-900/40 text-red-400 border-red-800';
}

const LENS_MAP: Record<string, any> = {
  json: JSONLens,
  xml: XMLLens,
  html: HTMLLens,
  image: ImageLens,
  raw: RawLens,
};

export default function ResponsePanel({ response, previousResponse, runSummary, loading, wsMessages = [], isWS = false }: Props) {
  const [activeTab, setActiveTab] = useState<'body' | 'headers' | 'cookies' | 'timeline' | 'tests' | 'diff'>('body');
  const [activeLens, setActiveLens] = useState<string | null>(null);

  const contentType = response?.headers.find(h => h.key.toLowerCase() === 'content-type')?.value || '';
  const size = response?.body?.length || 0;

  const suitableLenses = useMemo(() => {
    if (!response) return [];
    return getSuitableLenses(contentType, response.body);
  }, [response, contentType]);

  // Auto-select best lens on new response
  useMemo(() => {
    if (suitableLenses.length > 0) {
      setActiveLens(suitableLenses[0].id);
    }
  }, [suitableLenses.map(l => l.id).join(',')]);

  if (loading && !isWS) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Sending request...
        </div>
      </div>
    );
  }

  if (isWS) {
    return (
      <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-[#0b1120] border-t border-gray-800">
        <div className="px-4 py-2 border-b border-gray-800 flex items-center gap-4 text-xs">
          <span className="font-semibold text-gray-300">WebSocket Messages</span>
          <span className="text-gray-500">{wsMessages.length} messages</span>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-2">
          {wsMessages.length === 0 && <div className="text-gray-500 text-sm">No messages yet</div>}
          {wsMessages.map((msg, i) => (
            <div key={i} className={`text-xs p-2 rounded border ${msg.type === 'in' ? 'bg-blue-900/20 text-blue-300 border-blue-900/30' : msg.type === 'out' ? 'bg-green-900/20 text-green-300 border-green-900/30' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono text-gray-500">{msg.time}</span>
                <span className="text-[10px] font-bold uppercase">{msg.type}</span>
              </div>
              <pre className="whitespace-pre-wrap break-all font-mono text-[11px]">{msg.data}</pre>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
        Click Send to get a response
      </div>
    );
  }

  const headerCount = response.headers.length;
  const cookieCount = (response.cookies || []).length;
  const testCount = (response.testResults || []).length;
  const timelineCount = (response.timeline || []).length;

  const mainTabs: { id: 'body' | 'headers' | 'cookies' | 'timeline' | 'tests' | 'diff'; label: string; count?: number }[] = [
    { id: 'body', label: 'Body' },
    { id: 'headers', label: 'Headers', count: headerCount },
    { id: 'cookies', label: 'Cookies', count: cookieCount },
    { id: 'timeline', label: 'Timeline', count: timelineCount },
    { id: 'tests', label: 'Tests', count: testCount },
    { id: 'diff', label: 'Diff' },
  ];

  const LensComponent = activeLens ? LENS_MAP[activeLens] : RawLens;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0b1120] border-t border-gray-800">
      {/* Response meta bar */}
      <div className="px-4 py-2 border-b border-gray-800 flex items-center gap-3 text-xs">
        <span className={`px-2 py-0.5 rounded border font-medium ${statusColor(response.status)}`}>
          {response.error || response.status === 0 ? 'Error' : `${response.status} ${response.statusText}`}
        </span>
        <span className="text-gray-400">{response.timeMs}ms</span>
        <span className="text-gray-400">{formatSize(size)}</span>
        {runSummary && <span className="text-zinc-400">{runSummary}</span>}
        <div className="ml-auto flex gap-1">
          {mainTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2 py-1 rounded text-[11px] font-medium capitalize transition-colors flex items-center gap-1 ${activeTab === tab.id ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="bg-gray-600 text-gray-200 text-[10px] px-1 py-0 rounded-full min-w-[14px] text-center">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Bar */}
      {response.timeline && response.timeline.length > 0 && (
        <TimelineBar timeline={response.timeline} totalMs={response.timeMs} />
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto min-w-0">
        {/* Body with lens selector */}
        <div className={activeTab === 'body' ? 'block h-full' : 'hidden'}>
          <div className="h-full flex flex-col">
            {/* Lens tabs */}
            {suitableLenses.length > 1 && (
              <div className="flex items-center gap-1 px-4 py-1.5 border-b border-gray-800">
                {suitableLenses.map(lens => (
                  <button
                    key={lens.id}
                    onClick={() => setActiveLens(lens.id)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${activeLens === lens.id ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
                  >
                    {lens.name}
                  </button>
                ))}
                <button
                  onClick={() => navigator.clipboard.writeText(response.body)}
                  className="text-[11px] px-2 py-0.5 rounded font-medium text-gray-400 hover:bg-gray-800 ml-auto"
                >
                  Copy
                </button>
                <span className="text-[10px] text-gray-600">{contentType}</span>
              </div>
            )}
            {suitableLenses.length <= 1 && (
              <div className="flex items-center gap-2 px-4 py-1.5 border-b border-gray-800">
                <button
                  onClick={() => navigator.clipboard.writeText(response.body)}
                  className="text-[11px] px-2 py-0.5 rounded font-medium text-gray-400 hover:bg-gray-800 ml-auto"
                >
                  Copy
                </button>
                <span className="text-[10px] text-gray-600">{contentType}</span>
              </div>
            )}
            <div className="flex-1 min-h-0 p-2">
              {LensComponent && <LensComponent body={response.body} contentType={contentType as any} />}
            </div>
          </div>
        </div>

        {/* Headers */}
        <div className={activeTab === 'headers' ? 'block p-4' : 'hidden'}>
          <div className="space-y-1">
            {response.headers.map((h, i) => (
              <div key={i} className="flex gap-4 py-1 text-xs border-b border-gray-800/50">
                <span className="text-orange-400 w-1/3 truncate font-medium min-w-0">{h.key}</span>
                <span className="text-gray-300 break-all">{h.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cookies */}
        <div className={activeTab === 'cookies' ? 'block p-4' : 'hidden'}>
          <div className="space-y-1">
            {(!response.cookies || response.cookies.length === 0) && <div className="text-gray-500 text-sm">No cookies received</div>}
            {(response.cookies || []).map((c, i) => (
              <div key={i} className="flex gap-4 py-1 text-xs border-b border-gray-800/50">
                <span className="text-orange-400 w-1/4 truncate font-medium min-w-0">{c.name}</span>
                <span className="text-gray-300 break-all flex-1">{c.value}</span>
                <span className="text-gray-500">{c.domain}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className={activeTab === 'timeline' ? 'block' : 'hidden'}>
          <TimelineView timeline={response.timeline} />
        </div>

        {/* Tests */}
        <div className={activeTab === 'tests' ? 'block' : 'hidden'}>
          <TestResults results={response.testResults || []} />
        </div>

        <div className={activeTab === 'diff' ? 'block p-3' : 'hidden'}>
          {!previousResponse ? (
            <div className="text-gray-500 text-sm">Send again to compare with the previous response.</div>
          ) : (
            <div className="font-mono text-[11px] leading-5">
              {lineDiff(previousResponse.body || '', response.body || '').map((row, i) => (
                <div
                  key={i}
                  className={
                    row.type === 'add' ? 'bg-green-900/30 text-green-300' :
                    row.type === 'del' ? 'bg-red-900/30 text-red-300' :
                    'text-gray-400'
                  }
                >
                  <span className="inline-block w-4 text-gray-600">{row.type === 'add' ? '+' : row.type === 'del' ? '-' : ' '}</span>
                  {row.text}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

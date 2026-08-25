import Editor from '@monaco-editor/react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  height?: string;
  readOnly?: boolean;
}

export default function MonacoEditor({ value, onChange, language = 'text', height = '200px', readOnly = false }: Props) {
  const safeValue = value ?? '';
  return (
    <div className="border border-gray-700 rounded overflow-hidden h-full">
      <Editor
        height={height}
        language={language}
        value={safeValue}
        onChange={(v) => onChange(v || '')}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          readOnly,
          automaticLayout: true,
          wordWrap: 'on',
        }}
      />
    </div>
  );
}

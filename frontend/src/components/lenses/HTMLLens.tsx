interface Props {
  body: string;
}

export default function HTMLLens({ body }: Props) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className="text-[10px] text-gray-500">Rendered Preview</span>
      </div>
      <iframe
        sandbox=""
        srcDoc={body}
        className="flex-1 w-full bg-white rounded border border-gray-700"
        title="HTML Preview"
      />
    </div>
  );
}

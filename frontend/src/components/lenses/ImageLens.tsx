import { useMemo } from 'react';

interface Props {
  body: string;
  contentType: string;
}

export default function ImageLens({ body, contentType }: Props) {
  const src = useMemo(() => {
    try {
      const blob = new Blob([body], { type: contentType });
      return URL.createObjectURL(blob);
    } catch {
      return '';
    }
  }, [body, contentType]);

  if (!src) return <div className="text-gray-500 text-sm">Unable to render image</div>;

  return (
    <div className="h-full flex items-center justify-center p-4">
      <img src={src} alt="Response" className="max-w-full max-h-full object-contain rounded border border-gray-700" />
    </div>
  );
}

import { useEffect } from 'react';

interface Props {
  message: string | null;
  onDone: () => void;
}

export default function Toast({ message, onDone }: Props) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [message, onDone]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[80] max-w-sm rounded-lg border border-white/10 bg-[#1a1e28] px-4 py-3 text-sm text-zinc-100">
      {message}
    </div>
  );
}

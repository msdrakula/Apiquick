import { useRef, useCallback } from 'react';

interface Props {
  direction: 'horizontal' | 'vertical';
  onResize: (delta: number) => void;
  className?: string;
}

export default function ResizeHandle({ direction, onResize, className = '' }: Props) {
  const isDragging = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    let lastX = e.clientX;
    let lastY = e.clientY;

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      if (direction === 'horizontal') {
        onResize(ev.clientX - lastX);
        lastX = ev.clientX;
      } else {
        onResize(ev.clientY - lastY);
        lastY = ev.clientY;
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [direction, onResize]);

  const isHorizontal = direction === 'horizontal';
  return (
    <div
      onMouseDown={handleMouseDown}
      className={`
        ${isHorizontal ? 'w-[4px] cursor-col-resize' : 'h-[4px] cursor-row-resize'}
        hover:bg-blue-500/50 active:bg-blue-500/80 transition-colors flex-shrink-0 z-10
        ${className}
      `}
    />
  );
}

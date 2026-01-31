/**
 * VirtualList.jsx
 *
 * Lista virtualizada simple:
 * - Solo renderiza los items visibles en pantalla.
 * - Mantiene el scroll fluido aunque haya cientos de filas.
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

const VirtualList = memo(function VirtualList({
  items,
  itemHeight = 44,
  overscan = 6,
  className = '',
  renderItem,
}) {
  const containerRef = useRef(null);
  const scrollTopRef = useRef(0);
  const rafRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  // Medimos el alto visible para calcular cuantas filas pintar.
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;

    const updateHeight = () => setViewportHeight(element.clientHeight || 0);
    updateHeight();

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateHeight);
      resizeObserver.observe(element);
    } else {
      window.addEventListener('resize', updateHeight);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', updateHeight);
      }
    };
  }, []);

  // Throttle del scroll con requestAnimationFrame para no saturar renders.
  const handleScroll = useCallback((event) => {
    scrollTopRef.current = event.currentTarget.scrollTop;

    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      setScrollTop(scrollTopRef.current);
      rafRef.current = null;
    });
  }, []);

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  const totalHeight = items.length * itemHeight;
  const safeViewportHeight = viewportHeight || itemHeight * 4;

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(safeViewportHeight / itemHeight) + overscan * 2;
  const endIndex = Math.min(items.length, startIndex + visibleCount);

  const visibleItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex]
  );

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`overflow-y-auto ${className}`}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${startIndex * itemHeight}px)` }}>
          {visibleItems.map((item, index) => (
            <div
              key={item.id ?? startIndex + index}
              style={{ height: itemHeight }}
              className="flex items-center"
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default VirtualList;

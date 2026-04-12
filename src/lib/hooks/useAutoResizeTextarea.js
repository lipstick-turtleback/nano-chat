import { useEffect, useRef } from 'react';

/**
 * Auto-resize textarea hook — grows with content up to maxRows
 */
export function useAutoResizeTextarea(value, minRows = 1, maxRows = 8) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reset height to get accurate scrollHeight
    el.style.height = 'auto';

    // Calculate min/max heights
    const computedStyle = getComputedStyle(el);
    const lineHeight = parseFloat(computedStyle.lineHeight) || 21;
    const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
    const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
    const borderTop = parseFloat(computedStyle.borderTopWidth) || 0;
    const borderBottom = parseFloat(computedStyle.borderBottomWidth) || 0;
    const borderTotal = borderTop + borderBottom;
    const paddingTotal = paddingTop + paddingBottom;

    const minHeight = lineHeight * minRows + paddingTotal + borderTotal;
    const maxHeight = lineHeight * maxRows + paddingTotal + borderTotal;

    // Set height based on content
    const newHeight = Math.min(Math.max(el.scrollHeight, minHeight), maxHeight);
    el.style.height = `${newHeight}px`;

    // Toggle overflow-y
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [value, minRows, maxRows]);

  return ref;
}

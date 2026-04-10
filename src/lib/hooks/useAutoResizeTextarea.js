import { useEffect, useRef } from 'react';

/**
 * Auto-resize textarea height based on content.
 * Uses scrollHeight to dynamically grow/shrink.
 */
export function useAutoResizeTextarea(value, minRows = 1, maxRows = 6) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reset height to get accurate scrollHeight
    el.style.height = 'auto';

    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 21;
    const paddingTop = parseFloat(getComputedStyle(el).paddingTop) || 0;
    const paddingBottom = parseFloat(getComputedStyle(el).paddingBottom) || 0;
    const borderHeight =
      parseFloat(getComputedStyle(el).borderTopWidth) +
        parseFloat(getComputedStyle(el).borderBottomWidth) || 0;

    const minHeight = lineHeight * minRows + paddingTop + paddingBottom + borderHeight;
    const maxHeight = lineHeight * maxRows + paddingTop + paddingBottom + borderHeight;

    const newHeight = Math.min(Math.max(el.scrollHeight, minHeight), maxHeight);
    el.style.height = `${newHeight}px`;
  }, [value, minRows, maxRows]);

  return ref;
}

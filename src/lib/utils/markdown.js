import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { MARKED_OPTIONS } from './constants';

const sanitizer = DOMPurify(window);

export function renderMarkdown(text) {
  const mdHtml = marked.parse(text, MARKED_OPTIONS);
  return sanitizer.sanitize(mdHtml);
}

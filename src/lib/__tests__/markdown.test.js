import { renderMarkdown } from '../utils/markdown';

describe('markdown utility', () => {
  it('converts markdown to HTML', () => {
    const result = renderMarkdown('**bold** and *italic*');
    expect(result).toContain('<strong>bold</strong>');
  });

  it('handles line breaks', () => {
    const result = renderMarkdown('line one\nline two');
    expect(result).toContain('<br');
  });

  it('sanitizes XSS payloads', () => {
    const result = renderMarkdown('<script>alert("xss")</script>');
    expect(result).not.toContain('<script>');
  });
});

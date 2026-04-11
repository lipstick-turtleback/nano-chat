import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { MARKED_OPTIONS } from './constants';

const sanitizer = DOMPurify(window);

// Common LaTeX → HTML conversions for chat rendering
const LATEX_REPLACEMENTS = [
  // Arrows
  [/\$\\rightarrow\$/g, '→'],
  [/\$\\leftarrow\$/g, '←'],
  [/\$\\leftrightarrow\$/g, '↔'],
  [/\$\\Rightarrow\$/g, '⇒'],
  [/\$\\Leftarrow\$/g, '⇐'],
  [/\$\\Leftrightarrow\$/g, '⇔'],
  [/\$\\uparrow\$/g, '↑'],
  [/\$\\downarrow\$/g, '↓'],
  // Math symbols
  [/\$\\times\$/g, '×'],
  [/\$\\div\$/g, '÷'],
  [/\$\\pm\$/g, '±'],
  [/\$\\cdot\$/g, '·'],
  [/\$\\circ\$/g, '∘'],
  [/\$\\leq\$/g, '≤'],
  [/\$\\geq\$/g, '≥'],
  [/\$\\neq\$/g, '≠'],
  [/\$\\approx\$/g, '≈'],
  [/\$\\infty\$/g, '∞'],
  [/\$\\sum\$/g, '∑'],
  [/\$\\prod\$/g, '∏'],
  [/\$\\int\$/g, '∫'],
  [/\$\\partial\$/g, '∂'],
  [/\$\\nabla\$/g, '∇'],
  [/\$\\alpha\$/g, 'α'],
  [/\$\\beta\$/g, 'β'],
  [/\$\\gamma\$/g, 'γ'],
  [/\$\\delta\$/g, 'δ'],
  [/\$\\epsilon\$/g, 'ε'],
  [/\$\\theta\$/g, 'θ'],
  [/\$\\lambda\$/g, 'λ'],
  [/\$\\mu\$/g, 'μ'],
  [/\$\\pi\$/g, 'π'],
  [/\$\\sigma\$/g, 'σ'],
  [/\$\\phi\$/g, 'φ'],
  [/\$\\omega\$/g, 'ω'],
  [/\$\\Delta\$/g, 'Δ'],
  [/\$\\Omega\$/g, 'Ω'],
  // Sets
  [/\$\\in\$/g, '∈'],
  [/\$\\notin\$/g, '∉'],
  [/\$\\subset\$/g, '⊂'],
  [/\$\\supset\$/g, '⊃'],
  [/\$\\cup\$/g, '∪'],
  [/\$\\cap\$/g, '∩'],
  // Logic
  [/\$\\forall\$/g, '∀'],
  [/\$\\exists\$/g, '∃'],
  [/\$\\neg\$/g, '¬'],
  [/\$\\land\$/g, '∧'],
  [/\$\\lor\$/g, '∨'],
  [/\$\\therefore\$/g, '∴'],
  // Clean up remaining $ delimiters around unknown content
  [/\$([^$]+)\$/g, '$1']
];

/**
 * Convert LaTeX math notation to readable HTML entities
 */
function convertLatex(text) {
  if (!text) return text;
  let result = text;
  for (const [pattern, replacement] of LATEX_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/**
 * Render markdown to sanitized HTML, converting LaTeX math
 */
export function renderMarkdown(text) {
  if (!text) return '';
  const convertedText = convertLatex(text);
  const mdHtml = marked.parse(convertedText, MARKED_OPTIONS);
  return sanitizer.sanitize(mdHtml);
}

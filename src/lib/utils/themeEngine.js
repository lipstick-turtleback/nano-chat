// 100 random themes for creative challenge generation
export const THEME_POOL = [
  'lemonade',
  'penguin',
  'economy',
  'midnight train',
  'ancient library',
  'robotic garden',
  'coffee shop',
  'northern lights',
  'forgotten letter',
  'street musician',
  'underwater city',
  'butterfly migration',
  'clockwork bird',
  'abandoned carnival',
  'thunderstorm',
  'recipe book',
  'desert oasis',
  'paper airplane',
  'glass blower',
  'lighthouse keeper',
  'chess tournament',
  'honeycomb',
  'satellite dish',
  'vintage camera',
  'monsoon rain',
  'bookstore cat',
  "astronaut's dream",
  'cobblestone alley',
  'wind chimes',
  'origami crane',
  'midnight bakery',
  'crystal cave',
  'ferry crossing',
  'street painter',
  'snow globe',
  'typewriter',
  'lunar eclipse',
  'fish market',
  'old radio',
  'campfire stories',
  'hot air balloon',
  'rain puddle',
  'antique shop',
  'mountain echo',
  'candle maker',
  'subway platform',
  'telescope',
  'bamboo forest',
  'flea market',
  'stargazing',
  'tide pools',
  'carousel',
  'thrift store',
  'constellation',
  'blacksmith',
  'greenhouse',
  'train station',
  'mosaic tiles',
  'ocean liner',
  'vineyard',
  'cathedral bells',
  'night market',
  'pottery wheel',
  'aurora',
  'sailing ship',
  'chocolate factory',
  'mountain trail',
  'jazz club',
  'flower shop',
  'observatory',
  'ice sculpture',
  'fishing village',
  'antique clock',
  'coral reef',
  'rooftop garden',
  'spice bazaar',
  'frozen lake',
  'violin maker',
  'canyon echo',
  'lantern festival',
  'bird sanctuary',
  'bookbinder',
  'thundercloud',
  'silk road',
  'lighthouse',
  'mushroom forest',
  'harbor dawn',
  'quilt maker',
  'solar eclipse',
  'tea ceremony',
  'abandoned factory',
  'firefly field',
  'windmill',
  'meteor shower',
  'maple syrup',
  'underground river',
  'kite festival',
  'copper smith',
  'dolphin pod',
  'autumn market',
  'stained glass',
  'wolf pack',
  'cave painting',
  'sunset cruise',
  'herbalist'
];

/**
 * Pick N unique random themes from the pool
 */
export function pickRandomThemes(count = 3) {
  const shuffled = [...THEME_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Build a creative challenge prompt for the LLM
 * Tells the LLM to respond with a JSON tool call
 */
export function createCreativeChallengePrompt(themes, companionContext) {
  return `Here are three completely random themes: "${themes[0]}", "${themes[1]}", and "${themes[2]}".

Create an engaging interactive activity that creatively weaves all three themes together. Choose ONE format:

1. **quiz** — A multiple-choice question with a story context connecting all three themes
2. **story_quiz** — A short story (3-4 sentences) embedding all three themes, followed by a comprehension question
3. **word_match** — 5 vocabulary words related to the themes, with shuffled definitions to match
4. **fill_blank** — A paragraph about the themes with 3 blanks to fill
5. **true_false** — 5 interesting statements about connections between the themes, some true some false
6. **reorder** — A jumbled sentence that connects all three themes
7. **open_question** — A thought-provoking discussion question linking all three themes

Respond with ONLY valid JSON, nothing else:

{
  "tool": "quiz",
  "title": "Creative Challenge: {theme1}, {theme2} & {theme3}",
  "content": {
    "prompt": "The question or instruction",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 1,
    "explanation": "Why the correct answer is right and what it teaches",
    "hint": "A helpful hint (optional)"
  }
}

For "story_quiz" use:
{
  "tool": "story_quiz",
  "title": "Story Challenge: ...",
  "content": {
    "story": "A 3-4 sentence engaging story weaving all three themes",
    "question": "A comprehension or inference question about the story",
    "options": ["A", "B", "C", "D"],
    "correct": 0,
    "explanation": "..."
  }
}

For "word_match" use:
{
  "tool": "word_match",
  "title": "Vocabulary Match: ...",
  "content": {
    "pairs": [
      { "word": "Word1", "definition": "Definition 1" },
      { "word": "Word2", "definition": "Definition 2" },
      { "word": "Word3", "definition": "Definition 3" },
      { "word": "Word4", "definition": "Definition 4" },
      { "word": "Word5", "definition": "Definition 5" }
    ]
  }
}

For "fill_blank" use:
{
  "tool": "fill_blank",
  "title": "Fill in the Blanks: ...",
  "content": {
    "text": "A paragraph with [BLANK1], [BLANK2], [BLANK3] markers",
    "answers": ["answer1", "answer2", "answer3"],
    "explanation": "..."
  }
}

For "true_false" use:
{
  "tool": "true_false",
  "title": "True or False: ...",
  "content": {
    "statements": [
      { "text": "Statement 1", "answer": true, "explanation": "..." },
      { "text": "Statement 2", "answer": false, "explanation": "..." }
    ]
  }
}

Make it creative, surprising, and genuinely educational. The connection between the three themes should feel clever and unexpected. Difficulty: C2 level.${companionContext ? '\n\n' + companionContext : ''}`;
}

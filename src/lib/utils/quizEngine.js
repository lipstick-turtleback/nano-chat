// ═══════════════════════════════════════════
// Interactive Quiz System for Aria
// ═══════════════════════════════════════════

export const QUIZ_TYPES = {
  // Choose the correct C2 paraphrase of a simple sentence
  PARAPHRASE: 'paraphrase',
  // Rearrange jumbled words into a grammatically correct sentence
  REORDER: 'reorder',
  // Match vocabulary words to their definitions
  MATCH: 'match',
  // Multiple choice — pick the right word/phrase for context
  QUIZ: 'quiz',
  // Find and fix the error in the sentence
  ERROR_CORRECT: 'error_correct',
  // Choose the correct word form (noun/verb/adjective/adverb)
  WORD_FORM: 'word_form'
};

/**
 * Generate a Paraphrase Challenge
 * Aria gives a simple sentence, student picks the C2 upgrade
 */
export function generateParaphraseChallenge() {
  const challenges = [
    {
      prompt: 'Upgrade this sentence to C2 level:',
      sentence: '"I think this is a bad idea."',
      options: [
        'I reckon this is not a very good plan.',
        'I am firmly of the opinion that this course of action is ill-advised.',
        'This idea seems quite bad to me.',
        "I don't think this idea is great."
      ],
      correct: 1,
      explanation:
        '"Firmly of the opinion" + "ill-advised" demonstrate C2 hedging and sophisticated vocabulary.'
    },
    {
      prompt: 'Upgrade this sentence to C2 level:',
      sentence: '"The government should do more about climate change."',
      options: [
        'The government needs to do lots more about climate change.',
        'It is imperative that the government take more action regarding climate change.',
        'The government really should be doing more stuff about climate change.',
        'Climate change needs more government doing.'
      ],
      correct: 1,
      explanation: '"It is imperative that" (subjunctive) + "regarding" are hallmark C2 structures.'
    },
    {
      prompt: 'Upgrade this sentence to C2 level:',
      sentence: '"Many people believe that technology makes life easier."',
      options: [
        'A lot of people think technology makes life way easier.',
        'It is widely contended that technological advancements have considerably facilitated daily life.',
        'Technology is believed by many people to make life more easy.',
        'Many persons believe that technology has made life easier.'
      ],
      correct: 1,
      explanation:
        '"Widely contended" + "technological advancements" + "considerably facilitated" = Band 8+ lexical resource.'
    },
    {
      prompt: 'Upgrade this sentence to C2 level:',
      sentence: '"Education is very important for children."',
      options: [
        'Education is really, really important for kids.',
        'Education plays an indispensable role in the cognitive and social development of children.',
        'Education is one of the most important things for children.',
        'It is very important that children get education.'
      ],
      correct: 1,
      explanation:
        '"Indispensable role" + "cognitive and social development" demonstrate C2 collocations and academic register.'
    },
    {
      prompt: 'Upgrade this sentence to C2 level:',
      sentence: '"Social media has changed how we communicate."',
      options: [
        'Social media has changed the way we communicate with each other a lot.',
        'Social media has profoundly transformed the landscape of interpersonal communication.',
        'Social media has made big changes to how people communicate.',
        'The way we communicate has been changed by social media.'
      ],
      correct: 1,
      explanation:
        '"Profoundly transformed" + "landscape of interpersonal communication" show C2 lexical sophistication.'
    }
  ];
  return challenges[Math.floor(Math.random() * challenges.length)];
}

/**
 * Generate a Sentence Reordering Challenge
 * Words are scrambled, student must reconstruct
 */
export function generateReorderChallenge() {
  const challenges = [
    {
      prompt: 'Rearrange these words into a grammatically correct C2 sentence:',
      words: [
        'had',
        'I',
        'known',
        'the',
        'consequences',
        'would',
        'never',
        'have',
        'I',
        'embarked',
        'upon',
        'this',
        'venture'
      ],
      correct: 'Had I known the consequences, I would never have embarked upon this venture.',
      hint: 'This uses an inverted conditional structure.',
      explanation:
        'Inverted conditional: "Had I known" instead of "If I had known" — a Band 8+ structure.'
    },
    {
      prompt: 'Rearrange these words into a grammatically correct C2 sentence:',
      words: [
        'not',
        'until',
        'the',
        'results',
        'were',
        'published',
        'did',
        'the',
        'team',
        'realise',
        'the',
        'significance',
        'of',
        'their',
        'findings'
      ],
      correct:
        'Not until the results were published did the team realise the significance of their findings.',
      hint: 'This uses negative inversion.',
      explanation:
        'Negative inversion with "Not until" requires auxiliary inversion: "did the team realise."'
    },
    {
      prompt: 'Rearrange these words into a grammatically correct C2 sentence:',
      words: [
        'under',
        'no',
        'circumstances',
        'should',
        'this',
        'information',
        'be',
        'disclosed',
        'to',
        'unauthorised',
        'personnel'
      ],
      correct:
        'Under no circumstances should this information be disclosed to unauthorised personnel.',
      hint: 'This uses inversion after a negative adverbial phrase.',
      explanation:
        '"Under no circumstances" triggers subject-auxiliary inversion: "should this information."'
    },
    {
      prompt: 'Rearrange these words into a grammatically correct C2 sentence:',
      words: [
        'it',
        'is',
        'the',
        'persistence',
        'of',
        'the',
        'researchers',
        'rather',
        'than',
        'their',
        'funding',
        'that',
        'has',
        'yielded',
        'such',
        'groundbreaking',
        'results'
      ],
      correct:
        'It is the persistence of the researchers rather than their funding that has yielded such groundbreaking results.',
      hint: 'This is a cleft sentence (It is... that...).',
      explanation:
        'Cleft sentences emphasise specific elements. "It is X that..." is a sophisticated C2 structure.'
    }
  ];
  return challenges[Math.floor(Math.random() * challenges.length)];
}

/**
 * Generate a Vocabulary Matching Challenge
 * Match C2 words to their definitions
 */
export function generateMatchChallenge() {
  const challenges = [
    {
      prompt: 'Match each C2 word to its correct definition:',
      pairs: [
        { word: 'Ubiquitous', definition: 'Present everywhere at the same time' },
        { word: 'Ephemeral', definition: 'Lasting for a very short time' },
        { word: 'Pragmatic', definition: 'Dealing with things sensibly and realistically' },
        { word: 'Eloquent', definition: 'Fluent and persuasive in speech or writing' },
        { word: 'Meticulous', definition: 'Showing great attention to detail; very careful' }
      ],
      // For the quiz, we shuffle definitions
      shuffledDefinitions: [
        'Fluent and persuasive in speech or writing',
        'Present everywhere at the same time',
        'Showing great attention to detail; very careful',
        'Lasting for a very short time',
        'Dealing with things sensibly and realistically'
      ]
    },
    {
      prompt: 'Match each C2 word to its correct definition:',
      pairs: [
        { word: 'Pernicious', definition: 'Having a harmful effect in a gradual way' },
        { word: 'Resilient', definition: 'Able to recover quickly from difficulties' },
        { word: 'Ambiguous', definition: 'Open to more than one interpretation' },
        { word: 'Prudent', definition: 'Acting with care and thought for the future' },
        { word: 'Candid', definition: 'Truthful and straightforward; frank' }
      ],
      shuffledDefinitions: [
        'Truthful and straightforward; frank',
        'Having a harmful effect in a gradual way',
        'Acting with care and thought for the future',
        'Open to more than one interpretation',
        'Able to recover quickly from difficulties'
      ]
    }
  ];
  return challenges[Math.floor(Math.random() * challenges.length)];
}

/**
 * Generate a Multiple Choice Quiz
 */
export function generateQuiz() {
  const quizzes = [
    {
      prompt:
        'Which word best fits the blank?\n"The evidence was _____, leaving no room for doubt."',
      options: ['incontrovertible', 'undeniable', 'unquestionable', 'indisputable'],
      correct: 0,
      explanation:
        '"Incontrovertible" is the most formal C2 choice. All four are similar, but "incontrovertible" specifically means impossible to dispute — the strongest fit for "no room for doubt."'
    },
    {
      prompt: 'Which sentence uses the subjunctive correctly?',
      options: [
        'It is essential that he arrives on time.',
        'It is essential that he arrive on time.',
        'It is essential that he will arrive on time.',
        'It is essential that he is arriving on time.'
      ],
      correct: 1,
      explanation:
        'After "It is essential that," the subjunctive uses the base form: "arrive" (not "arrives" or "will arrive").'
    },
    {
      prompt:
        '"Not only _____ the project, but she also exceeded all expectations." Choose the correct form:',
      options: ['she completed', 'did she complete', 'she did complete', 'has she completed'],
      correct: 1,
      explanation:
        '"Not only" at the start of a clause triggers subject-auxiliary inversion: "did she complete."'
    },
    {
      prompt: 'Which phrase is the most appropriate C2 collocation with "damage"?',
      options: ['make damage', 'do damage', 'inflict damage', 'cause damage'],
      correct: 2,
      explanation:
        '"Inflict damage" is the most formal C2 collocation. "Do damage" is acceptable but less sophisticated. "Make damage" is incorrect.'
    },
    {
      prompt: 'Choose the sentence with the correct use of "despite":',
      options: [
        'Despite of the rain, we went for a walk.',
        'Despite the rain, we went for a walk.',
        'Despite it was raining, we went for a walk.',
        'Despite there was rain, we went for a walk.'
      ],
      correct: 1,
      explanation:
        '"Despite" is followed by a noun/gerund, NOT "of" or a clause. "Despite the rain" is correct. For clauses, use "Despite the fact that..."'
    }
  ];
  return quizzes[Math.floor(Math.random() * quizzes.length)];
}

/**
 * Generate an Error Correction Challenge
 */
export function generateErrorCorrection() {
  const challenges = [
    {
      prompt:
        'Find the error in this sentence and choose the correction:\n"The number of students who has enrolled in the course have increased significantly."',
      options: [
        'has → have; have → has',
        'has → have; have → have (no change to second)',
        'has → has (no change); have → has',
        'The sentence is correct as written.'
      ],
      correct: 0,
      explanation:
        '"The number" (singular) → "has enrolled" (not "have enrolled"). "Students" (plural) → "have increased." Subject-verb agreement with "the number of" vs "a number of."'
    },
    {
      prompt:
        'Find the register error:\n"Hey Prof, your lecture was super cool and I learnt loads. Could you send me the slides? Cheers!"',
      options: [
        'There is no register error — the tone is appropriate.',
        'The informal register is inappropriate for addressing a professor. Use formal register.',
        '"Learnt" should be "learned" in all contexts.',
        '"Cheers" is never appropriate in written communication.'
      ],
      correct: 1,
      explanation:
        'Writing to a professor requires formal register: "Dear Professor, I found your lecture highly informative. Would it be possible to obtain the slides? Kind regards."'
    },
    {
      prompt:
        'Find the collocation error:\n"The government should make more investment in renewable energy."',
      options: [
        '"make" → "do"',
        '"investment" → "investing"',
        '"make" → "increase its"',
        'There is no collocation error.'
      ],
      correct: 2,
      explanation:
        'We don\'t "make investment." Better collocations: "increase investment in," "invest more in," or "increase its investment in."'
    }
  ];
  return challenges[Math.floor(Math.random() * challenges.length)];
}

/**
 * Generate a Word Form Challenge
 */
export function generateWordFormChallenge() {
  const challenges = [
    {
      prompt:
        'Choose the correct word form:\n"The _____ of the new policy has been met with _____ from employees."',
      options: [
        'implement / resist',
        'implementation / resistance',
        'implementing / resisting',
        'implemented / resisted'
      ],
      correct: 1,
      explanation:
        'After "The" we need a noun: "implementation." After "with" we need a noun: "resistance."'
    },
    {
      prompt:
        'Choose the correct word form:\n"Her _____ argument was _____ persuasive, leaving the audience _____."',
      options: [
        'compelling / highly / convincing',
        'compel / high / convinced',
        'compelled / higher / convincing',
        'compelling / highly / convincingly'
      ],
      correct: 0,
      explanation:
        '"Compelling" (adj) modifies "argument." "Highly" (adv) modifies "persuasive." "Convincing" (adj) describes the audience\'s state.'
    }
  ];
  return challenges[Math.floor(Math.random() * challenges.length)];
}

/**
 * Get a random challenge of any type
 */
export function getRandomChallenge(type) {
  if (type) {
    switch (type) {
      case QUIZ_TYPES.PARAPHRASE:
        return { type, ...generateParaphraseChallenge() };
      case QUIZ_TYPES.REORDER:
        return { type, ...generateReorderChallenge() };
      case QUIZ_TYPES.MATCH:
        return { type, ...generateMatchChallenge() };
      case QUIZ_TYPES.QUIZ:
        return { type, ...generateQuiz() };
      case QUIZ_TYPES.ERROR_CORRECT:
        return { type, ...generateErrorCorrection() };
      case QUIZ_TYPES.WORD_FORM:
        return { type, ...generateWordFormChallenge() };
      default:
        return getRandomChallenge();
    }
  }

  // Random type
  const types = Object.values(QUIZ_TYPES);
  const randomType = types[Math.floor(Math.random() * types.length)];
  return getRandomChallenge(randomType);
}

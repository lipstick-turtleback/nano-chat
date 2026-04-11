import { useState } from 'react';
import DiceRoller from './DiceRoller';
import ToolNotification from './ToolNotification';

/**
 * Interactive Quiz Component
 */
function QuizCard({ content, onSubmit }) {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const isCorrect = selected === content.correct;

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    onSubmit?.({ selected, isCorrect });
  };

  return (
    <div className="tool-card quiz-card">
      <div className="tool-card-header">
        <span className="tool-badge">🧠</span>
        <h4>{content.prompt}</h4>
      </div>

      <div className="quiz-options">
        {content.options.map((opt, i) => {
          let className = 'quiz-option';
          if (submitted) {
            if (i === content.correct) className += ' correct';
            else if (i === selected) className += ' incorrect';
          } else if (i === selected) {
            className += ' selected';
          }
          return (
            <button
              key={i}
              type="button"
              className={className}
              onClick={() => !submitted && setSelected(i)}
              disabled={submitted}
            >
              <span className="quiz-option-letter">{String.fromCharCode(65 + i)}</span>
              <span className="quiz-option-text">{opt}</span>
              {submitted && i === content.correct && <span className="quiz-icon">✓</span>}
              {submitted && i === selected && !isCorrect && <span className="quiz-icon">✗</span>}
            </button>
          );
        })}
      </div>

      {!submitted ? (
        <button
          type="button"
          className="quiz-submit-btn"
          onClick={handleSubmit}
          disabled={selected === null}
        >
          Submit Answer
        </button>
      ) : (
        <div className="quiz-explanation">
          <strong>{isCorrect ? '🎉 Correct!' : 'Not quite — '}</strong>
          {content.explanation}
        </div>
      )}
    </div>
  );
}

/**
 * True/False Card
 */
function TrueFalseCard({ content, onSubmit }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState([]);
  const current = content.statements[currentIndex];
  const allDone = results.length === content.statements.length;
  const correctCount = results.filter((r) => r.isCorrect).length;

  const handleAnswer = (answer) => {
    const isCorrect = answer === current.answer;
    const newResults = [...results, { ...current, userAnswer: answer, isCorrect }];
    setResults(newResults);

    if (currentIndex < content.statements.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }

    onSubmit?.({ results: newResults, totalCorrect: newResults.filter((r) => r.isCorrect).length });
  };

  if (allDone) {
    return (
      <div className="tool-card tf-card">
        <div className="tool-card-header">
          <span className="tool-badge">✅</span>
          <h4>True or False — Results</h4>
        </div>
        <div className="tf-score">
          You got{' '}
          <strong>
            {correctCount}/{content.statements.length}
          </strong>{' '}
          correct
          {correctCount === content.statements.length && ' — Perfect! 🎉'}
        </div>
        <div className="tf-results">
          {results.map((r, i) => (
            <div key={i} className={`tf-result-item ${r.isCorrect ? 'correct' : 'incorrect'}`}>
              <span className="tf-result-icon">{r.isCorrect ? '✓' : '✗'}</span>
              <span className="tf-result-text">
                {r.text} — <em>{r.answer ? 'True' : 'False'}</em>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="tool-card tf-card">
      <div className="tool-card-header">
        <span className="tool-badge">✅</span>
        <h4>
          True or False ({currentIndex + 1}/{content.statements.length})
        </h4>
      </div>
      <p className="tf-statement">{current.text}</p>
      <div className="tf-buttons">
        <button type="button" className="tf-btn true-btn" onClick={() => handleAnswer(true)}>
          True
        </button>
        <button type="button" className="tf-btn false-btn" onClick={() => handleAnswer(false)}>
          False
        </button>
      </div>
      {results.length > 0 && (
        <div className="tf-feedback">
          {results[results.length - 1].isCorrect ? '✓ Correct!' : '✗ Incorrect'} —{' '}
          {results[results.length - 1].explanation}
        </div>
      )}
    </div>
  );
}

/**
 * Fill in the Blanks Card
 */
function FillBlankCard({ content, onSubmit }) {
  const [answers, setAnswers] = useState(content.answers.map(() => ''));
  const [submitted, setSubmitted] = useState(false);

  const correctCount = answers.filter(
    (a, i) => a.trim().toLowerCase() === content.answers[i].toLowerCase()
  ).length;

  const isAllCorrect = correctCount === content.answers.length;

  const handleSubmit = () => {
    setSubmitted(true);
    onSubmit?.({ answers, correctCount, total: content.answers.length });
  };

  const parts = content.text.split(/(\[BLANK\d+\])/g);

  return (
    <div className="tool-card fill-blank-card">
      <div className="tool-card-header">
        <span className="tool-badge">✏️</span>
        <h4>Fill in the Blanks</h4>
      </div>
      <p className="fill-blank-text">
        {parts.map((part, i) => {
          const blankMatch = part.match(/\[BLANK(\d+)\]/);
          if (blankMatch) {
            const idx = parseInt(blankMatch[1], 10) - 1;
            if (submitted) {
              const isCorrect =
                answers[idx]?.trim().toLowerCase() === content.answers[idx].toLowerCase();
              return (
                <span key={i} className={`blank-answer ${isCorrect ? 'correct' : 'incorrect'}`}>
                  {answers[idx] || '___'}
                  <span className="blank-correct">({content.answers[idx]})</span>
                </span>
              );
            }
            return (
              <input
                key={i}
                type="text"
                className="blank-input"
                value={answers[idx]}
                onChange={(e) => {
                  const next = [...answers];
                  next[idx] = e.target.value;
                  setAnswers(next);
                }}
                placeholder={`#${idx + 1}`}
                disabled={submitted}
              />
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </p>

      {!submitted ? (
        <button
          type="button"
          className="quiz-submit-btn"
          onClick={handleSubmit}
          disabled={answers.some((a) => !a.trim())}
        >
          Check Answers
        </button>
      ) : (
        <div className="quiz-explanation">
          <strong>
            {isAllCorrect ? '🎉 All correct!' : `${correctCount}/${content.answers.length} correct`}
          </strong>
          {content.explanation && <p>{content.explanation}</p>}
        </div>
      )}
    </div>
  );
}

/**
 * Word Match Card
 */
function WordMatchCard({ content, onSubmit }) {
  const [matches, setMatches] = useState({});
  const [selectedWord, setSelectedWord] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const shuffledDefs = [...content.pairs].map((p) => p.definition).sort(() => Math.random() - 0.5);

  const handleDefClick = (def) => {
    if (submitted || !selectedWord) return;
    setMatches({ ...matches, [selectedWord]: def });
    setSelectedWord(null);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    let correctCount = 0;
    content.pairs.forEach((pair) => {
      if (matches[pair.word] === pair.definition) correctCount++;
    });
    onSubmit?.({ matches, correctCount, total: content.pairs.length });
  };

  const correctCount = content.pairs.filter((p) => matches[p.word] === p.definition).length;

  return (
    <div className="tool-card match-card">
      <div className="tool-card-header">
        <span className="tool-badge">🔗</span>
        <h4>Match Words to Definitions</h4>
      </div>
      <p className="match-instruction">Click a word, then click its definition.</p>
      <div className="match-grid">
        <div className="match-words">
          {content.pairs.map((pair) => {
            const isMatched = !!matches[pair.word];
            const isCorrect = submitted && matches[pair.word] === pair.definition;
            return (
              <button
                key={pair.word}
                type="button"
                className={`match-word ${selectedWord === pair.word ? 'selected' : ''} ${isMatched ? 'matched' : ''} ${submitted && isCorrect ? 'correct' : ''}`}
                onClick={() => !submitted && !isMatched && setSelectedWord(pair.word)}
                disabled={submitted || isMatched}
              >
                {pair.word}
              </button>
            );
          })}
        </div>
        <div className="match-definitions">
          {shuffledDefs.map((def) => {
            const matchedWord = Object.entries(matches).find(([, d]) => d === def)?.[0];
            const isCorrect =
              submitted && content.pairs.find((p) => p.definition === def)?.word === matchedWord;
            return (
              <button
                key={def}
                type="button"
                className={`match-def ${matchedWord ? 'matched' : ''} ${submitted && isCorrect ? 'correct' : ''}`}
                onClick={() => handleDefClick(def)}
                disabled={submitted || !!matchedWord}
              >
                {def}
              </button>
            );
          })}
        </div>
      </div>

      {!submitted ? (
        <button
          type="button"
          className="quiz-submit-btn"
          onClick={handleSubmit}
          disabled={Object.keys(matches).length !== content.pairs.length}
        >
          Check Matches ({Object.keys(matches).length}/{content.pairs.length})
        </button>
      ) : (
        <div className="quiz-explanation">
          <strong>
            {correctCount === content.pairs.length
              ? '🎉 Perfect!'
              : `${correctCount}/${content.pairs.length} matched correctly`}
          </strong>
        </div>
      )}
    </div>
  );
}

/**
 * Riddle Card — guess the answer
 */
function RiddleCard({ content, onSubmit }) {
  const [guess, setGuess] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [hintRevealed, setHintRevealed] = useState(false);

  const handleSubmit = () => {
    if (!guess.trim()) return;
    setSubmitted(true);
    const isCorrect = guess.trim().toLowerCase() === content.answer.toLowerCase();
    onSubmit?.({ guess: guess.trim(), isCorrect });
  };

  return (
    <div className="tool-card riddle-card">
      <div className="tool-card-header">
        <span className="tool-badge">🤔</span>
        <h4>Riddle</h4>
      </div>
      <p className="riddle-text">{content.riddle}</p>

      {!submitted ? (
        <>
          <div className="riddle-input-row">
            <input
              type="text"
              className="riddle-input"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Your answer..."
            />
            <button type="button" className="quiz-submit-btn" onClick={handleSubmit}>
              Guess
            </button>
          </div>
          {!hintRevealed && content.hint && (
            <button type="button" className="hint-btn" onClick={() => setHintRevealed(true)}>
              💡 Show Hint
            </button>
          )}
          {hintRevealed && <p className="hint-text">💡 {content.hint}</p>}
        </>
      ) : (
        <div className="quiz-explanation">
          {guess.toLowerCase() === content.answer.toLowerCase() ? (
            <strong>🎉 Correct! The answer is: {content.answer}</strong>
          ) : (
            <>
              <strong>Not quite — The answer is: {content.answer}</strong>
              <p>You guessed: "{guess}"</p>
            </>
          )}
          {content.explanation && <p>{content.explanation}</p>}
        </div>
      )}
    </div>
  );
}

/**
 * Emoji Pictionary — guess the word/phrase from emojis
 */
function EmojiPictCard({ content, onSubmit }) {
  const [guess, setGuess] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [hintRevealed, setHintRevealed] = useState(false);

  const handleSubmit = () => {
    if (!guess.trim()) return;
    setSubmitted(true);
    const isCorrect = guess
      .trim()
      .toLowerCase()
      .includes(content.answer.toLowerCase().split(' ')[0]);
    onSubmit?.({ guess: guess.trim(), isCorrect });
  };

  return (
    <div className="tool-card emoji-pict-card">
      <div className="tool-card-header">
        <span className="tool-badge">🎭</span>
        <h4>Emoji Pictionary</h4>
      </div>
      <div className="emoji-display">{content.emojis}</div>
      <p className="emoji-category">{content.category || 'Guess the phrase!'}</p>

      {!submitted ? (
        <>
          <div className="riddle-input-row">
            <input
              type="text"
              className="riddle-input"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="What does this mean?"
            />
            <button type="button" className="quiz-submit-btn" onClick={handleSubmit}>
              Guess
            </button>
          </div>
          {!hintRevealed && content.hint && (
            <button type="button" className="hint-btn" onClick={() => setHintRevealed(true)}>
              💡 Show Hint
            </button>
          )}
          {hintRevealed && <p className="hint-text">💡 {content.hint}</p>}
        </>
      ) : (
        <div className="quiz-explanation">
          <strong>
            {submitted && guess.toLowerCase().includes(content.answer.toLowerCase().split(' ')[0])
              ? '🎉 Correct!'
              : `The answer is: ${content.answer}`}
          </strong>
          {!guess.toLowerCase().includes(content.answer.toLowerCase().split(' ')[0]) && (
            <p>You guessed: "{guess}"</p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Word Ladder — change one letter at a time
 */
function WordLadderCard({ content, onSubmit }) {
  const [currentWord, setCurrentWord] = useState(content.startWord);
  const [attempts, setAttempts] = useState([]);
  const [completed, setCompleted] = useState(false);

  const handleGuess = (word) => {
    if (!word.trim() || completed) return;
    const isCorrect = word.trim().toLowerCase() === content.targetWord.toLowerCase();
    const newAttempts = [...attempts, word.trim()];
    setAttempts(newAttempts);

    if (isCorrect) {
      setCompleted(true);
      onSubmit?.({ attempts: newAttempts, success: true, totalAttempts: newAttempts.length });
    }
  };

  return (
    <div className="tool-card word-ladder-card">
      <div className="tool-card-header">
        <span className="tool-badge">🪜</span>
        <h4>
          Word Ladder: {content.startWord} → {content.targetWord}
        </h4>
      </div>
      <p className="ladder-instruction">Change one letter at a time to reach the target word.</p>

      <div className="ladder-history">
        <div className="ladder-word start">{content.startWord}</div>
        {attempts.map((word, i) => (
          <div
            key={i}
            className={`ladder-word ${i === attempts.length - 1 && completed ? 'target' : ''}`}
          >
            {word}
          </div>
        ))}
      </div>

      {!completed && <WordInput onSubmit={handleGuess} label="Next word" />}

      {completed && (
        <div className="quiz-explanation">
          <strong>
            🎉 Solved in {attempts.length} {attempts.length === 1 ? 'step' : 'steps'}!
          </strong>
        </div>
      )}
    </div>
  );
}

/**
 * Would You Rather Card
 */
function WouldYouRatherCard({ content, onSubmit }) {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!selected) return;
    setSubmitted(true);
    onSubmit?.({ selected });
  };

  return (
    <div className="tool-card wyr-card">
      <div className="tool-card-header">
        <span className="tool-badge">🤷</span>
        <h4>Would You Rather?</h4>
      </div>

      <div className="wyr-options">
        <button
          type="button"
          className={`wyr-option ${selected === 0 ? 'selected' : ''} ${submitted ? 'disabled' : ''}`}
          onClick={() => !submitted && setSelected(0)}
        >
          <span className="wyr-letter">A</span>
          {content.optionA}
        </button>
        <div className="wyr-or">OR</div>
        <button
          type="button"
          className={`wyr-option ${selected === 1 ? 'selected' : ''} ${submitted ? 'disabled' : ''}`}
          onClick={() => !submitted && setSelected(1)}
        >
          <span className="wyr-letter">B</span>
          {content.optionB}
        </button>
      </div>

      {!submitted ? (
        <button
          type="button"
          className="quiz-submit-btn"
          onClick={handleSubmit}
          disabled={!selected}
        >
          Choose
        </button>
      ) : (
        <div className="quiz-explanation">
          <strong>You chose: {selected === 0 ? content.optionA : content.optionB}</strong>
          {content.explanation && <p>{content.explanation}</p>}
        </div>
      )}
    </div>
  );
}

/**
 * Helper: Simple word input component
 */
function WordInput({ onSubmit, label = 'Your answer' }) {
  const [word, setWord] = useState('');

  const handleSubmit = () => {
    if (word.trim()) {
      onSubmit(word.trim());
      setWord('');
    }
  };

  return (
    <div className="riddle-input-row">
      <input
        type="text"
        className="riddle-input"
        value={word}
        onChange={(e) => setWord(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder={label}
      />
      <button type="button" className="quiz-submit-btn" onClick={handleSubmit}>
        Submit
      </button>
    </div>
  );
}

/**
 * Main Tool Renderer — dispatches to the right card type
 */
function ToolRenderer({ tool, onSubmit }) {
  const { tool: toolType } = tool;

  // Interactive tools
  switch (toolType) {
    case 'quiz':
    case 'story_quiz':
      return <QuizCard content={tool.content} onSubmit={onSubmit} />;

    case 'true_false':
      return <TrueFalseCard content={tool.content} onSubmit={onSubmit} />;

    case 'fill_blank':
      return <FillBlankCard content={tool.content} onSubmit={onSubmit} />;

    case 'word_match':
      return <WordMatchCard content={tool.content} onSubmit={onSubmit} />;

    case 'riddle':
      return <RiddleCard content={tool.content} onSubmit={onSubmit} />;

    case 'word_ladder':
      return <WordLadderCard content={tool.content} onSubmit={onSubmit} />;

    case 'emoji_pictionary':
    case 'emoji_pict':
      return <EmojiPictCard content={tool.content} onSubmit={onSubmit} />;

    case 'would_you_rather':
      return <WouldYouRatherCard content={tool.content} onSubmit={onSubmit} />;

    case 'dice_roll':
      return <DiceRoller content={tool.content} onSubmit={onSubmit} />;

    // Background/notification tools
    case 'save_memory':
    case 'track_progress':
    case 'unlock_achievement':
    case 'achievement':
    case 'storage_view':
    case 'storage_set':
    case 'info':
    case 'warning':
    case 'challenge':
      return <ToolNotification tool={tool} />;

    default:
      // If tool type is unknown, try to render as a generic info notification
      if (tool.title || tool.content?.message) {
        return <ToolNotification tool={tool} />;
      }
      return null;
  }
}

export default ToolRenderer;

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

  const handleSubmit = (choiceIndex) => {
    if (submitted) return;
    setSubmitted(true);
    setSelected(choiceIndex);
    onSubmit?.({ selected: choiceIndex, option: content.options?.[choiceIndex] || content[`option${choiceIndex === 0 ? 'A' : 'B'}`] });
  };

  const optionA = content.optionA || content.options?.[0] || 'Option A';
  const optionB = content.optionB || content.options?.[1] || 'Option B';

  return (
    <div className="tool-card wyr-card">
      <div className="tool-card-header">
        <span className="tool-badge">🤷</span>
        <h4>Would You Rather?</h4>
      </div>

      <div className="wyr-options">
        <button
          type="button"
          className={`wyr-option ${submitted && selected === 0 ? 'chosen' : ''} ${submitted && selected !== 0 ? 'faded' : ''}`}
          onClick={() => handleSubmit(0)}
          disabled={submitted}
        >
          <span className="wyr-letter">A</span>
          {optionA}
          {submitted && selected === 0 && <span className="wyr-chosen-badge">✓ Your Choice</span>}
        </button>
        <div className="wyr-or">— OR —</div>
        <button
          type="button"
          className={`wyr-option ${submitted && selected === 1 ? 'chosen' : ''} ${submitted && selected !== 1 ? 'faded' : ''}`}
          onClick={() => handleSubmit(1)}
          disabled={submitted}
        >
          <span className="wyr-letter">B</span>
          {optionB}
          {submitted && selected === 1 && <span className="wyr-chosen-badge">✓ Your Choice</span>}
        </button>
      </div>

      {submitted && content.explanation && (
        <div className="quiz-explanation">
          <em>{content.explanation}</em>
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
 * Reflection Card — journaling prompt with text input
 */
function ReflectionCard({ content, onSubmit }) {
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!text.trim()) return;
    setSubmitted(true);
    onSubmit?.({ text: text.trim(), wordCount: text.trim().split(/\s+/).length });
  };

  return (
    <div className="tool-card reflection-card">
      <div className="tool-card-header">
        <span className="tool-badge">📝</span>
        <h4>{content.prompt || 'Reflection Prompt'}</h4>
      </div>

      {!submitted ? (
        <>
          {content.instructions && <p className="reflection-instructions">{content.instructions}</p>}
          <textarea
            className="reflection-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your thoughts here..."
            rows={4}
          />
          <button
            type="button"
            className="quiz-submit-btn"
            onClick={handleSubmit}
            disabled={!text.trim()}
          >
            Submit Reflection
          </button>
        </>
      ) : (
        <div className="quiz-explanation">
          <strong>✍️ Reflection saved!</strong>
          <p>{text.length} characters, {text.trim().split(/\s+/).length} words</p>
        </div>
      )}
    </div>
  );
}

/**
 * Progress Card — visual milestone tracker
 */
function ProgressCard({ content, onSubmit }) {
  const milestones = content.milestones || [];
  const completedCount = milestones.filter((m) => m.completed).length;
  const progressPercent =
    milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  return (
    <div className="tool-card progress-card">
      <div className="tool-card-header">
        <span className="tool-badge">📊</span>
        <h4>{content.title || 'Progress Tracker'}</h4>
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
        <span className="progress-bar-text">{progressPercent}%</span>
      </div>

      <div className="milestones-list">
        {milestones.map((milestone, i) => (
          <div key={i} className={`milestone-item ${milestone.completed ? 'completed' : ''}`}>
            <span className="milestone-icon">{milestone.completed ? '✅' : '⬜'}</span>
            <span className="milestone-text">{milestone.text}</span>
          </div>
        ))}
      </div>

      {content.message && <p className="progress-message">{content.message}</p>}
    </div>
  );
}

/**
 * Poll Card — opinion gathering with vote buttons
 */
function PollCard({ content, onSubmit }) {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    onSubmit?.({ selected, option: content.options[selected] });
  };

  return (
    <div className="tool-card poll-card">
      <div className="tool-card-header">
        <span className="tool-badge">📊</span>
        <h4>{content.question || 'Quick Poll'}</h4>
      </div>

      <div className="poll-options">
        {content.options.map((opt, i) => {
          let className = 'poll-option';
          if (submitted) {
            if (i === selected) className += ' selected';
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
              {opt}
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
          Vote
        </button>
      ) : (
        <div className="quiz-explanation">
          <strong>You voted for: {content.options[selected]}</strong>
        </div>
      )}
    </div>
  );
}

/**
 * Word of the Day Card — flashcard-style word display
 */
function WordOfDayCard({ content, onSubmit }) {
  const [revealed, setRevealed] = useState(false);

  const handleReveal = () => {
    setRevealed(true);
    onSubmit?.({ viewed: true });
  };

  return (
    <div className="tool-card wod-card">
      <div className="tool-card-header">
        <span className="tool-badge">📚</span>
        <h4>Word of the Day</h4>
      </div>

      <div className="wod-content">
        <h3 className="wod-word">{content.word}</h3>
        {content.pronunciation && (
          <p className="wod-pronunciation">/{content.pronunciation}/</p>
        )}

        {!revealed ? (
          <button type="button" className="quiz-submit-btn" onClick={handleReveal}>
            Reveal Meaning
          </button>
        ) : (
          <div className="wod-details">
            <p className="wod-definition">{content.definition}</p>
            {content.example && (
              <p className="wod-example">
                <em>Example:</em> {content.example}
              </p>
            )}
            {content.etymology && (
              <p className="wod-etymology">
                <em>Origin:</em> {content.etymology}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Code Card — syntax-highlighted code block
 */
function CodeCard({ content, onSubmit }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onSubmit?.({ copied: true });
  };

  return (
    <div className="tool-card code-card">
      <div className="tool-card-header">
        <span className="tool-badge">💻</span>
        <h4>{content.title || 'Code Example'}</h4>
        <button type="button" className="code-copy-btn" onClick={handleCopy}>
          {copied ? '✓ Copied' : '📋 Copy'}
        </button>
      </div>

      {content.description && <p className="code-description">{content.description}</p>}

      <pre className="code-block">
        <code className={`language-${content.language || 'javascript'}`}>{content.code}</code>
      </pre>

      {content.explanation && <p className="code-explanation">{content.explanation}</p>}
    </div>
  );
}

/**
 * Timeline Card — sequential events display
 */
function TimelineCard({ content, onSubmit }) {
  const events = content.events || [];

  return (
    <div className="tool-card timeline-card">
      <div className="tool-card-header">
        <span className="tool-badge">📅</span>
        <h4>{content.title || 'Timeline'}</h4>
      </div>

      <div className="timeline">
        {events.map((event, i) => (
          <div key={i} className="timeline-item">
            <div className="timeline-dot" />
            <div className="timeline-content">
              {event.date && <span className="timeline-date">{event.date}</span>}
              <h5 className="timeline-event-title">{event.title}</h5>
              {event.description && <p className="timeline-event-desc">{event.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Comparison Card — side-by-side table
 */
function ComparisonCard({ content, onSubmit }) {
  const items = content.items || [];
  const headers = content.headers || ['Option A', 'Option B'];

  return (
    <div className="tool-card comparison-card">
      <div className="tool-card-header">
        <span className="tool-badge">⚖️</span>
        <h4>{content.title || 'Comparison'}</h4>
      </div>

      <table className="comparison-table">
        <thead>
          <tr>
            <th>Feature</th>
            {headers.map((header, i) => (
              <th key={i}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td className="comparison-feature">{item.feature}</td>
              {item.values.map((val, j) => (
                <td key={j} className={`comparison-value ${val.highlight ? 'highlight' : ''}`}>
                  {val.text}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {content.summary && <p className="comparison-summary">{content.summary}</p>}
    </div>
  );
}

/**
 * Checklist Card — interactive task list
 */
function ChecklistCard({ content, onSubmit }) {
  const [checked, setChecked] = useState({});

  const handleToggle = (index) => {
    const newChecked = { ...checked, [index]: !checked[index] };
    setChecked(newChecked);

    const completedCount = Object.values(newChecked).filter(Boolean).length;
    onSubmit?.({ checked: newChecked, completedCount, total: content.items.length });
  };

  const completedCount = Object.values(checked).filter(Boolean).length;
  const allDone = completedCount === content.items.length;

  return (
    <div className="tool-card checklist-card">
      <div className="tool-card-header">
        <span className="tool-badge">✅</span>
        <h4>{content.title || 'Checklist'}</h4>
      </div>

      <div className="checklist-items">
        {content.items.map((item, i) => (
          <label key={i} className={`checklist-item ${checked[i] ? 'checked' : ''}`}>
            <input
              type="checkbox"
              checked={checked[i] || false}
              onChange={() => handleToggle(i)}
            />
            <span className="checklist-text">{item}</span>
          </label>
        ))}
      </div>

      <div className="checklist-progress">
        {completedCount}/{content.items.length} completed
        {allDone && ' 🎉'}
      </div>
    </div>
  );
}

/**
 * Rating Card — star rating widget
 */
function RatingCard({ content, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) return;
    setSubmitted(true);
    onSubmit?.({ rating });
  };

  return (
    <div className="tool-card rating-card">
      <div className="tool-card-header">
        <span className="tool-badge">⭐</span>
        <h4>{content.question || 'Rate this'}</h4>
      </div>

      {!submitted ? (
        <>
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`star ${star <= (hover || rating) ? 'filled' : ''}`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
              >
                ★
              </button>
            ))}
          </div>
          {rating > 0 && <p className="rating-text">{rating} / 5 stars</p>}
          <button
            type="button"
            className="quiz-submit-btn"
            onClick={handleSubmit}
            disabled={rating === 0}
          >
            Submit Rating
          </button>
        </>
      ) : (
        <div className="quiz-explanation">
          <strong>Thank you! You rated this {rating} / 5 stars</strong>
        </div>
      )}
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

    // Two Truths & Lie — 3 statements, find the lie
    case 'two_truths_lie':
      return (
        <TrueFalseCard
          content={{
            statements: (tool.content.statements || []).map((s) => ({
              text: s.text,
              answer: !s.isLie,
              explanation: s.explanation
            }))
          }}
          onSubmit={onSubmit}
        />
      );

    // Sequence — complete the pattern (rendered as quiz)
    case 'sequence':
      return <QuizCard content={tool.content} onSubmit={onSubmit} />;

    // Anagram — unscramble (rendered as riddle)
    case 'anagram':
      return (
        <RiddleCard
          content={{
            riddle: `Unscramble: "${tool.content.scrambled}"`,
            answer: tool.content.answer,
            hint: tool.content.hint,
            explanation: tool.content.explanation
          }}
          onSubmit={onSubmit}
        />
      );

    // Reorder — put words in correct order (rendered as fill blank)
    case 'reorder':
      return (
        <FillBlankCard
          content={{
            text: (tool.content.words || []).map((_, i) => `[BLANK${i + 1}]`).join(' '),
            answers: tool.content.words || [],
            explanation: tool.content.explanation || ''
          }}
          onSubmit={onSubmit}
        />
      );

    // New interactive tools
    case 'reflection':
      return <ReflectionCard content={tool.content} onSubmit={onSubmit} />;

    case 'progress':
      return <ProgressCard content={tool.content} onSubmit={onSubmit} />;

    case 'poll':
      return <PollCard content={tool.content} onSubmit={onSubmit} />;

    case 'word_of_day':
      return <WordOfDayCard content={tool.content} onSubmit={onSubmit} />;

    case 'code':
      return <CodeCard content={tool.content} onSubmit={onSubmit} />;

    case 'timeline':
      return <TimelineCard content={tool.content} onSubmit={onSubmit} />;

    case 'comparison':
      return <ComparisonCard content={tool.content} onSubmit={onSubmit} />;

    case 'checklist':
      return <ChecklistCard content={tool.content} onSubmit={onSubmit} />;

    case 'rating':
      return <RatingCard content={tool.content} onSubmit={onSubmit} />;

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

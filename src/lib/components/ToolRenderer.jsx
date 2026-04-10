import { useState } from 'react';

/**
 * Interactive Quiz Component — renders in chat as a card
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
 * Word Match Card — drag or click to match
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
 * Main Tool Renderer — dispatches to the right card type
 */
function ToolRenderer({ tool, onSubmit }) {
  switch (tool.tool) {
    case 'quiz':
    case 'story_quiz':
      return <QuizCard content={tool.content} onSubmit={onSubmit} />;
    case 'true_false':
      return <TrueFalseCard content={tool.content} onSubmit={onSubmit} />;
    case 'fill_blank':
      return <FillBlankCard content={tool.content} onSubmit={onSubmit} />;
    case 'word_match':
      return <WordMatchCard content={tool.content} onSubmit={onSubmit} />;
    default:
      return null;
  }
}

export default ToolRenderer;

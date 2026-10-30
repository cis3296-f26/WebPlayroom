import { useState, useEffect } from 'react'
import { QUESTIONS } from './countryQuestions'

const DIFFICULTY = {
  easy:   { label: 'Easy',   hint: true,  time: 0,  note: 'A hint' },
  medium: { label: 'Medium', hint: false, time: 40, note: '40 seconds per question' },
  hard:   { label: 'Hard',   hint: false, time: 20, note: '20 seconds per question' },
}

const TIMEOUT = '__timeout__'

const pageStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: '12px',
  margin: '0 auto',
  padding: '16px',
}

const rowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: '12px',
}

const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function CountryQuest() {
  const [difficulty, setDifficulty] = useState(null)
  const [round, setRound] = useState([])
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [hintShown, setHintShown] = useState(false)
  const [picked, setPicked] = useState(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [finished, setFinished] = useState(false)

  const start = (level) => {
    setDifficulty(level)
    setRound(shuffle(QUESTIONS[level]).map((q) => ({ ...q, options: shuffle(q.options) })))
    setIndex(0)
    setScore(0)
    setHintShown(false)
    setPicked(null)
    setTimeLeft(DIFFICULTY[level].time)
    setFinished(false)
  }

  const reset = () => setDifficulty(null)

  // countdown
  useEffect(() => {
    if (!difficulty || finished || picked !== null) return
    if (!DIFFICULTY[difficulty].time) return
    if (timeLeft <= 0) {
      setPicked(TIMEOUT)
      return
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearTimeout(id)
  }, [timeLeft, difficulty, finished, picked])

  const choose = (option) => {
    if (picked !== null) return
    setPicked(option)
    if (option === round[index].answer) setScore((s) => s + 1)
  }

  const next = () => {
    if (index + 1 === round.length) {
      setFinished(true)
    } else {
      setIndex(index + 1)
      setPicked(null)
      setHintShown(false)
      setTimeLeft(DIFFICULTY[difficulty].time)
    }
  }

  // difficulty
  if (!difficulty) {
    return (
      <div style={pageStyle}>
        <h1>CountryQuest</h1>
        <p>Choose your difficulty:</p>
        <div style={rowStyle}>
          {Object.entries(DIFFICULTY).map(([key, d]) => (
            <button key={key} className="game-button" onClick={() => start(key)}>
              {d.label}
              <br />
              <small>{d.note}</small>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // results
  if (finished) {
    return (
      <div style={pageStyle}>
        <h1>CountryQuest: {DIFFICULTY[difficulty].label}</h1>
        <h2>Score: {score} / {round.length}</h2>
        <div style={rowStyle}>
          <button className="game-button" onClick={() => start(difficulty)}>Play again</button>
          <button className="game-button" onClick={reset}>Change difficulty</button>
        </div>
      </div>
    )
  }

  // question
  const d = DIFFICULTY[difficulty]
  const q = round[index]
  const answered = picked !== null

  return (
    <div style={pageStyle}>
      <h1>CountryQuest: {d.label}</h1>
      <p>Question {index + 1} of {round.length} | Score: {score}</p>

      {d.time > 0 && (
        <h3 style={{ color: timeLeft <= 5 ? '#c62828' : 'inherit' }}>
          Time left: {timeLeft}s
        </h3>
      )}

      <h2>{q.prompt}</h2>

      <div style={rowStyle}>
        {q.options.map((opt) => {
          let style = {}
          if (answered) {
            if (opt === q.answer) style = { backgroundColor: '#2e7d32', color: 'white' }
            else if (opt === picked) style = { backgroundColor: '#c62828', color: 'white' }
          }
          return (
            <button
              key={opt}
              className="game-button"
              style={style}
              disabled={answered}
              onClick={() => choose(opt)}
            >
              {opt}
            </button>
          )
        })}
      </div>

      {d.hint && (
        <div>
          <button
            className="game-button"
            onClick={() => setHintShown(true)}
            disabled={hintShown || answered}
          >
            Show hint
          </button>
          {hintShown && <p><em>Hint: {q.hint}</em></p>}
        </div>
      )}

      {answered && (
        <p>
          {picked === TIMEOUT
            ? `Time's up! The answer is ${q.answer}.`
            : picked === q.answer
              ? 'Correct!'
              : `Not quite. The answer is ${q.answer}.`}
        </p>
      )}

      <div style={rowStyle}>
        {answered && (
          <button className="game-button" onClick={next}>
            {index + 1 === round.length ? 'See results' : 'Next question'}
          </button>
        )}
        <button className="game-button" onClick={reset}>Change difficulty</button>
      </div>
    </div>
  )
}

export default CountryQuest
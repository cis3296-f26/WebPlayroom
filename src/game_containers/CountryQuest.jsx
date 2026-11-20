import { useState, useEffect } from 'react'
import { QUESTIONS } from './countryQuestions'
import './CountryQuest.css'

const DIFFICULTY = {
  easy:   { label: 'Easy',   icon: '🌱', color: '#2e9e5b', hint: true,  time: 0,  note: '\nHints available' },
  medium: { label: 'Medium', icon: '⏱️', color: '#d9780f', hint: false, time: 40, note: '40 seconds per question' },
  hard:   { label: 'Hard',   icon: '⚡', color: '#d64545', hint: false, time: 20, note: '20 seconds per question' },
}

const TIMEOUT = '__timeout__'

const ROUND_SIZE = 5
const MAX_POINTS = 15
const STREAK_STEP = 0.1
const MAX_STREAK_STEPS = 4
const PERFECT_BONUS = 10
const MAX_TOTAL =
  MAX_POINTS * (ROUND_SIZE + (STREAK_STEP * (ROUND_SIZE - 1) * ROUND_SIZE) / 2) + PERFECT_BONUS

const fmt = (n) => Number(n.toFixed(1))

const pointsFor = (level, timeLeft) => {
  const limit = DIFFICULTY[level].time
  if (!limit) return MAX_POINTS
  return Math.max(1, Math.ceil((MAX_POINTS * timeLeft) / limit))
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
  const [streak, setStreak] = useState(0)
  const [streakTotal, setStreakTotal] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [lastPoints, setLastPoints] = useState(0)
  const [lastBonus, setLastBonus] = useState(0)
  const [hintShown, setHintShown] = useState(false)
  const [picked, setPicked] = useState(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [finished, setFinished] = useState(false)

  const start = (level) => {
    setDifficulty(level)
    setRound(
      shuffle(QUESTIONS[level])
        .slice(0, ROUND_SIZE)
        .map((q) => ({ ...q, options: shuffle(q.options) }))
    )
    setIndex(0)
    setScore(0)
    setStreak(0)
    setStreakTotal(0)
    setCorrectCount(0)
    setLastPoints(0)
    setLastBonus(0)
    setHintShown(false)
    setPicked(null)
    setTimeLeft(DIFFICULTY[level].time)
    setFinished(false)
  }

  const reset = () => setDifficulty(null)

  // Countdown
  useEffect(() => {
    if (!difficulty || finished || picked !== null) return
    if (!DIFFICULTY[difficulty].time) return
    if (timeLeft <= 0) {
      setPicked(TIMEOUT)
      setStreak(0)
      return
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearTimeout(id)
  }, [timeLeft, difficulty, finished, picked])

  const choose = (option) => {
    if (picked !== null) return
    setPicked(option)
    if (option === round[index].answer) {
      const base = pointsFor(difficulty, timeLeft)
      const bonus = base * STREAK_STEP * Math.min(streak, MAX_STREAK_STEPS)
      setScore((s) => s + base + bonus)
      setStreakTotal((t) => t + bonus)
      setCorrectCount((c) => c + 1)
      setStreak(streak + 1)
      setLastPoints(base)
      setLastBonus(bonus)
    } else {
      setStreak(0)
    }
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
      <div className="cq-page">
        <h1 className="cq-title">CountryQuest</h1>
        <p className="cq-subtitle">Choose your difficulty</p>
        <div className="cq-levels">
          {Object.entries(DIFFICULTY).map(([key, d]) => (
            <button
              key={key}
              className="cq-level"
              style={{ '--accent': d.color }}
              onClick={() => start(key)}
            >
              <span className="cq-level-icon">{d.icon}</span>
              <span className="cq-level-name">{d.label}</span>
              <span className="cq-level-note">{d.note}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const d = DIFFICULTY[difficulty]

  // results
  if (finished) {
    const perfect = correctCount === round.length ? PERFECT_BONUS : 0
    const total = score + perfect
    return (
      <div className="cq-page" style={{ '--accent': d.color }}>
        <div className="cq-card cq-results">
          <div className="cq-header">
            <span className="cq-badge">{d.icon} {d.label}</span>
          </div>
          <h1 className="cq-title">Round complete!</h1>
          <div className="cq-bigscore">{Math.round(total)} / {MAX_TOTAL}</div>
          <p>Correct answers: {correctCount} / {round.length}</p>
          <p>Answer points: {fmt(score - streakTotal)}</p>
          <p>Streak bonus: +{fmt(streakTotal)}</p>
          {perfect > 0 && <p><strong>Perfect round bonus: +{perfect}</strong></p>}
          <div className="cq-actions">
            <button className="cq-btn" onClick={() => start(difficulty)}>Play again</button>
            <button className="cq-btn secondary" onClick={reset}>Change difficulty</button>
          </div>
        </div>
      </div>
    )
  }

  // question
  const q = round[index]
  const answered = picked !== null

  return (
    <div className="cq-page" style={{ '--accent': d.color }}>
      <div className="cq-card">
        <div className="cq-header">
          <div className="cq-header-left">
            <span className="cq-badge">{d.icon} {d.label}</span>
            <span className="cq-progress">Question {index + 1} of {round.length}</span>
          </div>
          {d.time > 0 && (
            <div className={`cq-timer ${timeLeft <= 5 && !answered ? 'low' : ''}`}>
              ⏱ {timeLeft}s
            </div>
          )}
        </div>

        <div className="cq-stats">
          <span>Score: {Math.round(score)}</span>
          <span>Streak: {streak} 🔥</span>
          {!answered && <span>Worth: {pointsFor(difficulty, timeLeft)} pts</span>}
        </div>

        <h2 className="cq-prompt">{q.prompt}</h2>

        <div className="cq-answers">
          {q.options.map((opt) => {
            let cls = 'cq-answer'
            if (answered) {
              if (opt === q.answer) cls += ' correct'
              else if (opt === picked) cls += ' wrong'
              else cls += ' dim'
            }
            return (
              <button
                key={opt}
                className={cls}
                disabled={answered}
                onClick={() => choose(opt)}
              >
                {opt}
              </button>
            )
          })}
        </div>

        <div className="cq-feedback">
          {answered &&
            (picked === TIMEOUT
              ? `Time's up! The answer is ${q.answer}.`
              : picked === q.answer
                ? `Correct! +${lastPoints} points${lastBonus ? ` (+${fmt(lastBonus)} streak bonus)` : ''}`
                : `Not quite. The answer is ${q.answer}.`)}
        </div>

        {d.hint && !answered && (
          <div>
            <button
              className="cq-btn secondary small"
              onClick={() => setHintShown(true)}
              disabled={hintShown}
            >
              Show hint
            </button>
            {hintShown && <p className="cq-hint">Hint: {q.hint}</p>}
          </div>
        )}

        <div className="cq-actions">
          {answered && (
            <button className="cq-btn" onClick={next}>
              {index + 1 === round.length ? 'See results' : 'Next question'}
            </button>
          )}
          <button className="cq-btn secondary" onClick={reset}>Change difficulty</button>
        </div>
      </div>
    </div>
  )
}

export default CountryQuest
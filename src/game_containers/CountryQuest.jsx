import { useState } from 'react'

const DIFFICULTY = {
  easy:   { label: 'Easy',   choices: 4, hints: 0 },
  medium: { label: 'Medium', choices: 4, hints: 3 },
  hard:   { label: 'Hard',   choices: 4, hints: 1 },
}

const CountryQuest = () => {
  const [difficulty, setDifficulty] = useState(null)
  const settings = difficulty ? DIFFICULTY[difficulty] : null

  return (
    <div className="country-quest-game-container" style={{ background: '#344308', color: 'white' }}>
      <h3>Country Quest</h3>

      {!settings ? (
        <div>
          <p>Choose a difficulty:</p>
          <div className="hub-links">
            {Object.entries(DIFFICULTY).map(([key, d]) => (
              <button
                key={key}
                className="game-button"
                onClick={() => setDifficulty(key)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <p>Difficulty: {settings.label}</p>
          <p>Choices per question: {settings.choices}</p>
          <p>Hints available: {settings.hints}</p>
          <button className="game-button" onClick={() => setDifficulty(null)}>
            Change difficulty
          </button>
        </div>
      )}
    </div>
  )
}

export default CountryQuest

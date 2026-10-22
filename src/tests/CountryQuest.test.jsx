import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CountryQuest from '../game_containers/CountryQuest.jsx'

describe('Country Quest difficulty settings', () => {
  it('starts on the difficulty picker with Easy, Medium and Hard options', () => {
    render(<CountryQuest />)
    expect(screen.getByRole('heading', { name: 'Country Quest' })).toBeInTheDocument()
    expect(screen.getByText(/choose a difficulty/i)).toBeInTheDocument()
    const buttons = screen.getAllByRole('button')
    expect(buttons.map((b) => b.textContent)).toEqual(['Easy', 'Medium', 'Hard'])
  })

  it('does not show any game settings before a difficulty is chosen', () => {
    render(<CountryQuest />)
    expect(screen.queryByText(/^Difficulty:/)).not.toBeInTheDocument()
    expect(screen.queryByText(/hints available/i)).not.toBeInTheDocument()
  })

  it.each([
    { level: 'Easy', choices: 4, hints: 0 },
    { level: 'Medium', choices: 4, hints: 3 },
    { level: 'Hard', choices: 4, hints: 1 },
  ])('choosing $level shows $choices choices and $hints hints', async ({ level, choices, hints }) => {
    const user = userEvent.setup()
    render(<CountryQuest />)
    await user.click(screen.getByRole('button', { name: level }))

    expect(screen.getByText(`Difficulty: ${level}`)).toBeInTheDocument()
    expect(screen.getByText(`Choices per question: ${choices}`)).toBeInTheDocument()
    expect(screen.getByText(`Hints available: ${hints}`)).toBeInTheDocument()
    expect(screen.queryByText(/choose a difficulty/i)).not.toBeInTheDocument()
  })

  it('"Change difficulty" returns to the picker so a new level can be chosen', async () => {
    const user = userEvent.setup()
    render(<CountryQuest />)
    await user.click(screen.getByRole('button', { name: 'Hard' }))
    await user.click(screen.getByRole('button', { name: /change difficulty/i }))

    expect(screen.getByText(/choose a difficulty/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Easy' }))
    expect(screen.getByText('Difficulty: Easy')).toBeInTheDocument()
  })
})

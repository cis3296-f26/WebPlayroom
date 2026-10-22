import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import GameHub from '../GameHub.jsx'
import { renderWithRouter } from './renderWithRouter.jsx'

const GAMES = [
  { name: 'Snake', path: '/snake' },
  { name: '8-Ball Pool', path: '/pool' },
  { name: 'Connect 4', path: '/connect4' },
  { name: 'Buckshot Roulette Lite Plus', path: '/buckshotRouletteLitePlus' },
  { name: 'Country Quest', path: '/countryQuest' },
]

describe('GameHub (homepage)', () => {
  it('shows the welcome heading and instructions', () => {
    renderWithRouter(<GameHub />)
    expect(screen.getByRole('heading', { name: /welcome to webplayroom/i })).toBeInTheDocument()
    expect(screen.getByText(/choose a game to play/i)).toBeInTheDocument()
  })

  it('shows exactly one link for each of the five games', () => {
    renderWithRouter(<GameHub />)
    expect(screen.getAllByRole('link')).toHaveLength(GAMES.length)
  })

  it.each(GAMES)('links "$name" to $path', ({ name, path }) => {
    renderWithRouter(<GameHub />)
    expect(screen.getByRole('link', { name })).toHaveAttribute('href', path)
  })
})

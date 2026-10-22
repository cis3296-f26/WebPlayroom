import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Snake from '../game_containers/Snake.jsx'
import Pool from '../game_containers/Pool.jsx'
import Connect4 from '../game_containers/Connect4.jsx'
import BuckshotRouletteLitePlus from '../game_containers/BuckshotRouletteLitePlus.jsx'

const CONTAINERS = [
  { Component: Snake, title: 'Snake', className: 'snake-game-container' },
  { Component: Pool, title: '8-Ball Pool', className: 'pool-game-container' },
  { Component: Connect4, title: 'Connect 4', className: 'connect4-game-container' },
  { Component: BuckshotRouletteLitePlus, title: 'Buckshot Roulette Lite Plus', className: 'buckshot-roulette-game-container' },
]

describe('Game containers', () => {
  it.each(CONTAINERS)('$title renders its title inside its own container', ({ Component, title, className }) => {
    const { container } = render(<Component />)
    const heading = screen.getByRole('heading', { level: 3, name: title })
    expect(heading).toBeInTheDocument()
    expect(container.firstChild).toHaveClass(className)
    expect(container.firstChild).toContainElement(heading)
  })
})

import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App.jsx'
import { renderWithRouter } from './renderWithRouter.jsx'

const ROUTES = [
  { path: '/snake', title: 'Snake' },
  { path: '/pool', title: '8-Ball Pool' },
  { path: '/connect4', title: 'Connect 4' },
  { path: '/buckshotRouletteLitePlus', title: 'Buckshot Roulette Lite Plus' },
  { path: '/countryQuest', title: 'Country Quest' },
]

describe('App routing', () => {
  it('always shows the WebPlayroom logo in the navbar, linking home', () => {
    renderWithRouter(<App />, { route: '/snake' })
    const logo = screen.getByRole('link', { name: 'WebPlayroom' })
    expect(logo).toHaveAttribute('href', '/')
  })

  it('renders the homepage at "/"', () => {
    renderWithRouter(<App />)
    expect(screen.getByRole('heading', { name: /welcome to webplayroom/i })).toBeInTheDocument()
  })

  it.each(ROUTES)('renders the $title page at $path', ({ path, title }) => {
    renderWithRouter(<App />, { route: path })
    expect(screen.getByRole('heading', { level: 3, name: title })).toBeInTheDocument()
    // The game page replaces the homepage content
    expect(screen.queryByText(/choose a game to play/i)).not.toBeInTheDocument()
  })

  it('renders no game for an unknown route', () => {
    // React Router logs a "No routes matched" warning here, which is expected
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    renderWithRouter(<App />, { route: '/not-a-real-game' })
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument()
    expect(screen.queryByText(/choose a game to play/i)).not.toBeInTheDocument()
    warn.mockRestore()
  })

  it('navigates from the homepage to a game when its icon is clicked', async () => {
    const user = userEvent.setup()
    renderWithRouter(<App />)
    await user.click(screen.getByRole('link', { name: 'Connect 4' }))
    expect(screen.getByRole('heading', { level: 3, name: 'Connect 4' })).toBeInTheDocument()
  })

  it('returns to the homepage when the logo is clicked from a game', async () => {
    const user = userEvent.setup()
    renderWithRouter(<App />, { route: '/pool' })
    await user.click(screen.getByRole('link', { name: 'WebPlayroom' }))
    expect(screen.getByRole('heading', { name: /welcome to webplayroom/i })).toBeInTheDocument()
  })
})

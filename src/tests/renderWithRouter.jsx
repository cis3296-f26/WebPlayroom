import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Renders a component inside an in-memory router starting at the given path
export function renderWithRouter(ui, { route = '/' } = {}) {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>)
}

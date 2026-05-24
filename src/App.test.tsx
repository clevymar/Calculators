import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders exactly four stack rows', () => {
    render(<App />);

    expect(screen.getByText('4:')).toBeInTheDocument();
    expect(screen.getByText('3:')).toBeInTheDocument();
    expect(screen.getByText('2:')).toBeInTheDocument();
    expect(screen.getByText('1:')).toBeInTheDocument();
  });

  it('dispatches button clicks to the calculator engine', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '3' }));
    await user.click(screen.getAllByRole('button', { name: 'ENTER' })[0]);
    await user.click(screen.getByRole('button', { name: '4' }));
    await user.click(screen.getAllByRole('button', { name: '+' })[0]);

    expect(screen.getByRole('status')).toHaveTextContent('X = 7');
  });
});

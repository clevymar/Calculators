import { describe, expect, it } from 'vitest';
import { CalculatorKey, createInitialState, dispatchKey, getVisibleStack } from './calculatorEngine';

function press(keys: CalculatorKey[]) {
  return keys.reduce((state, key) => dispatchKey(state, key), createInitialState());
}

describe('calculatorEngine', () => {
  it('performs basic RPN arithmetic', () => {
    const state = press(['3', 'ENTER', '4', '+']);

    expect(state.stack[0]).toBe(7);
  });

  it('preserves at least 12 stack levels', () => {
    const keys: CalculatorKey[] = [];

    for (let value = 1; value <= 12; value += 1) {
      for (const digit of String(value)) {
        keys.push(digit as CalculatorKey);
      }
      if (value < 12) keys.push('ENTER');
    }

    const state = press(keys);

    expect(state.stack).toHaveLength(12);
    expect(state.stack[0]).toBe(12);
    expect(state.stack[11]).toBe(1);
  });

  it('renders exactly the top four stack rows with HP-48S labels', () => {
    const state = press(['1', 'ENTER', '2', 'ENTER', '3', 'ENTER', '4']);

    expect(getVisibleStack(state)).toEqual([
      { label: 4, value: '1' },
      { label: 3, value: '2' },
      { label: 2, value: '3' },
      { label: 1, value: '4' }
    ]);
  });

  it('drops, swaps, and rolls a deep stack without losing hidden values', () => {
    const base = press(['1', 'ENTER', '2', 'ENTER', '3', 'ENTER', '4']);
    const swapped = dispatchKey(base, 'SWAP');
    const rolled = dispatchKey(swapped, 'ROLL_DOWN');
    const dropped = dispatchKey(rolled, 'DROP');

    expect(swapped.stack.slice(0, 4)).toEqual([3, 4, 2, 1]);
    expect(rolled.stack.slice(0, 4)).toEqual([1, 3, 4, 2]);
    expect(dropped.stack.slice(0, 3)).toEqual([3, 4, 2]);
  });

  it('calculates scientific functions using angle mode', () => {
    const deg = press(['3', '0', 'SIN']);
    const rad = press(['RAD', '1', 'SIN']);

    expect(deg.stack[0]).toBeCloseTo(0.5);
    expect(rad.stack[0]).toBeCloseTo(Math.sin(1));
  });

  it('does not corrupt stack on calculation error', () => {
    const state = press(['9', 'CHS', 'SQRT']);

    expect(state.error).toBe('Invalid sqrt');
    expect(state.stack[0]).toBe(-9);
  });
});

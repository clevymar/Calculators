import { useEffect, useMemo, useReducer } from 'react';
import { ArrowDownUp, Delete, RotateCcw } from 'lucide-react';
import {
  CalculatorKey,
  CalculatorState,
  createInitialState,
  dispatchKey,
  formatNumber,
  getVisibleStack
} from './calculatorEngine';

interface KeyButton {
  label: string;
  keyId: CalculatorKey;
  variant?: 'number' | 'operator' | 'function' | 'control' | 'wide';
  title?: string;
}

const storageKey = 'hp48s-rpn-calculator-state';

const keyRows: KeyButton[][] = [
  [
    { label: 'SIN', keyId: 'SIN', variant: 'function' },
    { label: 'COS', keyId: 'COS', variant: 'function' },
    { label: 'TAN', keyId: 'TAN', variant: 'function' },
    { label: 'RAD', keyId: 'RAD', variant: 'control' },
    { label: 'DEG', keyId: 'DEG', variant: 'control' },
    { label: 'CLR', keyId: 'CLEAR', variant: 'control', title: 'Clear' }
  ],
  [
    { label: 'ASIN', keyId: 'ASIN', variant: 'function' },
    { label: 'ACOS', keyId: 'ACOS', variant: 'function' },
    { label: 'ATAN', keyId: 'ATAN', variant: 'function' },
    { label: 'LN', keyId: 'LN', variant: 'function' },
    { label: 'LOG', keyId: 'LOG', variant: 'function' },
    { label: '1/x', keyId: 'RECIP', variant: 'function' }
  ],
  [
    { label: 'x^2', keyId: 'SQUARE', variant: 'function' },
    { label: 'SQRT', keyId: 'SQRT', variant: 'function' },
    { label: 'y^x', keyId: 'POW', variant: 'function' },
    { label: 'e^x', keyId: 'EXP', variant: 'function' },
    { label: '10^x', keyId: 'TENX', variant: 'function' },
    { label: 'n!', keyId: 'FACT', variant: 'function' }
  ],
  [
    { label: 'ROLL UP', keyId: 'ROLL_UP', variant: 'control' },
    { label: 'ROLL DN', keyId: 'ROLL_DOWN', variant: 'control' },
    { label: 'SWAP', keyId: 'SWAP', variant: 'control' },
    { label: 'DROP', keyId: 'DROP', variant: 'control' },
    { label: 'STO', keyId: 'STO', variant: 'control' },
    { label: 'RCL', keyId: 'RCL', variant: 'control' }
  ],
  [
    { label: '7', keyId: '7', variant: 'number' },
    { label: '8', keyId: '8', variant: 'number' },
    { label: '9', keyId: '9', variant: 'number' },
    { label: '/', keyId: '/', variant: 'operator' },
    { label: 'DEL', keyId: 'BACKSPACE', variant: 'control', title: 'Backspace' },
    { label: 'CHS', keyId: 'CHS', variant: 'control', title: 'Change sign' }
  ],
  [
    { label: '4', keyId: '4', variant: 'number' },
    { label: '5', keyId: '5', variant: 'number' },
    { label: '6', keyId: '6', variant: 'number' },
    { label: '*', keyId: '*', variant: 'operator' },
    { label: 'ENTER', keyId: 'ENTER', variant: 'wide' }
  ],
  [
    { label: '1', keyId: '1', variant: 'number' },
    { label: '2', keyId: '2', variant: 'number' },
    { label: '3', keyId: '3', variant: 'number' },
    { label: '-', keyId: '-', variant: 'operator' },
    { label: '.', keyId: '.', variant: 'number' },
    { label: '+', keyId: '+', variant: 'operator' }
  ],
  [
    { label: '0', keyId: '0', variant: 'number' },
    { label: '00', keyId: '0', variant: 'number' },
    { label: 'ENTER', keyId: 'ENTER', variant: 'wide' },
    { label: '+', keyId: '+', variant: 'operator' }
  ]
];

function loadInitialState(): CalculatorState {
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return createInitialState();
    return { ...createInitialState(), ...JSON.parse(saved), pendingRegisterAction: null, entry: null };
  } catch {
    return createInitialState();
  }
}

function reducer(state: CalculatorState, key: CalculatorKey): CalculatorState {
  return dispatchKey(state, key);
}

export function App() {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState);
  const visibleStack = useMemo(() => getVisibleStack(state), [state]);

  useEffect(() => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        stack: state.stack,
        angleMode: state.angleMode,
        registers: state.registers,
        visibleStackDepth: state.visibleStackDepth,
        maxStackDepth: state.maxStackDepth,
        liftOnCommit: state.liftOnCommit
      })
    );
  }, [state]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mapped = mapKeyboardEvent(event);
      if (!mapped) return;
      event.preventDefault();
      dispatch(mapped);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <main className="app-shell">
      <section className="calculator" aria-label="HP-48S style RPN calculator">
        <div className="brand-row">
          <div>
            <p className="eyebrow">Scientific RPN</p>
            <h1>48S Stack</h1>
          </div>
          <div className="mode-pill" aria-label={`Angle mode ${state.angleMode}`}>
            {state.angleMode}
          </div>
        </div>

        <div className="display" aria-label="Stack display">
          <div className="status-line">
            <span>{state.pendingRegisterAction ? `${state.pendingRegisterAction} _` : 'READY'}</span>
            <span>DEPTH {state.stack.length}/{state.maxStackDepth}</span>
          </div>
          <div className="stack-lines">
            {visibleStack.map((row) => (
              <div className="stack-row" key={row.label}>
                <span className="stack-label">{row.label}:</span>
                <span className="stack-value">{row.value}</span>
              </div>
            ))}
          </div>
          <div className="message-line" role="status">
            {state.error ?? `X = ${formatNumber(state.stack[0] ?? 0)}`}
          </div>
        </div>

        <div className="keypad" aria-label="Calculator keypad">
          {keyRows.flatMap((row, rowIndex) =>
            row.map((button, buttonIndex) => (
              <button
                className={`key key-${button.variant ?? 'function'}`}
                key={`${rowIndex}-${buttonIndex}-${button.label}`}
                onClick={() => dispatch(button.keyId)}
                title={button.title ?? button.label}
                type="button"
              >
                {iconFor(button.keyId)}
                <span>{button.label}</span>
              </button>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

function mapKeyboardEvent(event: KeyboardEvent): CalculatorKey | null {
  if (/^[0-9]$/.test(event.key)) return event.key as CalculatorKey;

  const lower = event.key.toLowerCase();
  const shortcuts: Record<string, CalculatorKey> = {
    '.': '.',
    enter: 'ENTER',
    backspace: 'BACKSPACE',
    delete: 'DROP',
    escape: 'CLEAR',
    '+': '+',
    '-': '-',
    '*': '*',
    x: '*',
    '/': '/',
    '^': 'POW',
    s: 'SIN',
    c: 'COS',
    t: 'TAN',
    l: 'LN',
    r: 'SQRT',
    d: 'DROP'
  };

  return shortcuts[lower] ?? null;
}

function iconFor(keyId: CalculatorKey) {
  if (keyId === 'BACKSPACE') return <Delete aria-hidden="true" size={16} />;
  if (keyId === 'CLEAR') return <RotateCcw aria-hidden="true" size={16} />;
  if (keyId === 'SWAP') return <ArrowDownUp aria-hidden="true" size={16} />;
  return null;
}

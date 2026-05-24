export type AngleMode = 'DEG' | 'RAD';

export type CalculatorKey =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '.'
  | 'ENTER'
  | 'BACKSPACE'
  | 'CHS'
  | 'DROP'
  | 'SWAP'
  | 'ROLL_UP'
  | 'ROLL_DOWN'
  | 'CLEAR'
  | '+'
  | '-'
  | '*'
  | '/'
  | 'POW'
  | 'SQRT'
  | 'SQUARE'
  | 'RECIP'
  | 'SIN'
  | 'COS'
  | 'TAN'
  | 'ASIN'
  | 'ACOS'
  | 'ATAN'
  | 'LN'
  | 'LOG'
  | 'EXP'
  | 'TENX'
  | 'FACT'
  | 'DEG'
  | 'RAD'
  | 'STO'
  | 'RCL';

export interface CalculatorState {
  stack: number[];
  entry: string | null;
  angleMode: AngleMode;
  registers: Record<number, number>;
  error: string | null;
  visibleStackDepth: number;
  maxStackDepth: number;
  pendingRegisterAction: 'STO' | 'RCL' | null;
  liftOnCommit: boolean;
}

const DEFAULT_MAX_STACK_DEPTH = 12;
const DEFAULT_VISIBLE_STACK_DEPTH = 4;

const isDigit = (key: CalculatorKey): key is Extract<CalculatorKey, `${number}`> =>
  /^[0-9]$/.test(key);

export function createInitialState(): CalculatorState {
  return {
    stack: [0],
    entry: null,
    angleMode: 'DEG',
    registers: {},
    error: null,
    visibleStackDepth: DEFAULT_VISIBLE_STACK_DEPTH,
    maxStackDepth: DEFAULT_MAX_STACK_DEPTH,
    pendingRegisterAction: null,
    liftOnCommit: false
  };
}

export function dispatchKey(state: CalculatorState, key: CalculatorKey): CalculatorState {
  if (isDigit(key) && state.pendingRegisterAction) {
    return applyRegisterAction(clearError(state), Number(key));
  }

  if (key === 'STO' || key === 'RCL') {
    return { ...clearError(commitEntry(state)), pendingRegisterAction: key };
  }

  if (key !== 'BACKSPACE' && key !== 'CHS' && key !== '.' && !isDigit(key)) {
    state = commitEntry(state);
  }

  state = key === 'CLEAR' ? state : clearError({ ...state, pendingRegisterAction: null });

  if (isDigit(key)) return appendDigit(state, key);

  switch (key) {
    case '.':
      return appendDecimal(state);
    case 'ENTER':
      return enter(state);
    case 'BACKSPACE':
      return backspace(state);
    case 'CHS':
      return changeSign(state);
    case 'DROP':
      return drop(state);
    case 'SWAP':
      return swap(state);
    case 'ROLL_UP':
      return rollUp(state);
    case 'ROLL_DOWN':
      return rollDown(state);
    case 'CLEAR':
      return createInitialState();
    case '+':
      return binary(state, (y, x) => y + x);
    case '-':
      return binary(state, (y, x) => y - x);
    case '*':
      return binary(state, (y, x) => y * x);
    case '/':
      return binary(state, (y, x) => (x === 0 ? fail('Divide by zero') : y / x));
    case 'POW':
      return binary(state, (y, x) => Math.pow(y, x));
    case 'SQRT':
      return unary(state, (x) => (x < 0 ? fail('Invalid sqrt') : Math.sqrt(x)));
    case 'SQUARE':
      return unary(state, (x) => x * x);
    case 'RECIP':
      return unary(state, (x) => (x === 0 ? fail('Divide by zero') : 1 / x));
    case 'SIN':
      return unary(state, (x) => Math.sin(toRadians(state, x)));
    case 'COS':
      return unary(state, (x) => Math.cos(toRadians(state, x)));
    case 'TAN':
      return unary(state, (x) => Math.tan(toRadians(state, x)));
    case 'ASIN':
      return unary(state, (x) => (Math.abs(x) > 1 ? fail('Invalid asin') : fromRadians(state, Math.asin(x))));
    case 'ACOS':
      return unary(state, (x) => (Math.abs(x) > 1 ? fail('Invalid acos') : fromRadians(state, Math.acos(x))));
    case 'ATAN':
      return unary(state, (x) => fromRadians(state, Math.atan(x)));
    case 'LN':
      return unary(state, (x) => (x <= 0 ? fail('Invalid ln') : Math.log(x)));
    case 'LOG':
      return unary(state, (x) => (x <= 0 ? fail('Invalid log') : Math.log10(x)));
    case 'EXP':
      return unary(state, (x) => Math.exp(x));
    case 'TENX':
      return unary(state, (x) => Math.pow(10, x));
    case 'FACT':
      return unary(state, factorial);
    case 'DEG':
      return { ...state, angleMode: 'DEG' };
    case 'RAD':
      return { ...state, angleMode: 'RAD' };
    default:
      return state;
  }
}

export function getVisibleStack(state: CalculatorState): Array<{ label: number; value: string }> {
  const values = getDisplayStack(state);
  const rows: Array<{ label: number; value: string }> = [];

  for (let label = state.visibleStackDepth; label >= 1; label -= 1) {
    const index = label - 1;
    rows.push({ label, value: formatNumber(values[index] ?? 0) });
  }

  if (state.entry !== null) {
    rows[rows.length - 1] = { label: 1, value: state.entry };
  }

  return rows;
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  if (Object.is(value, -0)) return '0';
  const rounded = Math.abs(value) < 1e-12 ? 0 : value;
  return Number(rounded.toPrecision(12)).toString();
}

function appendDigit(state: CalculatorState, digit: string): CalculatorState {
  let entry = `${state.entry ?? ''}${digit}`;
  if (state.entry === '0') entry = digit;
  if (state.entry === '-0') entry = `-${digit}`;
  return updateEntry(state, entry);
}

function appendDecimal(state: CalculatorState): CalculatorState {
  if (state.entry?.includes('.')) return state;
  return updateEntry(state, `${state.entry ?? '0'}.`);
}

function backspace(state: CalculatorState): CalculatorState {
  if (state.pendingRegisterAction) return { ...state, pendingRegisterAction: null };
  if (state.entry === null) return state;
  const next = state.entry.slice(0, -1);
  return updateEntry(state, next === '' || next === '-' ? null : next);
}

function changeSign(state: CalculatorState): CalculatorState {
  if (state.entry !== null) {
    return updateEntry(state, state.entry.startsWith('-') ? state.entry.slice(1) : `-${state.entry}`);
  }

  const [x, ...rest] = state.stack;
  return { ...state, stack: normalizeStack([-x, ...rest], state.maxStackDepth) };
}

function enter(state: CalculatorState): CalculatorState {
  const committed = commitEntry(state);
  const x = committed.stack[0] ?? 0;
  return {
    ...committed,
    stack: normalizeStack([x, ...committed.stack], committed.maxStackDepth),
    entry: null,
    liftOnCommit: false
  };
}

function drop(state: CalculatorState): CalculatorState {
  const [, ...rest] = state.stack;
  return { ...state, stack: normalizeStack(rest.length ? rest : [0], state.maxStackDepth), entry: null, liftOnCommit: true };
}

function swap(state: CalculatorState): CalculatorState {
  const stack = [...state.stack];
  const x = stack[0] ?? 0;
  stack[0] = stack[1] ?? 0;
  stack[1] = x;
  return { ...state, stack: normalizeStack(stack, state.maxStackDepth), entry: null, liftOnCommit: true };
}

function rollUp(state: CalculatorState): CalculatorState {
  if (state.stack.length < 2) return state;
  const [x, ...rest] = state.stack;
  return { ...state, stack: normalizeStack([...rest, x], state.maxStackDepth), entry: null, liftOnCommit: true };
}

function rollDown(state: CalculatorState): CalculatorState {
  if (state.stack.length < 2) return state;
  const stack = [...state.stack];
  const last = stack.pop() ?? 0;
  return { ...state, stack: normalizeStack([last, ...stack], state.maxStackDepth), entry: null, liftOnCommit: true };
}

function unary(state: CalculatorState, operation: (x: number) => number | CalculationFailure): CalculatorState {
  const x = state.stack[0] ?? 0;
  const result = operation(x);
  if (isFailure(result)) return { ...state, error: result.message };
  return {
    ...state,
    stack: normalizeStack([result, ...state.stack.slice(1)], state.maxStackDepth),
    entry: null,
    liftOnCommit: true
  };
}

function binary(state: CalculatorState, operation: (y: number, x: number) => number | CalculationFailure): CalculatorState {
  const [x = 0, y = 0, ...rest] = state.stack;
  const result = operation(y, x);
  if (isFailure(result)) return { ...state, error: result.message };
  return { ...state, stack: normalizeStack([result, ...rest], state.maxStackDepth), entry: null, liftOnCommit: true };
}

function commitEntry(state: CalculatorState): CalculatorState {
  if (state.entry === null) return state;
  const parsed = Number(state.entry);
  if (!Number.isFinite(parsed)) return { ...state, entry: null, error: 'Invalid number' };
  return { ...state, stack: normalizeStack([parsed, ...state.stack.slice(1)], state.maxStackDepth), entry: null, liftOnCommit: false };
}

function applyRegisterAction(state: CalculatorState, register: number): CalculatorState {
  if (state.pendingRegisterAction === 'STO') {
    return {
      ...state,
      registers: { ...state.registers, [register]: state.stack[0] ?? 0 },
      pendingRegisterAction: null,
      liftOnCommit: true
    };
  }

  if (state.pendingRegisterAction === 'RCL') {
    return {
      ...state,
      stack: normalizeStack([state.registers[register] ?? 0, ...state.stack], state.maxStackDepth),
      pendingRegisterAction: null,
      liftOnCommit: true
    };
  }

  return state;
}

function getDisplayStack(state: CalculatorState): number[] {
  return state.stack;
}

function updateEntry(state: CalculatorState, entry: string | null): CalculatorState {
  const parsed = entry === null ? 0 : Number(entry);
  const x = Number.isFinite(parsed) ? parsed : 0;
  const stack =
    state.entry === null && state.liftOnCommit
      ? [x, ...state.stack]
      : [x, ...state.stack.slice(1)];

  return {
    ...state,
    entry,
    stack: normalizeStack(stack, state.maxStackDepth),
    liftOnCommit: false
  };
}

function normalizeStack(stack: number[], maxDepth: number): number[] {
  const normalized = stack.length ? stack : [0];
  return normalized.slice(0, Math.max(DEFAULT_MAX_STACK_DEPTH, maxDepth));
}

function clearError(state: CalculatorState): CalculatorState {
  return { ...state, error: null };
}

function toRadians(state: CalculatorState, value: number): number {
  return state.angleMode === 'DEG' ? (value * Math.PI) / 180 : value;
}

function fromRadians(state: CalculatorState, value: number): number {
  return state.angleMode === 'DEG' ? (value * 180) / Math.PI : value;
}

interface CalculationFailure {
  message: string;
}

function fail(message: string): CalculationFailure {
  return { message };
}

function isFailure(value: number | CalculationFailure): value is CalculationFailure {
  return typeof value === 'object';
}

function factorial(value: number): number | CalculationFailure {
  if (!Number.isInteger(value) || value < 0) return fail('Invalid factorial');
  if (value > 170) return fail('Overflow');
  let result = 1;
  for (let factor = 2; factor <= value; factor += 1) {
    result *= factor;
  }
  return result;
}

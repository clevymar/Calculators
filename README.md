# HP-48S Style RPN Calculator

A web-based scientific Reverse Polish Notation calculator inspired by the HP-48S stack display.

The app is a static Progressive Web App, so it runs entirely in the browser, can be used offline after loading, and can be installed from a mobile or desktop browser.

## Main Features

- HP-48S-style four-line stack display showing levels `4:`, `3:`, `2:`, and `1:`.
- Extended RPN stack with a default depth of 12 levels.
- Scientific calculator operations:
  - Arithmetic: `+`, `-`, `*`, `/`, `y^x`
  - Functions: `sin`, `cos`, `tan`, inverse trig, `ln`, `log`, `sqrt`, `x^2`, `1/x`, `e^x`, `10^x`, factorial
  - Angle modes: `DEG` and `RAD`
- Stack controls:
  - `ENTER`
  - `DROP`
  - `SWAP`
  - `ROLL UP`
  - `ROLL DN`
- Memory registers:
  - `STO`
  - `RCL`
- Keyboard input support for common calculator actions.
- Local persistence for stack, angle mode, registers, and calculator state.
- Installable/offline PWA build.

## Architecture

The app is split into two main layers:

- `src/calculatorEngine.ts`
  - Pure TypeScript calculator logic.
  - Owns stack behavior, numeric entry, scientific operations, angle mode, registers, and error handling.
  - Exposes a simple command-style API through `dispatchKey(...)`.

- `src/App.tsx`
  - React user interface.
  - Renders the stack display and keypad.
  - Dispatches button clicks and keyboard shortcuts into the calculator engine.

This separation keeps the calculator behavior testable without a browser and keeps the UI focused on rendering and interaction.

## Why TypeScript, React, and Vite?

### TypeScript

TypeScript was chosen because calculator state has several important moving parts: stack values, active entry, angle mode, registers, pending register actions, and error states. Strong types make those state transitions safer and easier to change.

It also makes the command interface explicit through the `CalculatorKey` type, which helps prevent invalid keypad commands from creeping into the UI.

### React

React is a good fit because the calculator is an interactive state-driven interface. The display, keypad, status line, and error message all derive from a single calculator state object.

The UI does not perform calculator math directly. It simply renders state and dispatches key commands, which keeps the component structure simple.

### Vite

Vite keeps the project lightweight and fast to run locally. It provides:

- Fast development server
- Simple TypeScript support
- Production bundling
- Easy integration with React and PWA tooling

### PWA

The app uses `vite-plugin-pwa` so it can behave like a small installable calculator app rather than only a web page. The production build generates a service worker and manifest, allowing offline use after the first load.

## Project Commands

Install dependencies:

```powershell
npm install
```

Run locally on this PC:

```powershell
npm run dev
```

Open:

```text
http://127.0.0.1:5175/
```

Run on the local network for phone testing:

```powershell
npm run dev:lan
```

Then open the PC's local IP address from another device on the same Wi-Fi:

```text
http://YOUR-PC-IP:5175/
```

Build the production PWA:

```powershell
npm run build
```

Preview the production build on the local network:

```powershell
npm run preview:lan
```

Run tests:

```powershell
npm test
```

## Testing

The project uses Vitest and React Testing Library.

Current tests cover:

- Basic RPN arithmetic.
- Stack depth and hidden stack preservation.
- Four-level visible stack rendering.
- Stack operations such as `DROP`, `SWAP`, and roll behavior.
- Scientific functions in degree and radian modes.
- Error handling without corrupting the stack.
- Basic UI button dispatch.

## Notes

This is an HP-48S-style calculator, not a complete HP-48S emulator. It focuses on the stack-display experience and scientific RPN workflow rather than full symbolic algebra, graphing, programming, or RPL object support.

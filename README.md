# StepThrough – Interactive Computer Science Simulators

**StepThrough** is a lightweight, responsive web application featuring three interactive, step-by-step simulators:
1. **CPU Cache Simulator** (16-bit address slicing, associativity, LRU/FIFO, and 3C miss classification)
2. **TCP Congestion Control** (Tahoe vs. Reno, AIMD, fast retransmit, and fast recovery)
3. **5-Stage CPU Pipeline Hazards** (MIPS instruction parser, RAW & load-use hazards, forwarding, and stall bubbles)

The project is designed to help students, developers, and interviewees open any module and intuitively understand the underlying hardware or networking concept in under 60 seconds.

---

## Screenshots

> _Screenshot placeholders for portfolio showcases and documentation:_

| Cache Simulator | TCP Congestion Control |
| :---: | :---: |
| ![Cache Simulator Screenshot](docs/screenshots/cache.png) | ![TCP Congestion Control Screenshot](docs/screenshots/tcp.png) |

| 5-Stage CPU Pipeline | Dark Mode UI |
| :---: | :---: |
| ![5-Stage CPU Pipeline Screenshot](docs/screenshots/pipeline.png) | ![Dark Mode Screenshot](docs/screenshots/darkmode.png) |

---

## Features

### Module 1: CPU Cache Simulator
- **Configurable Hierarchy**: Cache sizes (32B – 256B), block sizes (4B – 16B), associativity (Direct-Mapped, 2-Way, 4-Way, Fully Associative), and replacement policies (LRU, FIFO).
- **Address Bit Slicing**: Dynamically computes bit boundaries for `TAG`, `INDEX`, and `OFFSET`, coloring the 16-bit binary representation in real time.
- **Visual Cache Table**: Inspect valid bits and hexadecimal tags for every set and way, with hit (green) and miss (red) cell highlights.
- **3C Miss Categorization**: Accurately classifies misses into **Compulsory (Cold)**, **Capacity**, and **Conflict** misses using an auxiliary fully-associative reference cache.
- **Compare Mode**: Runs the same trace on Direct-Mapped and 4-Way set-associative configurations side by side to compare hit rates.
- **Presets & Traces**: Built-in sample traces for Sequential access, Repeated Loops, Conflict Thrashing, and Random addresses.

### Module 2: TCP Congestion Control
- **Protocol Variants**: Full support for both **TCP Tahoe** and **TCP Reno**.
- **Dynamic Phases**: Visualizes **Slow Start** (exponential doubling), **Congestion Avoidance** (linear AIMD increase), **Fast Retransmit**, and **Fast Recovery**.
- **Packet Visualizer**: Renders packets transmitted in the current RTT round with lost packets highlighted in red.
- **Loss Injection**: Add or remove packet loss events (3 duplicate ACKs or severe timeouts) at any round.
- **Recharts Visualization**: Interactive cwnd graph with `ssthresh` dashed threshold line and current round scrub indicator.
- **Compare Mode**: Overlays Tahoe and Reno curves on the exact same loss events in a single chart.

### Module 3: 5-Stage CPU Pipeline Hazards
- **5-Stage Execution**: Models `IF` (Instruction Fetch), `ID` (Instruction Decode), `EX` (Execute), `MEM` (Memory Access), and `WB` (Write Back).
- **MIPS Instruction Parser**: Supports `add`, `sub`, `and`, `or`, `addi`, `lw`, `sw`, and `beq`.
- **Hazard Handling**:
  - Detects **RAW (Read-After-Write)** dependencies.
  - Inserts stall bubbles when hazards occur.
  - Models **Load-Use hazards** (requiring 1 stall cycle even with forwarding).
  - Models branch hazards (2-cycle branch penalty).
- **Data Forwarding Toggle**: Switch forwarding ON/OFF to witness how ALU bypass multiplexers eliminate RAW stalls.
- **Pipeline Grid Table**: Displays instructions as rows and clock cycles as columns, with colorful stage pills, stall bubbles, and cycle explanations.
- **Performance Metrics**: Calculates Total Clock Cycles, Stalls, and CPI (Cycles Per Instruction).

### Shared UX & Controls
- **VCR Controls**: Step Back, Step Forward, Play/Pause, Reset, and playback speed (0.5x, 1x, 2x).
- **Keyboard Shortcuts**: `Space` toggles Play/Pause; `Left Arrow` / `Right Arrow` steps backward and forward.
- **Plain English Explanations**: Every step across all three modules explains what just happened and why.
- **Learn & Interview Prep**: Each module includes a core theory overview and 4 common technical interview questions with concise answers.
- **Dark/Light Mode**: Full dark and light theme toggle with system preference detection.

---

## Tech Stack

- **Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Tooling**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Routing**: [React Router v6](https://reactrouter.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Testing**: [Vitest](https://vitest.dev/)

No heavy state management libraries (Redux, Zustand) or unnecessary abstractions were used. State is kept lean using standard `useState` and `useMemo` hooks.

---

## Architecture & Design Decisions

The application follows a clean separation of concerns:
1. **Engines (`/src/engines`)**: Pure TypeScript simulation engines with **zero React dependencies**. Each engine computes the entire simulation up front and returns an array of discrete steps.
2. **State & Scrubbing**: The UI simply tracks a `currentStep` index (`0` to `N-1`). Stepping forward is `currentStep + 1`, stepping backward is `currentStep - 1`, and Reset is `0`.
3. **Components (`/src/components`)**: Reusable, small UI widgets (`Controls`, `Navbar`, `LearnSection`, visualizer tables, and charts).
4. **Pages (`/src/pages`)**: Clean layout pages connecting engines, inputs, and visual views.

---

## Assumptions & Simplifications

- **Cache Write Policy**: Simplified to treat all accesses as reads. This isolates the core mechanics of address indexing, tag comparison, and cache block replacement without complicating the UI with dirty-bit write-back buffering.
- **3C Miss Categorization**: Calculated according to the standard Hennessy & Patterson definition:
  - *Compulsory*: The first time a block is accessed.
  - *Capacity*: Misses that would still occur in an ideal fully-associative cache of the same total capacity using LRU.
  - *Conflict*: Misses that occur in set-associative or direct-mapped caches that would not have missed in a fully-associative cache of equal capacity.
- **Branch Hazards in Pipeline**: Branches (`beq`) insert a fixed 2-cycle stall penalty, reflecting a simple MIPS pipeline where branch outcomes are resolved in the EX/MEM stage without speculative branch prediction hardware.
- **Split Register File**: Assumes split-phase register access where registers are written during the first half of the clock cycle in `WB` and read during the second half of the cycle in `ID`.
- **TCP Rounds**: TCP dynamics are modeled on discrete RTT (Round Trip Time) intervals rather than continuous packet timestamps, which matches standard computer networking textbook pedagogical models.

---

## Project Structure

```text
StepThrough/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── vercel.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── components/
│   │   ├── Controls.tsx
│   │   ├── Navbar.tsx
│   │   ├── LearnSection.tsx
│   │   ├── cache/
│   │   │   ├── AddressBitsView.tsx
│   │   │   └── CacheTableView.tsx
│   │   ├── tcp/
│   │   │   ├── PacketVisualizer.tsx
│   │   │   └── TcpChart.tsx
│   │   └── pipeline/
│   │       └── PipelineGrid.tsx
│   ├── engines/
│   │   ├── cacheEngine.ts
│   │   ├── tcpEngine.ts
│   │   └── pipelineEngine.ts
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── CachePage.tsx
│   │   ├── TcpPage.tsx
│   │   └── PipelinePage.tsx
│   └── tests/
│       ├── cacheEngine.test.ts
│       ├── tcpEngine.test.ts
│       └── pipelineEngine.test.ts
└── docs/
    └── screenshots/
```

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or pnpm

### Installation
```bash
git clone <repo-url>
cd StepThrough
npm install
```

### Running Locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Running Unit Tests
```bash
npm test
```
Runs the 16 unit tests across `cacheEngine`, `tcpEngine`, and `pipelineEngine` using Vitest.

### Linting
```bash
npm run lint
```

### Production Build
```bash
npm run build
```

---

## What I Learned

1. **Separating Simulation Logic from View State**: Writing the simulation engines as pure TypeScript functions decoupled from React made unit testing trivial and eliminated UI re-rendering glitches.
2. **The Mechanics of Data Hazards**: Building the pipeline grid reinforced why data forwarding can resolve ALU dependencies in zero cycles, but cannot eliminate load-use stalls—because data cannot physically travel backward in time from MEM to EX without an intervening clock cycle.
3. **Subtle Distinctions in TCP Loss Recovery**: Seeing Tahoe and Reno plotted side-by-side on the same chart clearly showed how Reno's Fast Recovery prevents catastrophic throughput collapse during transient packet drops.
4. **Hardware Trade-offs in Cache Associativity**: Implementing LRU eviction and 3C miss categorization highlighted why high associativity is not free—parallel tag comparators and eviction replacement counters require significant silicon area and power.

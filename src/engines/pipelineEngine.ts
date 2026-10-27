// 5-Stage CPU Pipeline Simulation Engine
// Pure TypeScript - simulates MIPS-style pipeline with/without forwarding

export type StageName = 'IF' | 'ID' | 'EX' | 'MEM' | 'WB' | 'stall';

export interface ParsedInstruction {
  raw: string;
  op: string;
  destReg?: string;
  srcRegs: string[];
}

export interface ForwardingEvent {
  cycle: number;
  fromInstruction: number;
  toInstruction: number;
  register: string;
  fromStage: string;
  toStage: string;
}

export interface PipelineCycleStep {
  cycle: number;
  // Stage of each instruction at this cycle (null if not started or finished)
  instructionStages: (StageName | null)[];
  stallReason?: string;
  forwardingNote?: string;
  explanation: string;
}

export interface PipelineSimulationResult {
  instructions: ParsedInstruction[];
  totalCycles: number;
  stallCount: number;
  cpi: number;
  // grid[instIndex][cycleIndex - 1] = stage
  grid: (StageName | null)[][];
  steps: PipelineCycleStep[];
  forwardingEvents: ForwardingEvent[];
}

export function parseInstruction(line: string): ParsedInstruction | null {
  const clean = line.replace(/#.*$/, '').trim();
  if (!clean) return null;

  const spaceIdx = clean.search(/\s/);
  if (spaceIdx === -1) return null;

  const op = clean.substring(0, spaceIdx).toLowerCase();
  const rest = clean.substring(spaceIdx).trim();
  const tokens = rest.split(',').map((t) => t.trim());

  let destReg: string | undefined;
  const srcRegs: string[] = [];

  if (['add', 'sub', 'and', 'or'].includes(op)) {
    if (tokens.length >= 3) {
      destReg = tokens[0];
      srcRegs.push(tokens[1], tokens[2]);
    }
  } else if (op === 'addi') {
    if (tokens.length >= 2) {
      destReg = tokens[0];
      srcRegs.push(tokens[1]);
    }
  } else if (op === 'lw') {
    if (tokens.length >= 2) {
      destReg = tokens[0];
      const match = tokens[1].match(/\((.*?)\)/);
      if (match) srcRegs.push(match[1]);
    }
  } else if (op === 'sw') {
    if (tokens.length >= 2) {
      srcRegs.push(tokens[0]);
      const match = tokens[1].match(/\((.*?)\)/);
      if (match) srcRegs.push(match[1]);
    }
  } else if (op === 'beq') {
    if (tokens.length >= 2) {
      srcRegs.push(tokens[0], tokens[1]);
    }
  }

  return { raw: clean, op, destReg, srcRegs };
}

export function parseProgram(text: string): ParsedInstruction[] {
  return text
    .split('\n')
    .map(parseInstruction)
    .filter((inst): inst is ParsedInstruction => inst !== null);
}

export function simulatePipeline(
  programText: string,
  forwardingEnabled: boolean
): PipelineSimulationResult {
  const instructions = parseProgram(programText);
  if (instructions.length === 0) {
    return {
      instructions: [],
      totalCycles: 0,
      stallCount: 0,
      cpi: 0,
      grid: [],
      steps: [],
      forwardingEvents: [],
    };
  }

  // instCycles[i] = { IF: cycle, ID: cycle, EX: cycle, MEM: cycle, WB: cycle }
  const instCycles: { [stage: string]: number }[] = [];
  const stallsByInst: { cycle: number; reason: string }[][] = Array.from(
    { length: instructions.length },
    () => []
  );
  const forwardingEvents: ForwardingEvent[] = [];

  for (let i = 0; i < instructions.length; i++) {
    const inst = instructions[i];

    // IF stage starts 1 cycle after previous instruction's IF
    let ifCycle = i === 0 ? 1 : instCycles[i - 1]['IF'] + 1;
    let idCycle = ifCycle + 1;

    // Check branch delay (simplified: branches stall 2 cycles)
    if (i > 0 && instructions[i - 1].op === 'beq') {
      const branchStalls = 2;
      for (let s = 0; s < branchStalls; s++) {
        stallsByInst[i].push({
          cycle: ifCycle + s,
          reason: 'Branch penalty (2 cycles)',
        });
      }
      ifCycle += branchStalls;
      idCycle = ifCycle + 1;
    }

    // Hazard detection for register dependencies in ID
    let stallCyclesNeeded = 0;
    let stallReason = '';

    for (let prevIdx = Math.max(0, i - 2); prevIdx < i; prevIdx++) {
      const prev = instructions[prevIdx];
      if (!prev.destReg) continue;

      const hasDependency = inst.srcRegs.includes(prev.destReg);
      if (!hasDependency) continue;

      if (!forwardingEnabled) {
        // Without forwarding: need WB before ID can read
        // prev WB is at instCycles[prevIdx]['WB']
        const prevWB = instCycles[prevIdx]['WB'];
        if (idCycle < prevWB) {
          const needed = prevWB - idCycle;
          if (needed > stallCyclesNeeded) {
            stallCyclesNeeded = needed;
            stallReason = `RAW hazard: ${inst.raw} needs ${prev.destReg} from ${prev.raw} (WB at cycle ${prevWB})`;
          }
        }
      } else {
        // With forwarding:
        if (prev.op === 'lw' && prevIdx === i - 1) {
          // Load-Use hazard: 1 stall required even with forwarding
          stallCyclesNeeded = Math.max(stallCyclesNeeded, 1);
          stallReason = `Load-use hazard: ${inst.raw} needs ${prev.destReg} from ${prev.raw} (data ready after MEM)`;
          forwardingEvents.push({
            cycle: idCycle + 1 + 1, // at EX
            fromInstruction: prevIdx,
            toInstruction: i,
            register: prev.destReg,
            fromStage: 'MEM',
            toStage: 'EX',
          });
        } else {
          // ALU-to-ALU forwarding (0 stalls)
          forwardingEvents.push({
            cycle: idCycle + 1,
            fromInstruction: prevIdx,
            toInstruction: i,
            register: prev.destReg,
            fromStage: prev.op === 'lw' ? 'WB' : 'EX',
            toStage: 'EX',
          });
        }
      }
    }

    if (stallCyclesNeeded > 0) {
      for (let s = 0; s < stallCyclesNeeded; s++) {
        stallsByInst[i].push({
          cycle: idCycle + s,
          reason: stallReason,
        });
      }
    }

    idCycle += stallCyclesNeeded;
    const exCycle = idCycle + 1;
    const memCycle = exCycle + 1;
    const wbCycle = memCycle + 1;

    instCycles.push({
      IF: ifCycle,
      ID: idCycle,
      EX: exCycle,
      MEM: memCycle,
      WB: wbCycle,
    });
  }

  const totalCycles = Math.max(...instCycles.map((c) => c.WB));
  let totalStalls = 0;
  stallsByInst.forEach((stalls) => {
    totalStalls += stalls.length;
  });

  // Build grid: rows = instructions, cols = cycles (1 to totalCycles)
  const grid: (StageName | null)[][] = Array.from(
    { length: instructions.length },
    () => Array.from({ length: totalCycles }, () => null)
  );

  for (let i = 0; i < instructions.length; i++) {
    const c = instCycles[i];
    grid[i][c.IF - 1] = 'IF';
    // Fill stall bubbles
    stallsByInst[i].forEach((st) => {
      grid[i][st.cycle - 1] = 'stall';
    });
    grid[i][c.ID - 1] = 'ID';
    grid[i][c.EX - 1] = 'EX';
    grid[i][c.MEM - 1] = 'MEM';
    grid[i][c.WB - 1] = 'WB';
  }

  // Build step-by-step cycle explanations
  const steps: PipelineCycleStep[] = [];
  for (let cycle = 1; cycle <= totalCycles; cycle++) {
    const instructionStages = grid.map((row) => row[cycle - 1]);
    const stallsInCycle = stallsByInst
      .flat()
      .filter((s) => s.cycle === cycle)
      .map((s) => s.reason);

    const fwdInCycle = forwardingEvents
      .filter((f) => f.cycle === cycle)
      .map(
        (f) =>
          `Forwarded ${f.register} from Instr ${f.fromInstruction + 1} (${f.fromStage}) to Instr ${f.toInstruction + 1} (${f.toStage})`
      );

    let explanation = `Cycle ${cycle}: `;
    if (stallsInCycle.length > 0) {
      explanation += `Stall inserted! ${stallsInCycle[0]}`;
    } else if (fwdInCycle.length > 0) {
      explanation += `Forwarding active: ${fwdInCycle.join(', ')}`;
    } else {
      const activeOps = instructionStages
        .map((st, idx) => (st && st !== 'stall' ? `${instructions[idx].op} [${st}]` : null))
        .filter(Boolean);
      explanation += activeOps.length > 0 ? `Active: ${activeOps.join(', ')}` : 'Pipeline idling';
    }

    steps.push({
      cycle,
      instructionStages,
      stallReason: stallsInCycle[0],
      forwardingNote: fwdInCycle[0],
      explanation,
    });
  }

  const cpi = instructions.length > 0 ? Math.round((totalCycles / instructions.length) * 100) / 100 : 0;

  return {
    instructions,
    totalCycles,
    stallCount: totalStalls,
    cpi,
    grid,
    steps,
    forwardingEvents,
  };
}


import { describe, it, expect } from 'vitest';
import { simulatePipeline, parseInstruction } from '../engines/pipelineEngine';

describe('pipelineEngine', () => {
  it('parses MIPS instruction operands and registers cleanly', () => {
    const addInst = parseInstruction('add $t0, $s1, $s2');
    expect(addInst?.op).toBe('add');
    expect(addInst?.destReg).toBe('$t0');
    expect(addInst?.srcRegs).toEqual(['$s1', '$s2']);

    const lwInst = parseInstruction('lw $t1, 4($s3)');
    expect(lwInst?.op).toBe('lw');
    expect(lwInst?.destReg).toBe('$t1');
    expect(lwInst?.srcRegs).toEqual(['$s3']);

    const beqInst = parseInstruction('beq $t0, $t1, target');
    expect(beqInst?.op).toBe('beq');
    expect(beqInst?.destReg).toBeUndefined();
    expect(beqInst?.srcRegs).toEqual(['$t0', '$t1']);
  });

  it('runs program with no hazards in baseline cycles (N + 4)', () => {
    const prog = `
      add $t0, $s0, $s1
      sub $t2, $s2, $s3
      and $t4, $s4, $s5
    `;
    const res = simulatePipeline(prog, false);
    // 3 instructions with 0 stalls = 3 + 4 = 7 cycles
    expect(res.instructions).toHaveLength(3);
    expect(res.stallCount).toBe(0);
    expect(res.totalCycles).toBe(7);
    expect(res.cpi).toBe(2.33); // 7 / 3
  });

  it('resolves RAW hazard with stalls when forwarding is disabled', () => {
    const prog = `
      add $t0, $s1, $s2
      sub $t3, $t0, $s3
    `;
    const resWithoutFwd = simulatePipeline(prog, false);
    // Without forwarding, sub stalls until add's WB is reached
    expect(resWithoutFwd.stallCount).toBeGreaterThan(0);
    expect(resWithoutFwd.totalCycles).toBeGreaterThan(6);
  });

  it('eliminates RAW stalls when forwarding is enabled', () => {
    const prog = `
      add $t0, $s1, $s2
      sub $t3, $t0, $s3
    `;
    const resWithFwd = simulatePipeline(prog, true);
    // ALU to ALU forwarding needs 0 stalls!
    expect(resWithFwd.stallCount).toBe(0);
    expect(resWithFwd.totalCycles).toBe(6);
    expect(resWithFwd.forwardingEvents.length).toBeGreaterThan(0);
  });

  it('inserts 1 stall for load-use hazard even when forwarding is enabled', () => {
    const prog = `
      lw $t0, 0($s0)
      add $t1, $t0, $s1
    `;
    const res = simulatePipeline(prog, true);
    // Load-use hazard must stall 1 cycle even with forwarding
    expect(res.stallCount).toBe(1);
    expect(res.totalCycles).toBe(7);
  });

  it('inserts 2 stalls for branch penalty', () => {
    const prog = `
      beq $s0, $s1, target
      add $t0, $s2, $s3
    `;
    const res = simulatePipeline(prog, true);
    expect(res.stallCount).toBe(2);
  });
});


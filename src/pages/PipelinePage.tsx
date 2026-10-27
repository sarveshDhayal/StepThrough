import React, { useState, useMemo } from 'react';
import { simulatePipeline } from '../engines/pipelineEngine';
import { Controls } from '../components/Controls';
import { PipelineGrid } from '../components/pipeline/PipelineGrid';
import { LearnSection } from '../components/LearnSection';
import { Columns, Info, Zap, ShieldAlert } from 'lucide-react';

const PRESETS = {
  raw: `add $t0, $s1, $s2\nsub $t3, $t0, $s3\nand $t4, $t0, $s4`,
  loadUse: `lw $t0, 0($s0)\nadd $t1, $t0, $s1\nor $t2, $t1, $s2`,
  noHazard: `add $t0, $s0, $s1\naddi $t2, $s2, 10\nsub $t4, $s3, $s4\nor $t5, $s5, $s6`,
};

export const PipelinePage: React.FC = () => {
  const [programText, setProgramText] = useState<string>(PRESETS.loadUse);
  const [forwarding, setForwarding] = useState<boolean>(true);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);

  const simulation = useMemo(
    () => simulatePipeline(programText, forwarding),
    [programText, forwarding]
  );

  const compareWithFwd = useMemo(
    () => simulatePipeline(programText, true),
    [programText]
  );
  const compareWithoutFwd = useMemo(
    () => simulatePipeline(programText, false),
    [programText]
  );

  const safeStepIndex = Math.min(
    currentStep,
    Math.max(0, simulation.steps.length - 1)
  );
  const currentStepData = simulation.steps[safeStepIndex];
  const currentCycle = currentStepData?.cycle ?? 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          5-Stage CPU Pipeline Hazards Simulator
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Trace IF, ID, EX, MEM, and WB stages. Inspect data hazards (RAW), load-use stalls, branch penalties, and ALU forwarding.
        </p>
      </div>

      {/* Configuration & Code Editor */}
      <div className="grid lg:grid-cols-3 gap-6 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl mb-6 shadow-sm text-sm">
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <label className="text-xs font-semibold text-slate-500">
              Assembly Program (add, sub, and, or, addi, lw, sw, beq)
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">Presets:</span>
              <button
                onClick={() => { setProgramText(PRESETS.raw); setCurrentStep(0); }}
                className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300"
              >
                RAW Hazard
              </button>
              <button
                onClick={() => { setProgramText(PRESETS.loadUse); setCurrentStep(0); }}
                className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300"
              >
                Load-Use
              </button>
              <button
                onClick={() => { setProgramText(PRESETS.noHazard); setCurrentStep(0); }}
                className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300"
              >
                No Hazard
              </button>
            </div>
          </div>
          <textarea
            rows={4}
            value={programText}
            onChange={(e) => { setProgramText(e.target.value); setCurrentStep(0); }}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 font-mono text-xs leading-relaxed"
            placeholder="add $t0, $s1, $s2"
          />
        </div>

        {/* Toggles & Metrics summary */}
        <div className="flex flex-col justify-between space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Data Forwarding</label>
            <button
              onClick={() => { setForwarding(!forwarding); setCurrentStep(0); }}
              className={`w-full py-2.5 px-4 rounded-lg font-medium text-xs flex items-center justify-center gap-2 border transition ${
                forwarding
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
              }`}
            >
              {forwarding ? (
                <>
                  <Zap className="w-4 h-4 text-emerald-500" />
                  <span>Forwarding: ENABLED (Bypass Active)</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  <span>Forwarding: DISABLED (Stall On Hazard)</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className="text-[11px] text-slate-500">Cycles</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">{simulation.totalCycles}</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className="text-[11px] text-slate-500">Stalls</div>
              <div className="text-lg font-bold text-rose-600 dark:text-rose-400">{simulation.stallCount}</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className="text-[11px] text-slate-500">CPI</div>
              <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{simulation.cpi}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls & Compare Mode Toggle */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <Controls
            currentStep={safeStepIndex}
            totalSteps={simulation.steps.length}
            onStepChange={setCurrentStep}
            onReset={() => setCurrentStep(0)}
          />
          <button
            onClick={() => setIsCompareMode(!isCompareMode)}
            className={`ml-4 px-3.5 py-3 rounded-xl border flex items-center gap-2 text-sm font-medium transition shrink-0 ${
              isCompareMode
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Columns className="w-4 h-4" />
            <span>Compare Forwarding ON vs OFF</span>
          </button>
        </div>

        {/* Current Cycle Explanation */}
        {currentStepData && (
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
              currentStepData.stallReason
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-200'
                : currentStepData.forwardingNote
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200'
                : 'bg-indigo-50/60 dark:bg-slate-900 border-indigo-100 dark:border-slate-800 text-slate-800 dark:text-slate-200'
            }`}
          >
            <Info className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm font-medium leading-relaxed">
              {currentStepData.explanation}
            </div>
          </div>
        )}
      </div>

      {/* Compare Mode Side-by-Side Summary */}
      {isCompareMode && (
        <div className="grid md:grid-cols-2 gap-6 p-5 mb-6 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl">
          <div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
              With Data Forwarding
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {compareWithFwd.totalCycles} Cycles ({compareWithFwd.stallCount} Stalls)
            </div>
            <div className="text-xs text-slate-500 mt-1">
              CPI: {compareWithFwd.cpi} &bull; Speedup: {((compareWithoutFwd.totalCycles / compareWithFwd.totalCycles) || 1).toFixed(2)}x
            </div>
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
              Without Forwarding (Stall on Hazard)
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {compareWithoutFwd.totalCycles} Cycles ({compareWithoutFwd.stallCount} Stalls)
            </div>
            <div className="text-xs text-slate-500 mt-1">
              CPI: {compareWithoutFwd.cpi}
            </div>
          </div>
        </div>
      )}

      {/* Pipeline Grid View */}
      <div className="mb-8">
        <PipelineGrid
          instructions={simulation.instructions}
          grid={simulation.grid}
          totalCycles={simulation.totalCycles}
          currentCycle={currentCycle}
        />
      </div>

      {/* Learn Section */}
      <LearnSection
        title="Pipelining, Hazards & Data Forwarding"
        theory="Instruction pipelining overlaps the execution of multiple instructions across 5 stages: Instruction Fetch (IF), Instruction Decode / Register Read (ID), Execute (EX), Memory Access (MEM), and Write Back (WB). While pipelining improves instruction throughput, hazards can disrupt smooth flow: Structural hazards (hardware conflicts), Data hazards (RAW - Read After Write dependencies), and Control hazards (branch decisions). Forwarding (bypassing) routes intermediate ALU results directly to waiting inputs without writing to registers first."
        questions={[
          {
            question: 'Why can data forwarding eliminate ALU-to-ALU RAW stalls, but not Load-Use RAW stalls?',
            answer:
              'An ALU operation generates its output at the end of the EX stage, which can immediately be forwarded to the EX stage of the next instruction. A load instruction (lw), however, only retrieves data at the end of the MEM stage. The dependent instruction needs this operand at the start of its EX stage (which occurs during the load\'s MEM stage). Because data cannot travel backward in time, 1 hardware bubble/stall is required.',
          },
          {
            question: 'What is a branch hazard and how do modern CPUs resolve it?',
            answer:
              'A branch instruction (such as beq) computes the branch outcome and target address in ID or EX, leaving the CPU unsure which instruction to fetch next. Simple processors stall for 2 cycles until the target is known. Modern CPUs use branch prediction (predicting Taken vs Not Taken using branch history tables) and speculative execution to keep the pipeline full.',
          },
          {
            question: 'What is the theoretical maximum speedup of a 5-stage pipeline?',
            answer:
              'If every stage is perfectly balanced and there are zero stalls or hazards, the maximum speedup equals the number of stages (5x). However, due to clock skew, stage imbalance, pipeline register overhead, and hazard stalls, real-world speedup is lower.',
          },
          {
            question: 'What is the role of split-phase register access (split regfile)?',
            answer:
              'In split-phase register access, the register file writes during the first half of the clock cycle (in the WB stage) and reads during the second half of the clock cycle (in the ID stage). This allows an instruction in ID to read the newly written value in the very same clock cycle without stalling.',
          },
        ]}
      />
    </div>
  );
};

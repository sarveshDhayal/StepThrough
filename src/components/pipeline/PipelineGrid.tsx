import React from 'react';
import { ParsedInstruction, StageName } from '../../engines/pipelineEngine';

interface PipelineGridProps {
  instructions: ParsedInstruction[];
  grid: (StageName | null)[][];
  totalCycles: number;
  currentCycle: number;
}

const STAGE_COLORS: Record<StageName, string> = {
  IF: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 border-blue-300 dark:border-blue-700',
  ID: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 border-purple-300 dark:border-purple-700',
  EX: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border-amber-300 dark:border-amber-700',
  MEM: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
  WB: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700',
  stall: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800 font-bold',
};

export const PipelineGrid: React.FC<PipelineGridProps> = ({
  instructions,
  grid,
  totalCycles,
  currentCycle,
}) => {
  if (instructions.length === 0 || totalCycles === 0) {
    return (
      <div className="p-8 text-center text-slate-500 border border-dashed rounded-xl dark:border-slate-800">
        Enter valid instructions to view the pipeline grid
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
            <th className="py-2.5 px-4 min-w-[140px] sticky left-0 bg-slate-50 dark:bg-slate-850 z-10 border-r border-slate-200 dark:border-slate-700">
              Instruction
            </th>
            {Array.from({ length: totalCycles }).map((_, c) => {
              const cycleNum = c + 1;
              const isCurrent = cycleNum === currentCycle;
              return (
                <th
                  key={c}
                  className={`py-2 px-2.5 text-center min-w-[44px] transition-colors ${
                    isCurrent
                      ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold border-b-2 border-indigo-600'
                      : ''
                  }`}
                >
                  C{cycleNum}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
          {instructions.map((inst, i) => (
            <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
              <td className="py-2 px-4 font-semibold text-slate-800 dark:text-slate-200 sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">
                <span className="text-slate-400 mr-2 text-[11px]">I{i + 1}</span>
                <span>{inst.raw}</span>
              </td>
              {Array.from({ length: totalCycles }).map((_, c) => {
                const stage = grid[i]?.[c];
                const isCurrent = c + 1 === currentCycle;
                return (
                  <td
                    key={c}
                    className={`py-1.5 px-1 text-center transition-colors ${
                      isCurrent ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                    }`}
                  >
                    {stage ? (
                      <span
                        className={`inline-block w-8 py-0.5 rounded text-[11px] border font-medium ${
                          STAGE_COLORS[stage]
                        }`}
                      >
                        {stage === 'stall' ? 'stall' : stage}
                      </span>
                    ) : (
                      <span className="text-slate-200 dark:text-slate-800">&middot;</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


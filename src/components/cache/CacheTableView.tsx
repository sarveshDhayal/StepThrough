import React from 'react';
import { CacheStep } from '../../engines/cacheEngine';

interface CacheTableViewProps {
  currentStepData?: CacheStep;
  numSets: number;
  ways: number;
}

export const CacheTableView: React.FC<CacheTableViewProps> = ({
  currentStepData,
  numSets,
  ways,
}) => {
  if (!currentStepData) {
    return (
      <div className="p-8 text-center text-slate-500 border border-dashed rounded-xl dark:border-slate-800">
        Run simulation to view cache state
      </div>
    );
  }

  const { cacheSnapshot, split, isHit, hitWay, evictedWay } = currentStepData;

  return (
    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
            <th className="py-2.5 px-4 w-16 text-center">Set</th>
            {Array.from({ length: ways }).map((_, w) => (
              <th key={w} colSpan={2} className="py-2.5 px-4 text-center border-l border-slate-200 dark:border-slate-700">
                Way {w}
              </th>
            ))}
          </tr>
          <tr className="bg-slate-100/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-700 text-xs text-slate-500">
            <th className="py-1 px-4 text-center">Index</th>
            {Array.from({ length: ways }).map((_, w) => (
              <React.Fragment key={w}>
                <th className="py-1 px-3 text-center border-l border-slate-200 dark:border-slate-700 w-16">V</th>
                <th className="py-1 px-3 text-center">Tag</th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-xs">
          {Array.from({ length: numSets }).map((_, s) => {
            const isTargetSet = split.index === s;
            return (
              <tr
                key={s}
                className={`transition-colors ${
                  isTargetSet
                    ? isHit
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/30'
                      : 'bg-rose-50/80 dark:bg-rose-950/30'
                    : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                }`}
              >
                <td className="py-2.5 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                  {s}
                </td>
                {Array.from({ length: ways }).map((_, w) => {
                  const line = cacheSnapshot[s]?.[w];
                  const isValid = line?.valid ?? false;
                  const isAccessedWay = isTargetSet && (isHit ? hitWay === w : evictedWay === w || (!isHit && line?.tag === split.tag));

                  return (
                    <React.Fragment key={w}>
                      <td
                        className={`py-2 px-3 text-center border-l border-slate-200 dark:border-slate-800 ${
                          isAccessedWay
                            ? isHit
                              ? 'font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-900/40'
                              : 'font-bold text-rose-600 dark:text-rose-400 bg-rose-100/50 dark:bg-rose-900/40'
                            : isValid
                            ? 'text-slate-900 dark:text-slate-200'
                            : 'text-slate-400 dark:text-slate-600'
                        }`}
                      >
                        {isValid ? '1' : '0'}
                      </td>
                      <td
                        className={`py-2 px-3 text-center ${
                          isAccessedWay
                            ? isHit
                              ? 'font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/50 dark:bg-emerald-900/40'
                              : 'font-bold text-rose-700 dark:text-rose-300 bg-rose-100/50 dark:bg-rose-900/40'
                            : isValid
                            ? 'text-slate-800 dark:text-slate-200'
                            : 'text-slate-400 dark:text-slate-600'
                        }`}
                      >
                        {isValid ? '0x' + line.tag.toString(16).toUpperCase() : '—'}
                      </td>
                    </React.Fragment>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

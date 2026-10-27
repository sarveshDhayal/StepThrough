import React from 'react';
import { AddressSplit } from '../../engines/cacheEngine';

interface AddressBitsViewProps {
  split: AddressSplit;
}

export const AddressBitsView: React.FC<AddressBitsViewProps> = ({ split }) => {
  const { address, tag, index, offset, tagBits, indexBits, offsetBits, binaryString } = split;

  // Slices of the 16-bit binary string
  const tagStr = binaryString.slice(0, tagBits);
  const indexStr = binaryString.slice(tagBits, tagBits + indexBits);
  const offsetStr = binaryString.slice(tagBits + indexBits);

  return (
    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Address Breakdown
        </span>
        <span className="font-mono text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
          Hex: 0x{address.toString(16).padStart(4, '0').toUpperCase()} ({address})
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs font-medium mb-3">
        <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60">
          <div className="text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">TAG</div>
          <div className="font-mono text-sm font-semibold text-blue-900 dark:text-blue-200 my-0.5">
            0x{tag.toString(16).toUpperCase()}
          </div>
          <div className="text-[11px] text-blue-500">{tagBits} bits</div>
        </div>

        <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60">
          <div className="text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider">INDEX</div>
          <div className="font-mono text-sm font-semibold text-purple-900 dark:text-purple-200 my-0.5">
            {index}
          </div>
          <div className="text-[11px] text-purple-500">{indexBits} bits</div>
        </div>

        <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
          <div className="text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">OFFSET</div>
          <div className="font-mono text-sm font-semibold text-amber-900 dark:text-amber-200 my-0.5">
            {offset}
          </div>
          <div className="text-[11px] text-amber-500">{offsetBits} bits</div>
        </div>
      </div>

      {/* Binary representation */}
      <div className="flex font-mono text-xs rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 tracking-widest text-center">
        {tagBits > 0 && (
          <div className="bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 py-1.5 px-2 overflow-x-auto" style={{ flex: tagBits }}>
            {tagStr}
          </div>
        )}
        {indexBits > 0 && (
          <div className="bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 py-1.5 px-2 border-l border-slate-300 dark:border-slate-700" style={{ flex: indexBits }}>
            {indexStr}
          </div>
        )}
        {offsetBits > 0 && (
          <div className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 py-1.5 px-2 border-l border-slate-300 dark:border-slate-700" style={{ flex: offsetBits }}>
            {offsetStr}
          </div>
        )}
      </div>
    </div>
  );
};


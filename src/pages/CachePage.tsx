import React, { useState, useMemo } from 'react';
import {
  simulateCache,
  parseAddresses,
  getWayCount,
  CacheConfig,
  Associativity,
  ReplacementPolicy,
} from '../engines/cacheEngine';
import { Controls } from '../components/Controls';
import { CacheTableView } from '../components/cache/CacheTableView';
import { AddressBitsView } from '../components/cache/AddressBitsView';
import { LearnSection } from '../components/LearnSection';
import { Columns, CheckCircle2, XCircle } from 'lucide-react';

const PRESETS = {
  sequential: '0x0000, 0x0004, 0x0008, 0x000C, 0x0010, 0x0014, 0x0018, 0x001C',
  loop: '0x0000, 0x0008, 0x0010, 0x0000, 0x0008, 0x0010, 0x0000, 0x0008',
  thrash: '0x0000, 0x0040, 0x0080, 0x0000, 0x0040, 0x0080, 0x0000, 0x0040',
};

export const CachePage: React.FC = () => {
  const [cacheSize, setCacheSize] = useState<number>(64);
  const [blockSize, setBlockSize] = useState<number>(8);
  const [associativity, setAssociativity] = useState<Associativity>('2-way');
  const [policy, setPolicy] = useState<ReplacementPolicy>('LRU');
  const [addressInput, setAddressInput] = useState<string>(PRESETS.loop);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);

  const config: CacheConfig = useMemo(
    () => ({ cacheSize, blockSize, associativity, replacementPolicy: policy }),
    [cacheSize, blockSize, associativity, policy]
  );

  const addresses = useMemo(() => parseAddresses(addressInput), [addressInput]);
  const steps = useMemo(() => simulateCache(addresses, config), [addresses, config]);

  // Compare mode: Direct-mapped vs 4-Way
  const directSteps = useMemo(
    () => simulateCache(addresses, { ...config, associativity: 'direct' }),
    [addresses, config]
  );
  const fourWaySteps = useMemo(
    () => simulateCache(addresses, { ...config, associativity: '4-way' }),
    [addresses, config]
  );

  const totalBlocks = Math.floor(cacheSize / blockSize);
  const ways = Math.min(getWayCount(associativity, totalBlocks), totalBlocks);
  const numSets = Math.max(1, Math.floor(totalBlocks / ways));

  const safeStepIndex = Math.min(currentStep, Math.max(0, steps.length - 1));
  const currentStepData = steps[safeStepIndex];

  const handleRandom = () => {
    const randomAddrs = Array.from({ length: 10 }, () =>
      '0x' + Math.floor(Math.random() * 256).toString(16).padStart(4, '0')
    ).join(', ');
    setAddressInput(randomAddrs);
    setCurrentStep(0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Title & Description */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Cache Memory Simulator
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Explore spatial &amp; temporal locality, set-associativity, address bit slicing, and 3C miss categorization.
        </p>
      </div>

      {/* Configuration & Inputs */}
      <div className="grid md:grid-cols-4 gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl mb-6 shadow-sm text-sm">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Cache Size</label>
          <select
            value={cacheSize}
            onChange={(e) => { setCacheSize(Number(e.target.value)); setCurrentStep(0); }}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-medium"
          >
            <option value={32}>32 Bytes</option>
            <option value={64}>64 Bytes</option>
            <option value={128}>128 Bytes</option>
            <option value={256}>256 Bytes</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Block Size</label>
          <select
            value={blockSize}
            onChange={(e) => { setBlockSize(Number(e.target.value)); setCurrentStep(0); }}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-medium"
          >
            <option value={4}>4 Bytes</option>
            <option value={8}>8 Bytes</option>
            <option value={16}>16 Bytes</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Associativity</label>
          <select
            value={associativity}
            onChange={(e) => { setAssociativity(e.target.value as Associativity); setCurrentStep(0); }}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-medium"
          >
            <option value="direct">Direct-Mapped (1-Way)</option>
            <option value="2-way">2-Way Set-Associative</option>
            <option value="4-way">4-Way Set-Associative</option>
            <option value="fully">Fully Associative</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Replacement Policy</label>
          <select
            value={policy}
            onChange={(e) => { setPolicy(e.target.value as ReplacementPolicy); setCurrentStep(0); }}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-medium"
          >
            <option value="LRU">Least Recently Used (LRU)</option>
            <option value="FIFO">First-In First-Out (FIFO)</option>
          </select>
        </div>

        {/* Address Trace Input */}
        <div className="md:col-span-4 mt-2">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <label className="text-xs font-semibold text-slate-500">Memory Address Trace (16-bit hex/dec)</label>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">Presets:</span>
              <button
                onClick={() => { setAddressInput(PRESETS.sequential); setCurrentStep(0); }}
                className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300"
              >
                Sequential
              </button>
              <button
                onClick={() => { setAddressInput(PRESETS.loop); setCurrentStep(0); }}
                className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300"
              >
                Loop
              </button>
              <button
                onClick={() => { setAddressInput(PRESETS.thrash); setCurrentStep(0); }}
                className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300"
              >
                Conflict Thrash
              </button>
              <button
                onClick={handleRandom}
                className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300"
              >
                Random
              </button>
            </div>
          </div>
          <input
            type="text"
            value={addressInput}
            onChange={(e) => { setAddressInput(e.target.value); setCurrentStep(0); }}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono text-xs"
            placeholder="0x0004, 0x000c, 0x0014"
          />
        </div>
      </div>

      {/* Controls & Compare Mode Toggle */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <Controls
            currentStep={safeStepIndex}
            totalSteps={steps.length}
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
            <span>Compare Mode</span>
          </button>
        </div>

        {/* Step Explanation Banner */}
        {currentStepData && (
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
              currentStepData.isHit
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-200'
            }`}
          >
            {currentStepData.isHit ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="text-sm font-medium leading-relaxed">
              {currentStepData.explanation}
            </div>
          </div>
        )}
      </div>

      {/* Compare Mode Banner */}
      {isCompareMode && (
        <div className="grid md:grid-cols-2 gap-6 p-5 mb-6 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl">
          <div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
              Direct-Mapped (1-Way)
            </div>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {directSteps[directSteps.length - 1]?.stats.hitRate ?? 0}% Hit Rate
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Hits: {directSteps[directSteps.length - 1]?.stats.hits ?? 0} &bull; Misses: {directSteps[directSteps.length - 1]?.stats.misses ?? 0} (Conflicts: {directSteps[directSteps.length - 1]?.stats.conflictMisses ?? 0})
            </div>
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
              4-Way Set-Associative
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {fourWaySteps[fourWaySteps.length - 1]?.stats.hitRate ?? 0}% Hit Rate
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Hits: {fourWaySteps[fourWaySteps.length - 1]?.stats.hits ?? 0} &bull; Misses: {fourWaySteps[fourWaySteps.length - 1]?.stats.misses ?? 0} (Conflicts: {fourWaySteps[fourWaySteps.length - 1]?.stats.conflictMisses ?? 0})
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid: Address Breakdown & Stats on Left, Cache Table on Right */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="space-y-4">
          {currentStepData && <AddressBitsView split={currentStepData.split} />}

          {/* Cache Stats Card */}
          {currentStepData && (
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Performance &amp; 3C Misses
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <div className="text-xs text-slate-500">Hit Rate</div>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {currentStepData.stats.hitRate}%
                  </div>
                  <div className="text-[11px] text-slate-400">{currentStepData.stats.hits} hits</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <div className="text-xs text-slate-500">Miss Rate</div>
                  <div className="text-lg font-bold text-rose-600 dark:text-rose-400">
                    {currentStepData.stats.missRate}%
                  </div>
                  <div className="text-[11px] text-slate-400">{currentStepData.stats.misses} misses</div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between">
                  <span>Compulsory (Cold) Misses:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">
                    {currentStepData.stats.compulsoryMisses}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Capacity Misses:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">
                    {currentStepData.stats.capacityMisses}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Conflict Misses:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">
                    {currentStepData.stats.conflictMisses}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cache Table View */}
        <div className="lg:col-span-2">
          <CacheTableView
            currentStepData={currentStepData}
            numSets={numSets}
            ways={ways}
          />
        </div>
      </div>

      {/* Learn Section */}
      <LearnSection
        title="CPU Caches & Memory Hierarchy"
        theory="A cache is a small, high-speed memory placed between the CPU and main memory to exploit temporal locality (recently accessed items are likely to be accessed again) and spatial locality (nearby items are likely to be accessed soon). When an address is accessed, it is split into Tag, Index, and Offset bits. The Index selects the set, the Tag is checked across ways to detect a Hit, and the Offset selects the specific byte within the cache line."
        questions={[
          {
            question: 'What are the 3Cs of cache misses, and how do you reduce each?',
            answer:
              'Compulsory (cold) misses occur on the first access to a block (reduced by increasing block size or prefetching). Capacity misses occur when the working set exceeds total cache size (reduced by enlarging cache size). Conflict misses occur when multiple addresses map to the same set (reduced by increasing associativity).',
          },
          {
            question: 'Why not make every cache fully associative?',
            answer:
              'Fully associative caches require comparing the tag against every line simultaneously using parallel comparator hardware. This increases circuit complexity, silicon area, power consumption, and cycle latency, which is why L1 caches typically use direct-mapped or 4/8-way associativity.',
          },
          {
            question: 'How does block size affect miss rate?',
            answer:
              'Increasing block size reduces compulsory misses due to spatial locality. However, if block size becomes too large for a fixed cache size, the number of sets decreases, which increases conflict misses and causes higher miss penalty due to longer transfer times from main memory.',
          },
          {
            question: 'What is the difference between LRU and FIFO replacement policies?',
            answer:
              'LRU (Least Recently Used) tracks when each line was last accessed, evicting the line that has gone the longest without an access. FIFO (First-In, First-Out) tracks when a line was originally brought in, evicting the oldest block regardless of how recently it was accessed.',
          },
        ]}
      />
    </div>
  );
};


import React, { useState, useMemo } from 'react';
import {
  simulateTcp,
  TcpVariant,
  LossType,
  LossEvent,
} from '../engines/tcpEngine';
import { Controls } from '../components/Controls';
import { TcpChart } from '../components/tcp/TcpChart';
import { PacketVisualizer } from '../components/tcp/PacketVisualizer';
import { LearnSection } from '../components/LearnSection';
import { Columns, Plus, Trash2, Info } from 'lucide-react';

export const TcpPage: React.FC = () => {
  const [variant, setVariant] = useState<TcpVariant>('Reno');
  const [initialSsthresh, setInitialSsthresh] = useState<number>(16);
  const [totalRounds, setTotalRounds] = useState<number>(20);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);

  // User-configured loss events
  const [lossEvents, setLossEvents] = useState<LossEvent[]>([
    { round: 8, type: '3dupACK' },
    { round: 14, type: 'timeout' },
  ]);

  // New loss input form
  const [newLossRound, setNewLossRound] = useState<number>(10);
  const [newLossType, setNewLossType] = useState<LossType>('3dupACK');

  // Simulation steps
  const steps = useMemo(
    () => simulateTcp({ variant, initialSsthresh, totalRounds, lossEvents }),
    [variant, initialSsthresh, totalRounds, lossEvents]
  );

  // Compare mode steps
  const compareSteps = useMemo(() => {
    const tahoe = simulateTcp({ variant: 'Tahoe', initialSsthresh, totalRounds, lossEvents });
    const reno = simulateTcp({ variant: 'Reno', initialSsthresh, totalRounds, lossEvents });
    return { tahoe, reno };
  }, [initialSsthresh, totalRounds, lossEvents]);

  const safeIndex = Math.min(currentStep, Math.max(0, steps.length - 1));
  const currentStepData = steps[safeIndex];

  const handleAddLoss = () => {
    if (newLossRound >= 1 && newLossRound <= totalRounds) {
      // Remove any existing loss at the same round and append
      const filtered = lossEvents.filter((e) => e.round !== newLossRound);
      setLossEvents([...filtered, { round: newLossRound, type: newLossType }].sort((a, b) => a.round - b.round));
    }
  };

  const handleRemoveLoss = (round: number) => {
    setLossEvents(lossEvents.filter((e) => e.round !== round));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          TCP Congestion Control Simulator
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Explore Slow Start, Congestion Avoidance (AIMD), Fast Retransmit, and Reno&apos;s Fast Recovery across RTT rounds.
        </p>
      </div>

      {/* Configuration */}
      <div className="grid md:grid-cols-4 gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl mb-6 shadow-sm text-sm">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">TCP Algorithm</label>
          <select
            value={variant}
            onChange={(e) => setVariant(e.target.value as TcpVariant)}
            disabled={isCompareMode}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-medium disabled:opacity-50"
          >
            <option value="Reno">TCP Reno (Fast Recovery)</option>
            <option value="Tahoe">TCP Tahoe (Classic)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Initial ssthresh (MSS)</label>
          <select
            value={initialSsthresh}
            onChange={(e) => { setInitialSsthresh(Number(e.target.value)); setCurrentStep(0); }}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-medium"
          >
            <option value={8}>8 MSS</option>
            <option value={16}>16 MSS</option>
            <option value={32}>32 MSS</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Total RTT Rounds</label>
          <select
            value={totalRounds}
            onChange={(e) => { setTotalRounds(Number(e.target.value)); setCurrentStep(0); }}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-medium"
          >
            <option value={15}>15 Rounds</option>
            <option value={20}>20 Rounds</option>
            <option value={25}>25 Rounds</option>
          </select>
        </div>

        {/* Quick Loss Adder */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Inject Loss Event</label>
          <div className="flex gap-1.5">
            <input
              type="number"
              min={1}
              max={totalRounds}
              value={newLossRound}
              onChange={(e) => setNewLossRound(Number(e.target.value))}
              className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 text-xs text-center font-mono"
            />
            <select
              value={newLossType}
              onChange={(e) => setNewLossType(e.target.value as LossType)}
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-1 text-xs font-medium"
            >
              <option value="3dupACK">3 Dup ACKs</option>
              <option value="timeout">Timeout</option>
            </select>
            <button
              onClick={handleAddLoss}
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium flex items-center"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Active Loss Events Pill list */}
        <div className="md:col-span-4 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-500">Configured Losses:</span>
          {lossEvents.length === 0 && <span className="text-xs text-slate-400">None (clean network)</span>}
          {lossEvents.map((e) => (
            <span
              key={e.round}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900"
            >
              <span>Round {e.round}: {e.type === '3dupACK' ? '3 Dup ACKs' : 'Timeout'}</span>
              <button onClick={() => handleRemoveLoss(e.round)} className="hover:text-rose-900 dark:hover:text-rose-100">
                <Trash2 className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Controls & Compare Toggle */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <Controls
            currentStep={safeIndex}
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
            <span>Compare Tahoe vs Reno</span>
          </button>
        </div>

        {/* Current Round Status Banner */}
        {currentStepData && (
          <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-slate-900 flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
              {currentStepData.log}
            </div>
          </div>
        )}
      </div>

      {/* Main Visuals: Chart & Packet Visualizer */}
      <div className="space-y-6 mb-8">
        <TcpChart
          steps={steps}
          currentRound={currentStepData?.round ?? 1}
          compareSteps={compareSteps}
          isCompareMode={isCompareMode}
        />

        {currentStepData && (
          <PacketVisualizer
            packets={currentStepData.packets}
            round={currentStepData.round}
          />
        )}
      </div>

      {/* Event Log & Current State Table */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Current Round State ({isCompareMode ? 'Compare' : variant})
          </div>
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between p-2 rounded bg-slate-50 dark:bg-slate-800">
              <span className="text-slate-500">RTT Round:</span>
              <span className="font-bold text-slate-900 dark:text-white">{currentStepData?.round}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-50 dark:bg-slate-800">
              <span className="text-slate-500">Congestion Window (cwnd):</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{currentStepData?.cwnd} MSS</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-50 dark:bg-slate-800">
              <span className="text-slate-500">Slow Start Threshold (ssthresh):</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">{currentStepData?.ssthresh} MSS</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-50 dark:bg-slate-800">
              <span className="text-slate-500">Current Phase:</span>
              <span className="font-bold text-slate-900 dark:text-white">{currentStepData?.phase}</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Simulation Event Log
          </div>
          <div className="max-h-44 overflow-y-auto space-y-1.5 font-mono text-xs text-slate-600 dark:text-slate-400">
            {steps.slice(0, safeIndex + 1).map((s) => (
              <div
                key={s.round}
                className={`p-1.5 rounded transition ${
                  s.round === currentStepData?.round
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 font-semibold text-indigo-700 dark:text-indigo-300'
                    : ''
                }`}
              >
                {s.log}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Learn Section */}
      <LearnSection
        title="TCP Congestion Control & AIMD"
        theory="TCP controls network congestion dynamically by adjusting cwnd (Congestion Window). During Slow Start, cwnd doubles each RTT to quickly saturate available bandwidth. Once cwnd reaches ssthresh, it switches to Congestion Avoidance with AIMD (Additive Increase, Multiplicative Decrease), adding +1 MSS per RTT. When packet loss occurs, TCP halves ssthresh. Tahoe drops cwnd back to 1 for all losses, while Reno uses Fast Recovery on 3 duplicate ACKs, resuming transmission directly from ssthresh without restarting slow start."
        questions={[
          {
            question: 'Why does TCP use Slow Start instead of jumping immediately to max bandwidth?',
            answer:
              'A new TCP connection has no prior knowledge of available link capacity. Transmitting at full blast immediately would cause immediate massive buffer overflows and packet drops across bottleneck routers. Slow Start ramps exponentially to probe capacity safely.',
          },
          {
            question: 'What is the key difference between TCP Tahoe and TCP Reno?',
            answer:
              'On 3 duplicate ACKs, Tahoe drops cwnd to 1 and re-enters Slow Start. Reno introduces Fast Recovery: it infers that subsequent packets are still reaching the receiver (generating dup ACKs), so it sets cwnd to ssthresh and continues with Congestion Avoidance, avoiding the high latency penalty of slow start.',
          },
          {
            question: 'Why are 3 duplicate ACKs treated differently from a timeout?',
            answer:
              'A timeout means total silence (no packets are getting through or returning). In contrast, 3 duplicate ACKs prove that packets after the missing segment are still arriving at the destination and triggering ACKs. Because the network pipeline is not completely dead, Reno can perform Fast Retransmit and Fast Recovery.',
          },
          {
            question: 'What is AIMD and why does it lead to fairness among competing flows?',
            answer:
              'Additive Increase / Multiplicative Decrease increases cwnd by +1 MSS per RTT and cuts cwnd in half upon congestion. In phase space, this mathematical sawtooth converges competing flows toward the fairness line where all flows consume equal bandwidth.',
          },
        ]}
      />
    </div>
  );
};

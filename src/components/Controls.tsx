import React, { useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';

interface ControlsProps {
  currentStep: number;
  totalSteps: number;
  onStepChange: (step: number) => void;
  onReset: () => void;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  currentStep,
  totalSteps,
  onStepChange,
  onReset,
  isPlaying: externalIsPlaying,
  onTogglePlay: externalTogglePlay,
}) => {
  const [internalIsPlaying, setInternalIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1);

  const isPlaying = externalIsPlaying !== undefined ? externalIsPlaying : internalIsPlaying;

  const togglePlay = () => {
    if (externalTogglePlay) {
      externalTogglePlay();
    } else {
      setInternalIsPlaying((prev) => !prev);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      onStepChange(currentStep + 1);
    }
  };

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) return;

    if (currentStep >= totalSteps - 1) {
      if (externalTogglePlay) {
        externalTogglePlay();
      } else {
        setInternalIsPlaying(false);
      }
      return;
    }

    const intervalMs = 1000 / speed;
    const timer = setTimeout(() => {
      onStepChange(currentStep + 1);
    }, intervalMs);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, totalSteps, speed, onStepChange, externalTogglePlay]);

  // Keyboard navigation: Space = play/pause, Left/Right = step
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrev}
          disabled={currentStep === 0}
          title="Step Back (Left Arrow)"
          className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <SkipBack className="w-5 h-5 text-slate-700 dark:text-slate-300" />
        </button>

        <button
          onClick={togglePlay}
          disabled={totalSteps === 0 || (currentStep >= totalSteps - 1 && !isPlaying)}
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-medium flex items-center gap-2 transition"
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-white" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Play</span>
            </>
          )}
        </button>

        <button
          onClick={handleNext}
          disabled={currentStep >= totalSteps - 1}
          title="Step Forward (Right Arrow)"
          className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <SkipForward className="w-5 h-5 text-slate-700 dark:text-slate-300" />
        </button>

        <button
          onClick={onReset}
          title="Reset to Step 0"
          className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
          Step <span className="font-semibold text-slate-900 dark:text-white">{totalSteps > 0 ? currentStep + 1 : 0}</span> of{' '}
          <span className="font-semibold text-slate-900 dark:text-white">{totalSteps}</span>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          {([0.5, 1, 2] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2 py-1 text-xs font-medium rounded-md transition ${
                speed === s
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};


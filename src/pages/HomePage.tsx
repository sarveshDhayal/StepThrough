import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, Network, Cpu, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

export const HomePage: React.FC = () => {
  const modules = [
    {
      title: 'Cache Simulator',
      path: '/cache',
      icon: Layers,
      color: 'from-blue-500 to-indigo-600',
      badge: 'Architecture',
      description:
        'Explore direct-mapped, set-associative, and fully associative caches. Inspect tag/index/offset bit splitting, LRU/FIFO replacement, and 3C miss classification.',
      features: ['Address bit slicing', 'LRU & FIFO eviction', '3C miss categorization', 'Direct-mapped vs 4-Way compare'],
    },
    {
      title: 'TCP Congestion Control',
      path: '/tcp',
      icon: Network,
      color: 'from-emerald-500 to-teal-600',
      badge: 'Networking',
      description:
        'Simulate TCP Tahoe and Reno across RTT rounds. Visualize slow start, congestion avoidance (AIMD), fast retransmit, fast recovery, and dropped packets.',
      features: ['AIMD & slow start', 'Packet transmission visualizer', 'Loss injection (timeout / 3 dup ACKs)', 'Tahoe vs Reno side-by-side'],
    },
    {
      title: '5-Stage CPU Pipeline',
      path: '/pipeline',
      icon: Cpu,
      color: 'from-amber-500 to-orange-600',
      badge: 'Processors',
      description:
        'Step through IF, ID, EX, MEM, and WB stages of a MIPS-style processor. Watch RAW and load-use hazards inject stalls, and compare performance with data forwarding.',
      features: ['Cycle-by-cycle stage grid', 'Data forwarding toggle', 'Branch & load-use stall bubbles', 'CPI & speedup comparison'],
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-4 border border-indigo-200 dark:border-indigo-800">
          <Zap className="w-3.5 h-3.5" />
          Interactive CS Simulators
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
          Understand Core Systems Concepts in <span className="text-indigo-600 dark:text-indigo-400">Under 60 Seconds</span>
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
          StepThrough breaks down complex hardware and protocol mechanics into intuitive, cycle-by-cycle animations.
          Step forward, step back, and see exactly why things hit, miss, stall, or recover.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.title}
              className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-600 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center text-white shadow`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {m.badge}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                  {m.title}
                </h2>

                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                  {m.description}
                </p>

                <div className="space-y-2 mb-6">
                  {m.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                to={m.path}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white text-slate-900 dark:text-white font-medium text-sm transition"
              >
                <span>Launch Simulator</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          );
        })}
      </div>

      <div className="mt-16 p-6 rounded-2xl bg-indigo-50/60 dark:bg-slate-900/60 border border-indigo-100 dark:border-slate-800 text-center">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          Designed for Clarity
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Use the <span className="font-semibold text-slate-900 dark:text-white">Spacebar</span> to toggle play/pause,
          and <span className="font-semibold text-slate-900 dark:text-white">&larr; / &rarr; Arrow Keys</span> to scrub through time one step at a time.
        </p>
      </div>
    </div>
  );
};

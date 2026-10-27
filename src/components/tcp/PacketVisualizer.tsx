import React from 'react';
import { PacketStatus } from '../../engines/tcpEngine';
import { Package, AlertCircle } from 'lucide-react';

interface PacketVisualizerProps {
  packets: PacketStatus[];
  round: number;
}

export const PacketVisualizer: React.FC<PacketVisualizerProps> = ({ packets, round }) => {
  return (
    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Round {round} Packets In Flight ({packets.length} MSS)
        </span>
        <span className="text-xs text-slate-400">
          {packets.filter((p) => p.status === 'dropped').length > 0 ? (
            <span className="text-rose-500 font-semibold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Packet Drop Detected
            </span>
          ) : (
            <span className="text-emerald-500 font-medium">All Packets ACKnowledged</span>
          )}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
        {packets.map((pkt) => {
          const isDropped = pkt.status === 'dropped';
          return (
            <div
              key={pkt.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-all ${
                isDropped
                  ? 'bg-rose-100 dark:bg-rose-950/80 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 animate-pulse'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Pkt {pkt.id}</span>
              {isDropped && <span className="font-bold uppercase text-[10px] ml-1">LOST</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};


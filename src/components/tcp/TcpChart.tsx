import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { TcpStep } from '../../engines/tcpEngine';

interface TcpChartProps {
  steps: TcpStep[];
  currentRound: number;
  compareSteps?: { tahoe: TcpStep[]; reno: TcpStep[] };
  isCompareMode: boolean;
}

export const TcpChart: React.FC<TcpChartProps> = ({
  steps,
  currentRound,
  compareSteps,
  isCompareMode,
}) => {
  // Build chart dataset
  const data = isCompareMode && compareSteps
    ? compareSteps.tahoe.map((tStep, idx) => {
        const rStep = compareSteps.reno[idx];
        return {
          round: tStep.round,
          tahoeCwnd: tStep.cwnd,
          renoCwnd: rStep ? rStep.cwnd : 0,
          ssthresh: tStep.ssthresh,
          loss: tStep.lossEvent,
        };
      })
    : steps.map((s) => ({
        round: s.round,
        cwnd: s.cwnd,
        ssthresh: s.ssthresh,
        loss: s.lossEvent,
      }));

  return (
    <div className="w-full h-72 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
        Congestion Window (cwnd) vs RTT Round
      </div>
      <ResponsiveContainer width="100%" height="88%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis
            dataKey="round"
            label={{ value: 'RTT Round', position: 'insideBottomRight', offset: -5, fontSize: 11 }}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            label={{ value: 'MSS', angle: -90, position: 'insideLeft', offset: 15, fontSize: 11 }}
            tick={{ fontSize: 11 }}
            domain={[0, 'dataMax + 2']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              borderColor: '#334155',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#f8fafc',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <ReferenceLine
            x={currentRound}
            stroke="#6366f1"
            strokeDasharray="4 4"
            label={{ value: 'Current', position: 'top', fill: '#6366f1', fontSize: 10 }}
          />

          {isCompareMode ? (
            <>
              <Line
                type="monotone"
                dataKey="tahoeCwnd"
                name="Tahoe cwnd"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="renoCwnd"
                name="Reno cwnd"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />
            </>
          ) : (
            <>
              <Line
                type="monotone"
                dataKey="cwnd"
                name="cwnd"
                stroke="#4f46e5"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="stepAfter"
                dataKey="ssthresh"
                name="ssthresh"
                stroke="#f59e0b"
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={false}
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// TCP Congestion Control Simulation Engine (Tahoe & Reno)
// Pure TypeScript - pre-computes rounds and packet states

export type TcpVariant = 'Tahoe' | 'Reno';
export type LossType = 'timeout' | '3dupACK';
export type TcpPhase = 'Slow Start' | 'Congestion Avoidance' | 'Fast Recovery';

export interface LossEvent {
  round: number;
  type: LossType;
}

export interface PacketStatus {
  id: number;
  status: 'delivered' | 'dropped';
}

export interface TcpStep {
  round: number;
  cwnd: number;
  ssthresh: number;
  phase: TcpPhase;
  lossEvent: LossType | null;
  packets: PacketStatus[];
  log: string;
}

export interface TcpConfig {
  variant: TcpVariant;
  initialSsthresh: number;
  totalRounds: number;
  lossEvents: LossEvent[];
}

export function simulateTcp(config: TcpConfig): TcpStep[] {
  const { variant, initialSsthresh, totalRounds, lossEvents } = config;

  // Map rounds to losses for quick lookup
  const lossMap = new Map<number, LossType>();
  lossEvents.forEach((evt) => {
    lossMap.set(evt.round, evt.type);
  });

  const steps: TcpStep[] = [];
  let cwnd = 1;
  let ssthresh = initialSsthresh;
  let phase: TcpPhase = 'Slow Start';

  for (let r = 1; r <= totalRounds; r++) {
    const loss = lossMap.get(r) || null;
    const packetCount = Math.max(1, Math.round(cwnd));

    // Build packet status list
    const packets: PacketStatus[] = [];
    for (let p = 1; p <= packetCount; p++) {
      // If there's a loss, the last packet or packet in middle was dropped
      const isDropped = loss !== null && (p === packetCount || p === Math.ceil(packetCount / 2));
      packets.push({
        id: p,
        status: isDropped ? 'dropped' : 'delivered',
      });
    }

    // Determine log message and state transition
    let log = '';
    let nextCwnd = cwnd;
    let nextSsthresh = ssthresh;
    let nextPhase: TcpPhase = phase;

    if (loss === 'timeout') {
      nextSsthresh = Math.max(2, Math.floor(cwnd / 2));
      nextCwnd = 1;
      nextPhase = 'Slow Start';
      log = `Round ${r}: Timeout detected. ssthresh reduced to ${nextSsthresh}, cwnd reset to 1 (Slow Start).`;
    } else if (loss === '3dupACK') {
      nextSsthresh = Math.max(2, Math.floor(cwnd / 2));
      if (variant === 'Tahoe') {
        nextCwnd = 1;
        nextPhase = 'Slow Start';
        log = `Round ${r}: 3 Duplicate ACKs (Tahoe). Fast Retransmit triggers. ssthresh = ${nextSsthresh}, cwnd reset to 1.`;
      } else {
        // Reno Fast Recovery
        nextCwnd = nextSsthresh;
        nextPhase = 'Congestion Avoidance';
        log = `Round ${r}: 3 Duplicate ACKs (Reno). Fast Recovery active. ssthresh = ${nextSsthresh}, cwnd set to ssthresh (${nextSsthresh}).`;
      }
    } else {
      // Normal RTT progression without loss
      if (phase === 'Slow Start') {
        if (cwnd * 2 < ssthresh) {
          nextCwnd = cwnd * 2;
          nextPhase = 'Slow Start';
          log = `Round ${r}: Slow Start exponential growth. cwnd doubled from ${cwnd} to ${nextCwnd}.`;
        } else {
          // Reached or crossing ssthresh -> transition to Congestion Avoidance
          nextCwnd = Math.max(ssthresh, cwnd + 1);
          nextPhase = 'Congestion Avoidance';
          log = `Round ${r}: Slow Start reached ssthresh (${ssthresh}). Transitioning to Congestion Avoidance (cwnd = ${nextCwnd}).`;
        }
      } else {
        // Congestion Avoidance: AIMD additive increase (+1 per RTT)
        nextCwnd = cwnd + 1;
        nextPhase = 'Congestion Avoidance';
        log = `Round ${r}: Congestion Avoidance (AIMD). Additive increase (+1), cwnd = ${nextCwnd}.`;
      }
    }

    steps.push({
      round: r,
      cwnd,
      ssthresh,
      phase,
      lossEvent: loss,
      packets,
      log,
    });

    cwnd = nextCwnd;
    ssthresh = nextSsthresh;
    phase = nextPhase;
  }

  return steps;
}

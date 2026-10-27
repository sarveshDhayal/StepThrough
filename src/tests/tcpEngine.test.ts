import { describe, it, expect } from 'vitest';
import { simulateTcp, TcpConfig } from '../engines/tcpEngine';

describe('tcpEngine', () => {
  it('exponentially increases cwnd during slow start', () => {
    const config: TcpConfig = {
      variant: 'Tahoe',
      initialSsthresh: 16,
      totalRounds: 4,
      lossEvents: [],
    };

    const steps = simulateTcp(config);
    expect(steps[0].cwnd).toBe(1);
    expect(steps[0].phase).toBe('Slow Start');
    expect(steps[1].cwnd).toBe(2);
    expect(steps[2].cwnd).toBe(4);
    expect(steps[3].cwnd).toBe(8);
  });

  it('switches to congestion avoidance (linear AIMD increase) at ssthresh', () => {
    const config: TcpConfig = {
      variant: 'Tahoe',
      initialSsthresh: 4,
      totalRounds: 5,
      lossEvents: [],
    };

    const steps = simulateTcp(config);
    // Round 1: cwnd = 1
    // Round 2: cwnd = 2
    // Round 3: cwnd = 4 (reached ssthresh)
    // Round 4: cwnd = 5 (additive increase +1)
    // Round 5: cwnd = 6
    expect(steps[2].cwnd).toBe(4);
    expect(steps[3].cwnd).toBe(5);
    expect(steps[3].phase).toBe('Congestion Avoidance');
    expect(steps[4].cwnd).toBe(6);
  });

  it('drops cwnd to 1 on timeout in both Tahoe and Reno', () => {
    const configTahoe: TcpConfig = {
      variant: 'Tahoe',
      initialSsthresh: 16,
      totalRounds: 5,
      lossEvents: [{ round: 3, type: 'timeout' }], // round 3 cwnd is 4
    };
    const stepsTahoe = simulateTcp(configTahoe);
    expect(stepsTahoe[2].lossEvent).toBe('timeout');
    expect(stepsTahoe[3].cwnd).toBe(1);
    expect(stepsTahoe[3].ssthresh).toBe(2); // floor(4/2) = 2

    const configReno: TcpConfig = {
      variant: 'Reno',
      initialSsthresh: 16,
      totalRounds: 5,
      lossEvents: [{ round: 3, type: 'timeout' }],
    };
    const stepsReno = simulateTcp(configReno);
    expect(stepsReno[3].cwnd).toBe(1);
    expect(stepsReno[3].ssthresh).toBe(2);
  });

  it('drops cwnd to 1 on 3 duplicate ACKs in Tahoe (Fast Retransmit)', () => {
    const config: TcpConfig = {
      variant: 'Tahoe',
      initialSsthresh: 16,
      totalRounds: 5,
      lossEvents: [{ round: 4, type: '3dupACK' }], // round 4 cwnd is 8
    };
    const steps = simulateTcp(config);
    expect(steps[3].lossEvent).toBe('3dupACK');
    // In next round, Tahoe resets cwnd to 1
    expect(steps[4].cwnd).toBe(1);
    expect(steps[4].ssthresh).toBe(4); // floor(8/2) = 4
    expect(steps[4].phase).toBe('Slow Start');
  });

  it('enters Fast Recovery and sets cwnd to ssthresh on 3 duplicate ACKs in Reno', () => {
    const config: TcpConfig = {
      variant: 'Reno',
      initialSsthresh: 16,
      totalRounds: 5,
      lossEvents: [{ round: 4, type: '3dupACK' }], // round 4 cwnd is 8
    };
    const steps = simulateTcp(config);
    expect(steps[3].lossEvent).toBe('3dupACK');
    // In next round, Reno sets cwnd = ssthresh = 4 without dropping to 1!
    expect(steps[4].cwnd).toBe(4);
    expect(steps[4].ssthresh).toBe(4);
    expect(steps[4].phase).toBe('Congestion Avoidance');
  });
});


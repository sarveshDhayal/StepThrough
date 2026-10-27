import { describe, it, expect } from 'vitest';
import { simulateCache, splitAddress, parseAddresses, CacheConfig } from '../engines/cacheEngine';

describe('cacheEngine', () => {
  it('parses hex and decimal addresses cleanly', () => {
    const addrs = parseAddresses('0x0004, 0x0008 16 0x0020');
    expect(addrs).toEqual([4, 8, 16, 32]);
  });

  it('correctly calculates tag, index, and offset bit counts', () => {
    // 64 byte cache, 8 byte blocks, 4 sets (2-way associative = 8 blocks / 2 = 4 sets)
    // offset = log2(8) = 3 bits
    // index = log2(4) = 2 bits
    // tag = 16 - 5 = 11 bits
    const split = splitAddress(0x0014, 8, 4); // 0x0014 = 0b0000_0000_0001_0100
    expect(split.offsetBits).toBe(3);
    expect(split.indexBits).toBe(2);
    expect(split.tagBits).toBe(11);
    expect(split.offset).toBe(0x0014 & 0b111); // 4
    expect(split.index).toBe((0x0014 >> 3) & 0b11); // 2
  });

  it('handles hits and compulsory misses in a direct-mapped cache', () => {
    const config: CacheConfig = {
      cacheSize: 64, // 8 blocks of 8 bytes
      blockSize: 8,
      associativity: 'direct',
      replacementPolicy: 'LRU',
    };

    // Access address 0x0004 (block 0), then 0x0006 (same block -> hit), then 0x0004 (hit)
    const steps = simulateCache([0x0004, 0x0006, 0x0004], config);
    expect(steps).toHaveLength(3);

    expect(steps[0].isHit).toBe(false);
    expect(steps[0].missType).toBe('compulsory');

    expect(steps[1].isHit).toBe(true);
    expect(steps[1].stats.hits).toBe(1);

    expect(steps[2].isHit).toBe(true);
    expect(steps[2].stats.hits).toBe(2);
    expect(steps[2].stats.hitRate).toBe(66.7);
  });

  it('handles conflict misses in direct-mapped cache', () => {
    // Direct mapped cache with 4 sets (32 bytes total, 8 byte blocks)
    const config: CacheConfig = {
      cacheSize: 32,
      blockSize: 8,
      associativity: 'direct',
      replacementPolicy: 'LRU',
    };

    // Addresses 0x0000 and 0x0020 both map to index 0:
    // 0x0000: block 0 -> set 0
    // 0x0020 (32): block 4 -> set 4 % 4 = 0
    const steps = simulateCache([0x0000, 0x0020, 0x0000], config);

    expect(steps[0].isHit).toBe(false);
    expect(steps[0].missType).toBe('compulsory');

    expect(steps[1].isHit).toBe(false);
    expect(steps[1].missType).toBe('compulsory');

    // 0x0000 again: was evicted by 0x0020 -> conflict miss!
    expect(steps[2].isHit).toBe(false);
    expect(steps[2].missType).toBe('conflict');
  });

  it('evicts least recently used way in 2-way associative cache', () => {
    // 32 byte cache, 8 byte blocks = 4 blocks total. 2-way = 2 sets.
    const config: CacheConfig = {
      cacheSize: 32,
      blockSize: 8,
      associativity: '2-way',
      replacementPolicy: 'LRU',
    };

    // Block 0, Block 2, Block 4 all map to Set 0:
    // Block 0 = 0x00, Block 2 = 0x10, Block 4 = 0x20
    const steps = simulateCache([0x00, 0x10, 0x00, 0x20], config);

    // 0x00 -> Way 0
    // 0x10 -> Way 1
    // 0x00 -> Hit in Way 0 (makes Way 0 recently used, Way 1 is now LRU!)
    // 0x20 -> Evicts Way 1 (Block 2)
    expect(steps[0].isHit).toBe(false);
    expect(steps[1].isHit).toBe(false);
    expect(steps[2].isHit).toBe(true);
    expect(steps[2].hitWay).toBe(0);

    expect(steps[3].isHit).toBe(false);
    expect(steps[3].evictedWay).toBe(1); // evicted Block 2
  });
});

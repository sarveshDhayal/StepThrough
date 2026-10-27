// Cache Simulation Engine
// Pure TypeScript - computes all steps up front for step-by-step playback

export type Associativity = 'direct' | '2-way' | '4-way' | 'fully';
export type ReplacementPolicy = 'LRU' | 'FIFO';
export type MissType = 'compulsory' | 'capacity' | 'conflict' | null;

export interface CacheConfig {
  cacheSize: number; // e.g. 64, 128, 256 bytes
  blockSize: number; // e.g. 4, 8, 16 bytes
  associativity: Associativity;
  replacementPolicy: ReplacementPolicy;
}

export interface CacheLine {
  valid: boolean;
  tag: number;
  lastUsed: number;
  insertedAt: number;
  address: number;
}

export interface AddressSplit {
  address: number;
  tag: number;
  index: number;
  offset: number;
  tagBits: number;
  indexBits: number;
  offsetBits: number;
  binaryString: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  compulsoryMisses: number;
  capacityMisses: number;
  conflictMisses: number;
  hitRate: number;
  missRate: number;
}

export interface CacheStep {
  stepIndex: number;
  address: number;
  split: AddressSplit;
  isHit: boolean;
  hitWay: number;
  evictedWay: number;
  missType: MissType;
  cacheSnapshot: CacheLine[][];
  explanation: string;
  stats: CacheStats;
}

export function parseAddresses(input: string): number[] {
  // Accepts comma or whitespace separated hex (0x1a) or decimal (26)
  return input
    .split(/[\s,]+/)
    .map((str) => str.trim())
    .filter((str) => str.length > 0)
    .map((str) => (str.startsWith('0x') || str.startsWith('0X') ? parseInt(str, 16) : parseInt(str, 10)))
    .filter((num) => !isNaN(num) && num >= 0 && num <= 0xffff);
}

export function getWayCount(associativity: Associativity, totalBlocks: number): number {
  if (associativity === 'direct') return 1;
  if (associativity === '2-way') return 2;
  if (associativity === '4-way') return 4;
  return totalBlocks; // fully associative
}

export function splitAddress(address: number, blockSize: number, numSets: number): AddressSplit {
  const offsetBits = Math.log2(blockSize);
  const indexBits = Math.log2(numSets);
  const tagBits = 16 - (offsetBits + indexBits);

  // Offset is lowest offsetBits
  const offset = address & ((1 << offsetBits) - 1);
  // Index is next indexBits
  const index = (address >> offsetBits) & ((1 << indexBits) - 1);
  // Tag is remaining high bits
  const tag = address >> (offsetBits + indexBits);

  // 16-bit binary string representation
  const binaryString = (address & 0xffff).toString(2).padStart(16, '0');

  return {
    address,
    tag,
    index,
    offset,
    tagBits,
    indexBits,
    offsetBits,
    binaryString,
  };
}

export function simulateCache(addresses: number[], config: CacheConfig): CacheStep[] {
  const totalBlocks = Math.floor(config.cacheSize / config.blockSize);
  const ways = Math.min(getWayCount(config.associativity, totalBlocks), totalBlocks);
  const numSets = Math.max(1, Math.floor(totalBlocks / ways));

  // Initialize empty cache: 2D array of sets x ways
  const cache: CacheLine[][] = Array.from({ length: numSets }, () =>
    Array.from({ length: ways }, () => ({
      valid: false,
      tag: 0,
      lastUsed: 0,
      insertedAt: 0,
      address: 0,
    }))
  );

  // Auxiliary structures to classify 3C misses:
  // Compulsory = never seen block before
  const seenBlocks = new Set<number>();
  // Fully-associative LRU model of same capacity to distinguish capacity vs conflict
  const fullyAssocLRU: number[] = []; // stores recent block IDs

  let hits = 0;
  let misses = 0;
  let compulsoryMisses = 0;
  let capacityMisses = 0;
  let conflictMisses = 0;

  const steps: CacheStep[] = [];

  for (let stepIndex = 0; stepIndex < addresses.length; stepIndex++) {
    const address = addresses[stepIndex];
    const split = splitAddress(address, config.blockSize, numSets);
    const blockId = Math.floor(address / config.blockSize);

    const set = cache[split.index];
    let isHit = false;
    let hitWay = -1;
    let evictedWay = -1;
    let missType: MissType = null;

    // Check for hit
    for (let w = 0; w < ways; w++) {
      if (set[w].valid && set[w].tag === split.tag) {
        isHit = true;
        hitWay = w;
        set[w].lastUsed = stepIndex + 1;
        break;
      }
    }

    if (isHit) {
      hits++;
    } else {
      misses++;
      // Determine 3C miss type
      if (!seenBlocks.has(blockId)) {
        missType = 'compulsory';
        compulsoryMisses++;
        seenBlocks.add(blockId);
      } else {
        // Was it in the ideal fully associative cache?
        const inFullyAssoc = fullyAssocLRU.includes(blockId);
        if (inFullyAssoc) {
          // It missed only because of set conflicts
          missType = 'conflict';
          conflictMisses++;
        } else {
          // It missed even in a fully associative cache, so cache capacity was exceeded
          missType = 'capacity';
          capacityMisses++;
        }
      }

      // Find an empty way or select victim to evict
      let targetWay = set.findIndex((line) => !line.valid);
      if (targetWay === -1) {
        // Eviction needed
        if (config.replacementPolicy === 'LRU') {
          // Smallest lastUsed
          let minUsed = Infinity;
          for (let w = 0; w < ways; w++) {
            if (set[w].lastUsed < minUsed) {
              minUsed = set[w].lastUsed;
              targetWay = w;
            }
          }
        } else {
          // FIFO: smallest insertedAt
          let minInserted = Infinity;
          for (let w = 0; w < ways; w++) {
            if (set[w].insertedAt < minInserted) {
              minInserted = set[w].insertedAt;
              targetWay = w;
            }
          }
        }
        evictedWay = targetWay;
      }

      set[targetWay] = {
        valid: true,
        tag: split.tag,
        lastUsed: stepIndex + 1,
        insertedAt: stepIndex + 1,
        address,
      };
    }

    // Update auxiliary fully-associative cache state (for 3C classification)
    const faIdx = fullyAssocLRU.indexOf(blockId);
    if (faIdx !== -1) {
      fullyAssocLRU.splice(faIdx, 1);
    } else if (fullyAssocLRU.length >= totalBlocks) {
      fullyAssocLRU.shift(); // evict oldest
    }
    fullyAssocLRU.push(blockId);

    // Build human-friendly explanation
    let explanation = '';
    const hexAddr = '0x' + address.toString(16).padStart(4, '0');
    if (isHit) {
      explanation = `Access ${hexAddr}: HIT in Set ${split.index}, Way ${hitWay}. Tag 0x${split.tag.toString(16)} matched.`;
    } else {
      const reason =
        missType === 'compulsory'
          ? 'Compulsory miss (first time block was accessed).'
          : missType === 'capacity'
          ? 'Capacity miss (cache is too small to hold the working set).'
          : 'Conflict miss (multiple addresses mapped to Set ' + split.index + ').';

      if (evictedWay !== -1) {
        explanation = `Access ${hexAddr}: MISS (${reason}) Placed in Set ${split.index}, replacing Way ${evictedWay} (${config.replacementPolicy}).`;
      } else {
        explanation = `Access ${hexAddr}: MISS (${reason}) Placed in empty Set ${split.index}, Way ${set.findIndex((l) => l.tag === split.tag)}.`;
      }
    }

    const totalAccesses = hits + misses;
    const hitRate = totalAccesses > 0 ? (hits / totalAccesses) * 100 : 0;
    const missRate = totalAccesses > 0 ? (misses / totalAccesses) * 100 : 0;

    // Snapshot of cache lines
    const cacheSnapshot = cache.map((s) => s.map((line) => ({ ...line })));

    steps.push({
      stepIndex,
      address,
      split,
      isHit,
      hitWay,
      evictedWay,
      missType,
      cacheSnapshot,
      explanation,
      stats: {
        hits,
        misses,
        compulsoryMisses,
        capacityMisses,
        conflictMisses,
        hitRate: Math.round(hitRate * 10) / 10,
        missRate: Math.round(missRate * 10) / 10,
      },
    });
  }

  return steps;
}

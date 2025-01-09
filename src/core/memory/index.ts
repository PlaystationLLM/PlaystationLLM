import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';

export class MemoryBuffer extends EventEmitter {
  private buffer: Buffer;
  private baseAddress: number = 0;
  private readonly pageSize: number;
  private readonly maxSize: number;
  private regions: Map<string, { start: number; size: number }>;

  constructor(size: number) {
    super();
    this.maxSize = size;
    this.pageSize = 0x1000;
    this.buffer = Buffer.alloc(size);
    this.regions = new Map();
  }

  async findPattern(pattern: string): Promise<number> {
    const bytes = this.parsePattern(pattern);
    let found = 0;

    for (let i = 0; i < this.buffer.length - bytes.length; i++) {
      let match = true;
      for (let j = 0; j < bytes.length; j++) {
        if (bytes[j] === '?' || this.buffer[i + j] === bytes[j]) {
          continue;
        }
        match = false;
        break;
      }
      if (match) {
        found = this.baseAddress + i;
        break;
      }
    }

    return found;
  }

  private parsePattern(pattern: string): (string | number)[] {
    return pattern
      .split(' ')
      .map(byte => byte === '?' ? '?' : parseInt(byte, 16));
  }

  async readInt32(address: number): Promise<number> {
    this.validateAddress(address);
    return this.buffer.readInt32LE(address - this.baseAddress);
  }

  async readInt64(address: number): Promise<number> {
    this.validateAddress(address);
    return Number(this.buffer.readBigInt64LE(address - this.baseAddress));
  }

  async readFloat(address: number): Promise<number> {
    this.validateAddress(address);
    return this.buffer.readFloatLE(address - this.baseAddress);
  }

  async readBuffer(address: number, size: number): Promise<Buffer> {
    this.validateAddress(address);
    return this.buffer.slice(address - this.baseAddress, address - this.baseAddress + size);
  }

  async writeInt32(address: number, value: number): Promise<void> {
    this.validateAddress(address);
    this.buffer.writeInt32LE(value, address - this.baseAddress);
    this.emit('write', { address, value, type: 'int32' });
  }

  async writeBuffer(address: number, data: Buffer): Promise<void> {
    this.validateAddress(address);
    data.copy(this.buffer, address - this.baseAddress);
    this.emit('write', { address, size: data.length, type: 'buffer' });
  }

  private validateAddress(address: number): void {
    const offset = address - this.baseAddress;
    if (offset < 0 || offset >= this.maxSize) {
      throw new Error(`Invalid memory address: 0x${address.toString(16)}`);
    }
  }

  async allocateRegion(name: string, size: number): Promise<number> {
    const alignedSize = Math.ceil(size / this.pageSize) * this.pageSize;
    let start = 0;

    // Find a free region
    for (const [_, region] of this.regions) {
      if (start + alignedSize <= region.start) {
        break;
      }
      start = region.start + region.size;
    }

    if (start + alignedSize > this.maxSize) {
      throw new Error('Out of memory');
    }

    this.regions.set(name, { start, size: alignedSize });
    logger.debug(`Allocated memory region ${name} at 0x${start.toString(16)}`);
    return this.baseAddress + start;
  }

  async freeRegion(name: string): Promise<void> {
    const region = this.regions.get(name);
    if (!region) {
      throw new Error(`Region ${name} not found`);
    }

    // Zero out the memory
    this.buffer.fill(0, region.start, region.start + region.size);
    this.regions.delete(name);
    logger.debug(`Freed memory region ${name}`);
  }

  async clear(): Promise<void> {
    this.buffer.fill(0);
    this.regions.clear();
    this.emit('clear');
    logger.debug('Memory buffer cleared');
  }
} 
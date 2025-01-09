import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';

interface PacketData {
  timestamp: number;
  size: number;
  protocol: string;
  source: string;
  destination: string;
  payload: Buffer;
}

export class NetworkScanner extends EventEmitter {
  private isActive: boolean = false;
  private latency: number = 0;
  private packetQueue: PacketData[] = [];
  private readonly maxQueueSize: number = 1000;
  private filters: Map<string, (packet: PacketData) => boolean>;

  constructor() {
    super();
    this.filters = new Map();
    this.setupDefaultFilters();
  }

  private setupDefaultFilters(): void {
    this.filters.set('tcp', (packet: PacketData) => packet.protocol === 'tcp');
    this.filters.set('udp', (packet: PacketData) => packet.protocol === 'udp');
    this.filters.set('size', (packet: PacketData) => packet.size > 100);
  }

  async start(): Promise<void> {
    if (this.isActive) return;
    
    this.isActive = true;
    logger.info('Network scanner started');
    this.emit('start');
    
    // Start packet capture simulation
    this.simulateCapture();
  }

  private simulateCapture(): void {
    if (!this.isActive) return;

    setInterval(() => {
      const packet = this.generatePacket();
      this.processPacket(packet);
    }, 100);
  }

  private generatePacket(): PacketData {
    const protocols = ['tcp', 'udp'];
    const sizes = [64, 128, 256, 512, 1024];
    
    return {
      timestamp: Date.now(),
      size: sizes[Math.floor(Math.random() * sizes.length)],
      protocol: protocols[Math.floor(Math.random() * protocols.length)],
      source: `192.168.1.${Math.floor(Math.random() * 255)}`,
      destination: `10.0.0.${Math.floor(Math.random() * 255)}`,
      payload: Buffer.alloc(32).fill(Math.random() * 255)
    };
  }

  private processPacket(packet: PacketData): void {
    // Apply filters
    for (const [name, filter] of this.filters) {
      if (!filter(packet)) return;
    }

    // Add to queue
    this.packetQueue.push(packet);
    if (this.packetQueue.length > this.maxQueueSize) {
      this.packetQueue.shift();
    }

    this.emit('packet', packet);
    this.updateLatency(packet);
  }

  private updateLatency(packet: PacketData): void {
    const now = Date.now();
    this.latency = now - packet.timestamp;
    
    if (this.latency > 100) {
      logger.warn('High latency detected', { latency: this.latency });
      this.emit('highLatency', this.latency);
    }
  }

  async addFilter(name: string, filter: (packet: PacketData) => boolean): Promise<void> {
    this.filters.set(name, filter);
    logger.debug(`Added network filter: ${name}`);
  }

  async removeFilter(name: string): Promise<void> {
    this.filters.delete(name);
    logger.debug(`Removed network filter: ${name}`);
  }

  async getPacketStats(): Promise<any> {
    const stats = {
      total: this.packetQueue.length,
      protocols: new Map<string, number>(),
      averageSize: 0,
      latency: this.latency
    };

    let totalSize = 0;
    for (const packet of this.packetQueue) {
      totalSize += packet.size;
      const count = stats.protocols.get(packet.protocol) || 0;
      stats.protocols.set(packet.protocol, count + 1);
    }

    stats.averageSize = totalSize / (this.packetQueue.length || 1);
    return stats;
  }

  async checkLatency(): Promise<number> {
    return this.latency;
  }

  async disconnect(): Promise<void> {
    this.isActive = false;
    this.packetQueue = [];
    this.latency = 0;
    this.emit('stop');
    logger.info('Network scanner stopped');
  }
} 
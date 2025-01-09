import { PS5Device } from './lib/ps5';
import { ElizaHandler } from './lib/eliza';
import { logger } from './utils/logger';

class Bridge {
  private ps5: PS5Device;
  private eliza: ElizaHandler;

  constructor() {
    this.ps5 = new PS5Device();
    this.eliza = new ElizaHandler();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.ps5.on('input', async (data: any) => {
      await this.eliza.processInput(data);
    });

    this.ps5.on('error', (error: Error) => {
      logger.error('PS5 error:', error);
    });

    process.on('SIGINT', () => {
      this.cleanup();
      process.exit(0);
    });
  }

  async start(): Promise<void> {
    logger.info('Starting PS5-PC Bridge...');
    
    if (!this.ps5.connect()) {
      logger.error('Failed to connect to PS5');
      process.exit(1);
    }

    const defaultGame = process.env.DEFAULT_GAME || 'fortnite';
    if (await this.eliza.loadGame(defaultGame)) {
      logger.info(`Loaded default game: ${defaultGame}`);
    }
  }

  private cleanup(): void {
    logger.info('Cleaning up...');
    this.ps5.disconnect();
    this.eliza.disconnect();
  }
}

// Start the application
const bridge = new Bridge();
bridge.start().catch(error => {
  logger.error('Failed to start bridge:', error);
  process.exit(1);
});

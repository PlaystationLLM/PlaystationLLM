import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';

interface InputEvent {
  type: 'keyboard' | 'mouse' | 'gamepad';
  code: number;
  value: number;
  timestamp: number;
}

interface MouseState {
  x: number;
  y: number;
  buttons: number[];
}

interface GamepadState {
  leftStick: { x: number; y: number };
  rightStick: { x: number; y: number };
  triggers: { left: number; right: number };
  buttons: Map<number, boolean>;
}

export class InputSimulator extends EventEmitter {
  private mouseState: MouseState = {
    x: 0,
    y: 0,
    buttons: []
  };

  private gamepadState: GamepadState = {
    leftStick: { x: 0, y: 0 },
    rightStick: { x: 0, y: 0 },
    triggers: { left: 0, right: 0 },
    buttons: new Map()
  };

  private readonly keyStates: Map<number, boolean> = new Map();
  private readonly eventQueue: InputEvent[] = [];
  private readonly maxQueueSize: number = 100;

  // Virtual key codes
  private static readonly VK_CODES = {
    MOUSE_LEFT: 0x01,
    MOUSE_RIGHT: 0x02,
    VK_ESCAPE: 0x1B,
    VK_SPACE: 0x20,
    VK_SHIFT: 0x10,
    VK_CONTROL: 0x11,
    VK_MENU: 0x12,
    VK_RETURN: 0x0D
  };

  constructor() {
    super();
    this.initializeGamepad();
  }

  private initializeGamepad(): void {
    // Initialize gamepad buttons
    for (let i = 0; i < 16; i++) {
      this.gamepadState.buttons.set(i, false);
    }
  }

  async simulateKeyPress(keyCode: number, duration: number = 50): Promise<void> {
    try {
      // Key down
      this.keyStates.set(keyCode, true);
      this.queueEvent({
        type: 'keyboard',
        code: keyCode,
        value: 1,
        timestamp: Date.now()
      });

      // Wait for duration
      await new Promise(resolve => setTimeout(resolve, duration));

      // Key up
      this.keyStates.set(keyCode, false);
      this.queueEvent({
        type: 'keyboard',
        code: keyCode,
        value: 0,
        timestamp: Date.now()
      });

      logger.debug(`Simulated key press: 0x${keyCode.toString(16)}`);
    } catch (error) {
      logger.error('Failed to simulate key press:', error);
    }
  }

  async simulateMouseMovement(
    targetX: number,
    targetY: number,
    duration: number = 100,
    smooth: boolean = true
  ): Promise<void> {
    try {
      if (smooth) {
        // Smooth movement with bezier curve
        const steps = duration / 10; // One step every 10ms
        const startX = this.mouseState.x;
        const startY = this.mouseState.y;

        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const x = this.bezierInterpolate(startX, targetX, t);
          const y = this.bezierInterpolate(startY, targetY, t);
          
          await this.setMousePosition(x, y);
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      } else {
        // Instant movement
        await this.setMousePosition(targetX, targetY);
      }

      logger.debug(`Mouse moved to (${targetX}, ${targetY})`);
    } catch (error) {
      logger.error('Failed to simulate mouse movement:', error);
    }
  }

  private bezierInterpolate(start: number, end: number, t: number): number {
    const p1 = start + (end - start) * 0.5;
    const p2 = p1 + (end - start) * 0.3;
    
    return Math.round(
      (1 - t) * (1 - t) * (1 - t) * start +
      3 * (1 - t) * (1 - t) * t * p1 +
      3 * (1 - t) * t * t * p2 +
      t * t * t * end
    );
  }

  async simulateGamepadInput(
    leftStick: { x: number; y: number },
    rightStick: { x: number; y: number },
    triggers: { left: number; right: number },
    buttons: number[]
  ): Promise<void> {
    try {
      // Update stick positions
      this.gamepadState.leftStick = leftStick;
      this.gamepadState.rightStick = rightStick;
      this.gamepadState.triggers = triggers;

      // Update buttons
      for (const button of buttons) {
        this.gamepadState.buttons.set(button, true);
      }

      this.queueEvent({
        type: 'gamepad',
        code: 0,
        value: 1,
        timestamp: Date.now()
      });

      logger.debug('Gamepad input simulated', this.gamepadState);
    } catch (error) {
      logger.error('Failed to simulate gamepad input:', error);
    }
  }

  private async setMousePosition(x: number, y: number): Promise<void> {
    this.mouseState.x = x;
    this.mouseState.y = y;

    this.queueEvent({
      type: 'mouse',
      code: 0,
      value: (x << 16) | y,
      timestamp: Date.now()
    });
  }

  private queueEvent(event: InputEvent): void {
    this.eventQueue.push(event);
    if (this.eventQueue.length > this.maxQueueSize) {
      this.eventQueue.shift();
    }
    this.emit('input', event);
  }

  getMouseState(): MouseState {
    return { ...this.mouseState };
  }

  getGamepadState(): GamepadState {
    return {
      leftStick: { ...this.gamepadState.leftStick },
      rightStick: { ...this.gamepadState.rightStick },
      triggers: { ...this.gamepadState.triggers },
      buttons: new Map(this.gamepadState.buttons)
    };
  }

  isKeyPressed(keyCode: number): boolean {
    return this.keyStates.get(keyCode) || false;
  }

  async clearState(): Promise<void> {
    this.mouseState = { x: 0, y: 0, buttons: [] };
    this.keyStates.clear();
    this.eventQueue.length = 0;
    this.initializeGamepad();
    logger.debug('Input state cleared');
  }
} 
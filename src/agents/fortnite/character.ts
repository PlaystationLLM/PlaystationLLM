import { InputSimulator } from '../../core/input';
import { MemoryBuffer } from '../../core/memory';
import { logger } from '../../utils/logger';

interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface PlayerBone {
  name: string;
  id: number;
  position: Vector3;
  rotation: Vector3;
}

interface WeaponData {
  id: number;
  name: string;
  ammo: number;
  reloadTime: number;
  damage: number;
  spread: number;
}

export class FortniteCharacter {
  private readonly boneIds = {
    head: 66,
    neck: 65,
    spine: 7,
    leftHand: 33,
    rightHand: 63,
    leftElbow: 32,
    rightElbow: 62,
    leftShoulder: 9,
    rightShoulder: 39,
    pelvis: 2,
    leftKnee: 71,
    rightKnee: 77,
    leftFoot: 73,
    rightFoot: 79
  };

  private readonly weaponOffsets = {
    currentWeapon: 0x8F8,
    weaponList: 0x8B0,
    ammo: 0x9B4,
    reloadState: 0xFC0,
    lastFireTime: 0xAC8
  };

  private readonly movementOffsets = {
    location: 0x128,
    velocity: 0x140,
    rotation: 0x158,
    crouching: 0x2A0,
    jumping: 0x2A8,
    sprinting: 0x2B0
  };

  private readonly buildingOffsets = {
    buildMode: 0x2C8,
    selectedMaterial: 0x2D0,
    materialCounts: 0x2E0,
    buildPreview: 0x2F0,
    canBuild: 0x2F8
  };

  private input: InputSimulator;
  private memBuffer: MemoryBuffer;
  private baseAddress: bigint;
  private bones: Map<string, PlayerBone>;
  private currentWeapon: WeaponData | null;

  constructor(input: InputSimulator, memBuffer: MemoryBuffer, baseAddress: bigint) {
    this.input = input;
    this.memBuffer = memBuffer;
    this.baseAddress = baseAddress;
    this.bones = new Map();
    this.currentWeapon = null;
    this.initializeBones();
  }

  private async initializeBones(): Promise<void> {
    for (const [name, id] of Object.entries(this.boneIds)) {
      const bone: PlayerBone = {
        name,
        id,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 }
      };
      this.bones.set(name, bone);
    }
    await this.updateBoneCache();
  }

  private async updateBoneCache(): Promise<void> {
    try {
      const boneMatrix = await this.getBoneMatrix();
      if (!boneMatrix) return;

      for (const bone of this.bones.values()) {
        const boneAddr = boneMatrix + BigInt(bone.id * 0x30);
        bone.position = {
          x: await this.memBuffer.readFloat(boneAddr + BigInt(0x0)),
          y: await this.memBuffer.readFloat(boneAddr + BigInt(0x4)),
          z: await this.memBuffer.readFloat(boneAddr + BigInt(0x8))
        };
        bone.rotation = {
          x: await this.memBuffer.readFloat(boneAddr + BigInt(0x20)),
          y: await this.memBuffer.readFloat(boneAddr + BigInt(0x24)),
          z: await this.memBuffer.readFloat(boneAddr + BigInt(0x28))
        };
      }
    } catch (error) {
      logger.error('Failed to update bone cache:', error);
    }
  }

  private async getBoneMatrix(): Promise<bigint> {
    try {
      const meshPtr = await this.memBuffer.readInt64(this.baseAddress + BigInt(0x310));
      if (!meshPtr) return BigInt(0);
      return await this.memBuffer.readInt64(meshPtr + BigInt(0x5C0));
    } catch {
      return BigInt(0);
    }
  }

  async move(direction: Vector3, sprint: boolean = false): Promise<void> {
    try {
      const currentPos = await this.getPosition();
      const targetPos = {
        x: currentPos.x + direction.x,
        y: currentPos.y + direction.y,
        z: currentPos.z + direction.z
      };

      // Calculate rotation based on movement direction
      const rotation = {
        x: Math.atan2(direction.y, direction.x) * (180 / Math.PI),
        y: 0,
        z: 0
      };

      // Apply movement
      await this.setPosition(targetPos);
      await this.setRotation(rotation);

      // Handle sprinting
      if (sprint) {
        await this.memBuffer.writeInt32(
          this.baseAddress + BigInt(this.movementOffsets.sprinting),
          1
        );
      }

      // Simulate key presses for movement
      const keys = this.getMovementKeys(direction);
      for (const key of keys) {
        await this.input.simulateKeyPress(key, 50);
      }
    } catch (error) {
      logger.error('Failed to move character:', error);
    }
  }

  private getMovementKeys(direction: Vector3): number[] {
    const keys = [];
    if (direction.x > 0) keys.push(0x44); // D
    if (direction.x < 0) keys.push(0x41); // A
    if (direction.y > 0) keys.push(0x57); // W
    if (direction.y < 0) keys.push(0x53); // S
    if (direction.z > 0) keys.push(0x20); // Space
    return keys;
  }

  async aim(target: Vector3, smooth: boolean = true): Promise<void> {
    try {
      const headBone = this.bones.get('head');
      if (!headBone) return;

      // Calculate angle to target
      const deltaX = target.x - headBone.position.x;
      const deltaY = target.y - headBone.position.y;
      const deltaZ = target.z - headBone.position.z;

      const yaw = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      const pitch = Math.atan2(deltaZ, Math.sqrt(deltaX * deltaX + deltaY * deltaY)) * (180 / Math.PI);

      // Apply aim
      if (smooth) {
        await this.smoothAim({ x: pitch, y: yaw, z: 0 }, 100);
      } else {
        await this.setRotation({ x: pitch, y: yaw, z: 0 });
      }
    } catch (error) {
      logger.error('Failed to aim:', error);
    }
  }

  private async smoothAim(targetRotation: Vector3, duration: number): Promise<void> {
    const currentRotation = await this.getRotation();
    const steps = duration / 10;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const smoothRotation = {
        x: currentRotation.x + (targetRotation.x - currentRotation.x) * t,
        y: currentRotation.y + (targetRotation.y - currentRotation.y) * t,
        z: currentRotation.z + (targetRotation.z - currentRotation.z) * t
      };
      await this.setRotation(smoothRotation);
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  async shoot(burst: boolean = false): Promise<void> {
    try {
      if (!this.currentWeapon) return;

      if (burst) {
        for (let i = 0; i < 3; i++) {
          await this.input.simulateMouseMovement(0, 0, 50, false);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } else {
        await this.input.simulateMouseMovement(0, 0, 50, false);
      }

      // Update ammo count
      const newAmmo = await this.memBuffer.readInt32(
        this.baseAddress + BigInt(this.weaponOffsets.ammo)
      );
      if (this.currentWeapon) {
        this.currentWeapon.ammo = newAmmo;
      }
    } catch (error) {
      logger.error('Failed to shoot:', error);
    }
  }

  async build(type: 'wall' | 'floor' | 'ramp' | 'pyramid', material: 'wood' | 'brick' | 'metal'): Promise<void> {
    try {
      // Enter build mode
      await this.memBuffer.writeInt32(
        this.baseAddress + BigInt(this.buildingOffsets.buildMode),
        1
      );

      // Select material
      const materialIndex = { wood: 0, brick: 1, metal: 2 }[material];
      await this.memBuffer.writeInt32(
        this.baseAddress + BigInt(this.buildingOffsets.selectedMaterial),
        materialIndex
      );

      // Select building piece
      const buildingKeys = {
        wall: 0x51,   // Q
        floor: 0x46,  // F
        ramp: 0x52,   // R
        pyramid: 0x56  // V
      };

      await this.input.simulateKeyPress(buildingKeys[type], 50);

      // Place building piece
      await this.input.simulateMouseMovement(0, 0, 50, false);
    } catch (error) {
      logger.error('Failed to build:', error);
    }
  }

  private async getPosition(): Promise<Vector3> {
    const addr = this.baseAddress + BigInt(this.movementOffsets.location);
    return {
      x: await this.memBuffer.readFloat(addr + BigInt(0x0)),
      y: await this.memBuffer.readFloat(addr + BigInt(0x4)),
      z: await this.memBuffer.readFloat(addr + BigInt(0x8))
    };
  }

  private async setPosition(pos: Vector3): Promise<void> {
    const addr = this.baseAddress + BigInt(this.movementOffsets.location);
    await this.memBuffer.writeBuffer(addr, Buffer.from(new Float32Array([pos.x, pos.y, pos.z]).buffer));
  }

  private async getRotation(): Promise<Vector3> {
    const addr = this.baseAddress + BigInt(this.movementOffsets.rotation);
    return {
      x: await this.memBuffer.readFloat(addr + BigInt(0x0)),
      y: await this.memBuffer.readFloat(addr + BigInt(0x4)),
      z: await this.memBuffer.readFloat(addr + BigInt(0x8))
    };
  }

  private async setRotation(rot: Vector3): Promise<void> {
    const addr = this.baseAddress + BigInt(this.movementOffsets.rotation);
    await this.memBuffer.writeBuffer(addr, Buffer.from(new Float32Array([rot.x, rot.y, rot.z]).buffer));
  }

  async updateWeaponInfo(): Promise<void> {
    try {
      const weaponPtr = await this.memBuffer.readInt64(
        this.baseAddress + BigInt(this.weaponOffsets.currentWeapon)
      );
      if (!weaponPtr) {
        this.currentWeapon = null;
        return;
      }

      this.currentWeapon = {
        id: await this.memBuffer.readInt32(weaponPtr + BigInt(0x18)),
        name: 'Unknown Weapon', // Would need to read from game strings
        ammo: await this.memBuffer.readInt32(weaponPtr + BigInt(this.weaponOffsets.ammo)),
        reloadTime: await this.memBuffer.readFloat(weaponPtr + BigInt(0x100)),
        damage: await this.memBuffer.readFloat(weaponPtr + BigInt(0x104)),
        spread: await this.memBuffer.readFloat(weaponPtr + BigInt(0x108))
      };
    } catch (error) {
      logger.error('Failed to update weapon info:', error);
    }
  }

  getBonePosition(boneName: string): Vector3 | null {
    const bone = this.bones.get(boneName);
    return bone ? bone.position : null;
  }

  getCurrentWeapon(): WeaponData | null {
    return this.currentWeapon;
  }
} 
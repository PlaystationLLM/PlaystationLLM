interface PatternInfo {
  name: string;
  pattern: string;
  offset: number;
  module: string;
  description: string;
}

interface GamePatterns {
  version: string;
  patterns: PatternInfo[];
}

export const FORTNITE_PATTERNS: GamePatterns = {
  version: '23.50',
  patterns: [
    {
      name: 'GWorld',
      pattern: '48 89 05 ? ? ? ? 48 8B 4B 78',
      offset: 3,
      module: 'FortniteClient-Win64-Shipping.exe',
      description: 'Global world pointer'
    },
    {
      name: 'GNames',
      pattern: '48 8B 1D ? ? ? ? 48 85 DB 75 ? B9 ? ? ? ? E8 ? ? ? ? 48 8B C3',
      offset: 3,
      module: 'FortniteClient-Win64-Shipping.exe',
      description: 'Global names array'
    },
    {
      name: 'FreeFN',
      pattern: '48 85 C9 74 2E 53 48 83 EC 20 48 8B D9 48 8B 0D ? ? ? ?',
      offset: 0,
      module: 'FortniteClient-Win64-Shipping.exe',
      description: 'Memory free function'
    },
    {
      name: 'ProcessEvent',
      pattern: '40 55 56 57 41 54 41 55 41 56 41 57 48 81 EC ? ? ? ? 48 8D 6C 24 ? 48 89 9D ? ? ? ? 48 8B 05 ? ? ? ? 48 33 C5',
      offset: 0,
      module: 'FortniteClient-Win64-Shipping.exe',
      description: 'UObject::ProcessEvent'
    },
    {
      name: 'BoneMatrix',
      pattern: '48 8B C4 48 89 58 08 48 89 70 10 57 48 81 EC ? ? ? ? 48 8B FA',
      offset: 0,
      module: 'FortniteClient-Win64-Shipping.exe',
      description: 'Get bone matrix'
    }
  ]
};

export const GTA_PATTERNS: GamePatterns = {
  version: '1.67',
  patterns: [
    {
      name: 'WorldPTR',
      pattern: '48 8B 05 ? ? ? ? 45 ? ? ? ? 48 8B 48 08 48 85 C9 74 07',
      offset: 3,
      module: 'GTA5.exe',
      description: 'World pointer'
    },
    {
      name: 'BlipList',
      pattern: '4C 8B 05 ? ? ? ? 41 8B D0 0F B7 C2 4C 8B 15',
      offset: 3,
      module: 'GTA5.exe',
      description: 'Radar blips'
    },
    {
      name: 'PlayerList',
      pattern: '48 8B 0D ? ? ? ? E8 ? ? ? ? 48 8B C8 E8 ? ? ? ? 48 8B CF',
      offset: 3,
      module: 'GTA5.exe',
      description: 'Online players'
    },
    {
      name: 'ViewMatrix',
      pattern: '48 8B 15 ? ? ? ? 48 8D 2D ? ? ? ? 48 8B CD',
      offset: 3,
      module: 'GTA5.exe',
      description: 'Game view matrix'
    },
    {
      name: 'WeaponManager',
      pattern: '48 8B 0D ? ? ? ? 48 85 C9 74 ? 48 8D 55',
      offset: 3,
      module: 'GTA5.exe',
      description: 'Weapon manager'
    },
    {
      name: 'VehicleList',
      pattern: '4C 8B 0D ? ? ? ? 44 8B C1 49 8B 41 08',
      offset: 3,
      module: 'GTA5.exe',
      description: 'Vehicle pool'
    }
  ]
};

// Anti-cheat signatures to avoid
export const BLACKLISTED_REGIONS = [
  '48 89 5C 24 ? 48 89 74 24 ? 57 48 83 EC 20 48 8B D9 48 8B F2 48 8B CA',
  '40 53 48 83 EC 20 48 8B D9 48 8B 0D ? ? ? ? 48 85 C9 74 ? E8',
  '48 89 5C 24 ? 48 89 74 24 ? 57 48 83 EC 20 48 8B F9 48 8B F2 48 8B DA'
];

export const HOOK_PATTERNS = {
  virtualProtect: '48 89 5C 24 ? 48 89 74 24 ? 57 48 83 EC 20 48 8B F1 48 8B FA 48 8B D9',
  createThread: '48 89 5C 24 ? 48 89 74 24 ? 57 48 83 EC 20 48 8B F1 48 8B DA 48 8B F9',
  loadLibrary: '48 89 5C 24 ? 48 89 6C 24 ? 48 89 74 24 ? 57 48 83 EC 20 48 8B F1 48 8B DA'
}; 
export interface PlatformData {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface SwitchData {
  id: string;
  x: number;
  y: number;
}

export interface GateData {
  id: string;
  x: number;
  y: number;
  controlIds: string[];
  mode?: 'all' | 'any';
}

export interface PressurePlateData {
  id: string;
  x: number;
  y: number;
}

export interface LevelData {
  id: string;
  name: string;
  description: string;
  loopDurationSeconds: number;
  maxLoops: number;
  spawnPoint: { x: number; y: number };
  platforms: PlatformData[];
  switches?: SwitchData[];
  gates?: GateData[];
  pressurePlates?: PressurePlateData[];
  goalZone: { id: string; x: number; y: number };
}

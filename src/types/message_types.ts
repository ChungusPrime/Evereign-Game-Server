import { Worker } from 'worker_threads';
import NPC from '../NPC';
import Character from '../Character';

export interface RegionData {
  name: string;
  Players: Record<string, Character>;
  NPCs: Record<string, NPC>;
  Events: Record<string, any>;
  Nodes: Record<string, any>;
  Land: Record<string, any>;
  worker: Worker;
  NPCsSyncData: Record<string, { id: null, x: null, y: null, target: null, speed: null }>;
  PlayersSyncData: Record<string, any>;
}

export interface RegionDataTick {
  type: string;
  region: string;
  Players: Record<string, any>;
  NPCs: Record<string, any>;
}

export interface NpcChangedTarget {
  type: string;
  region: string;
  socket: string;
  npc_id: string;
  npc_x: number;
  npc_y: number;
}

export interface NPCMoved {
  type: string;
  region: string;
  npc_id: string;
  x: number;
  y: number;
}

export interface NPCStartMove {
  type: string;
  region: string;
  npc_id: string;
  npc_x: number;
  npc_y: number;
  npc_speed: number;
}

export interface NPCStopMove {
  type: string;
  region: string;
  npc_id: string;
  npc_x: number;
  npc_y: number;
}

export interface NPCRespawned {
  type: string;
  region: string;
  npc_id: string;
  npc_x: number;
  npc_y: number;
}

export interface NPCDied {
  type: string;
  region: string;
  npc_id: string;
  npc_x: number;
  npc_y: number;
}

export interface NPCReset {
  type: string;
  region: string;
  npc_id: string;
  npc_x: number;
  npc_y: number;
}

export interface NPCAttack {
  type: string;
  region: string;
  npc_id: string;
  target: string;
}

export type WorkerMessageTypes = RegionDataTick | NpcChangedTarget | NPCStartMove | NPCStopMove | NPCRespawned | NPCDied | NPCReset | NPCAttack;

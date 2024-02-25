import Log from "./logger";

export default class NPC {

  // DB Schema
  id: number;
  name: string;
  title: string;
  class: string;
  faction: string;
  max_health: number;
  sprite: number;
  x: number;
  y: number;
  speed: number;
  items: string;
  quests: string;
  loot: string;
  region: string;
  trainer: boolean;

  // Manual Data
  spawn_x: number;
  spawn_y: number;
  curHealth: number;

  // Physics
  width: number = 10;
  height: number = 10;
  body = null;

  // States
  ALIVE: boolean = true;
  MOVING: boolean = false;
  COMBAT: boolean = false;
  TARGET: string = null;
  
  AggroRange: number = 50;

  // Time it takes to respawn after death
  RespawnTime: number = 10000;
  curRespawnTime: number = 0;

  // Time it takes to reset after no damage is given or taken
  ResetTime: number = 6000;
  curResetTime: number = 0;

  // Time it takes for this npc to attack again
  AttackTime: number = 3000;
  curAttackTime: number = 0;

  // All socket IDs that have attacked this NPC
  AttackedBy: Array<string> = [];

  constructor ( data: NPC ) {
    Object.assign(this, data);
    this.spawn_x = this.x;
    this.spawn_y = this.y;
    this.curHealth = this.max_health;
  }

  UpdatePosition () {
    this.x = this.body.x;
    this.y = this.body.y;
  }

  ChangeTarget ( target: string ) {
    this.TARGET = target;
    this.COMBAT = true;
    this.curRespawnTime = 0;
    Log(`NPC: ${this.id} changed target to ${this.TARGET}`);
  }

  CanRespawn ( delta: number ): boolean {
    this.curRespawnTime += delta;
    if ( this.curRespawnTime >= this.RespawnTime ) {
      return true;
    }
    return false;
  }

  Respawn () {
    this.Reset();
    Log(`NPC: ${this.id} respawned`);
  }

  CanReset ( delta: number ): Boolean {
    this.curResetTime += delta;
    if ( this.curResetTime >= this.ResetTime ) {
      this.curResetTime = 0;
      return true;
    }
    return false;
  }

  Reset () {
    this.ALIVE = true;
    this.MOVING = false;
    this.COMBAT = false;
    this.TARGET = null;
    this.curRespawnTime = 0;
    this.curResetTime = 0;
    this.curHealth = this.max_health;
    this.body.reset(this.spawn_x, this.spawn_y);
    this.body.x = this.spawn_x;
    this.body.y = this.spawn_y;
    this.UpdatePosition();
    Log(`NPC: ${this.id} reset`);
  }

  CanAttack ( delta: number ): boolean {
    this.curAttackTime += delta;
    if ( this.curAttackTime >= this.AttackTime ) {
      this.curAttackTime = 0;
      return true;
    }
    return false;
  }

  AttackTarget() {
    this.curAttackTime = 0;
    this.curResetTime = 0;
    Log(`NPC: ${this.id} attacked player ${this.TARGET}`);
  }

  Kill () {
    this.ALIVE = false;
    this.MOVING = false;
    this.COMBAT = false;
    this.TARGET = null;
    this.curRespawnTime = 0;
    this.curResetTime = 0;
    this.curHealth = 0;
    this.body.reset(this.body.x, this.body.y);
    this.UpdatePosition();
    Log(`NPC: ${this.id} died`);
  }

  StartMoving () {
    this.MOVING = true;
    Log(`NPC: ${this.id} started moving`);
  }

  StopMoving () {
    this.MOVING = false;
    this.body.reset(this.body.x, this.body.y);
    this.UpdatePosition();
    this.curResetTime = 0;
    Log(`NPC: ${this.id} stopped moving`);
  }

}

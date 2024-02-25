import Character from "./Character";
import NPC from "./NPC";
import { parentPort, workerData } from 'node:worker_threads';
import { ArcadePhysics } from 'arcade-physics';
import Quadtree from '@timohausmann/quadtree-js';
import { RegionData } from "./types/message_types";
import Log from "./logger";

export default class GameRegion {

  Name: string;
  FPS: number = 15;
  Physics: ArcadePhysics;
  Quadtree: Quadtree;
  Tick: number = 0;
  Width: number = 4800;
  Height: number = 4800;
  Data: RegionData;
  
  constructor ( Data: RegionData ) {
    this.Data = Data;
    this.Name = this.Data.name;
    this.Physics = new ArcadePhysics({ width: this.Width, height: this.Height, gravity: { x: 0, y: 0 } });
    this.Quadtree = new Quadtree({ x: 0, y: 0, width: this.Width, height: this.Height });

    for ( const key in this.Data.NPCs ) {
      let npc = this.Data.NPCs[key];
      this.Data.NPCs[key] = new NPC(npc);
      this.Data.NPCs[key].body = this.Physics.add.body(npc.x, npc.y, npc.width, npc.height);
    }

    setInterval( () => {
      this.Update();
    }, 1000 / this.FPS);

    //console.table(this.Data.NPCs);
    Log(`Region: ${this.Name} set up`);
  }

  public Update (): void {

    let time = this.Tick * 1000;
    let delta = 1000 / this.FPS;
    this.Physics.world.update(time, delta);
    this.Tick++;

    // Refresh Quadtree
    this.Quadtree.clear();

    for ( const key in this.Data.NPCs ) {
      this.Quadtree.insert(this.Data.NPCs[key]);
    }
    
    for ( const key in this.Data.Players ) {
      let player = this.Data.Players[key];
      this.Quadtree.retrieve(player).forEach( ( npc: NPC ) => {
        if ( !npc.ALIVE || npc.TARGET != null || npc.faction == player.faction ) return;
        const distance = Math.sqrt((npc.x - player.x) ** 2 + (npc.y - player.y) ** 2);
        if ( distance <= npc.AggroRange ) {
          npc.ChangeTarget(player.socket);
          parentPort.postMessage({ type: "NPC_CHANGED_TARGET", region: Region.Name, socket: npc.TARGET, npc_id: npc.id, npc_x: npc.x, npc_y: npc.y });
        }
      });
    }

    // Update NPCs
    for ( const key in this.Data.NPCs ) {

      let npc = this.Data.NPCs[key];

      //if ( npc.id == 24 ) {
        //console.log(npc.curHealth);
      //}

      if ( !npc.ALIVE ) {
        if ( npc.CanRespawn(delta) ) {
          npc.Respawn();
          parentPort.postMessage({ type: "NPC_RESPAWNED", region: this.Name, npc_id: npc.id, npc_x: npc.x, npc_y: npc.y });
        }
      } else {
        if ( npc.curHealth <= 0 ) {
          npc.Kill();
          parentPort.postMessage({ type: "NPC_DIED", region: this.Name, npc_id: npc.id, npc_x: npc.x, npc_y: npc.y });
        }
      }

      if ( npc.COMBAT ) {

        const Target = this.Data.Players[npc.TARGET];
        const DistanceToTarget = Math.sqrt((npc.x - Target.x) ** 2 + (npc.y - Target.y) ** 2);
        const InAttackRange = DistanceToTarget > 15 ? false : true;

        // Target is outside of npc attack range, so move towards them
        if ( !InAttackRange ) {
          if ( !npc.MOVING ) {
            npc.StartMoving();
            parentPort.postMessage({ type: "NPC_STARTED_MOVING", region: this.Name, npc_id: npc.id, npc_x: npc.x, npc_y: npc.y, npc_speed: npc.speed });
          }
          this.Physics.moveTo(npc.body, Target.x, Target.y, npc.speed);
          npc.UpdatePosition();
        }
        
        // Target is in attack range, stop moving and start attacking
        if ( InAttackRange ) {
          if ( npc.CanAttack(delta) ) {
            npc.AttackTarget();
            parentPort.postMessage({ type: "NPC_ATTACKED_TARGET", region: this.Name, npc_id: npc.id, target: npc.TARGET });
          }
          if ( npc.MOVING ) {
            npc.StopMoving();
            parentPort.postMessage({ type: "NPC_STOPPED_MOVING", region: this.Name, npc_id: npc.id, npc_x: npc.x, npc_y: npc.y });
          }
        }

        // Try to reset the NPC
        if ( npc.CanReset(delta) ) {
          npc.Reset();
          parentPort.postMessage({ type: "NPC_RESET", region: this.Name, npc_id: npc.id, npc_x: npc.x, npc_y: npc.y });
        }

      }

    }

    // update main thread
    parentPort.postMessage({ type: "REGION_DATA_TICK", region: this.Name, Players: this.Data.Players, NPCs: this.Data.NPCs });
  }

  DamageNPC( message: DamageNPC ) {
    console.table(message);
    // calculate damage
    let damage = 1;
    let npc = this.Data.NPCs[message.NPC];
    let player = this.Data.Players[message.Socket];
    npc.curHealth -= damage;
  }

  AddPlayer ( message: AddPlayerMessage ) {
    Log(`Region: ${this.Name} adding player ${message.Character.socket}`);
    this.Data.Players[message.Character.socket] = message.Character;
  }
  
  RemovePlayer ( message: RemovePlayerMessage ) {
    delete this.Data.Players[message.Socket];
    Log(`Region: ${this.Name} removing player ${message.Socket}`);
    for ( const key in this.Data.NPCs ) {
      if ( this.Data.NPCs[key].TARGET == message.Socket ) {
        this.Data.NPCs[key].TARGET = null;
        this.Data.NPCs[key].MOVING = false;
        this.Data.NPCs[key].body.reset(this.Data.NPCs[key].body.x, this.Data.NPCs[key].body.y);
        this.Data.NPCs[key].UpdatePosition();
        continue;
      }
    }
  }
  
  MovePlayer ( message: MovePlayerMessage ) {
    this.Data.Players[message.Socket].x = message.Coordinates.x;
    this.Data.Players[message.Socket].y = message.Coordinates.y;
  }

}

// Incoming Messages From Parent
interface AddPlayerMessage {
  Action: string,
  Character: Character
}

interface RemovePlayerMessage {
  Action: string,
  Socket: string
}

interface MovePlayerMessage {
  Action: string,
  Coordinates: { x: number, y: number },
  Socket: string
}

interface DamageNPC {
  Action: string,
  NPC: string;
  Socket: string;
}

type WorkerMessageTypes = AddPlayerMessage | MovePlayerMessage | RemovePlayerMessage | DamageNPC;

// Incoming messages from the parent thread
parentPort.on( "message", ( message: WorkerMessageTypes ) => {
  switch ( message.Action ) {
    case "ADD_PLAYER": Region.AddPlayer(message as AddPlayerMessage); break;
    case "MOVE_PLAYER": Region.MovePlayer(message as MovePlayerMessage); break;
    case "REMOVE_PLAYER": Region.RemovePlayer(message as RemovePlayerMessage); break;
    case "DAMAGE_NPC": Region.DamageNPC(message as DamageNPC); break;
    default: console.log("Invalid action received"); break;
  }
});

const Region = new GameRegion(workerData);
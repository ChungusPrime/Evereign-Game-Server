import Database from './db';
import { Worker } from 'worker_threads';
import CharacterManager from './CharacterManager';
import express, { Request, Response } from 'express';
import * as http from "http";
import * as socketio from "socket.io";
import cors from "cors";
import { RegionData, RegionDataTick, NpcChangedTarget, NPCMoved, NPCStartMove, NPCStopMove, NPCRespawned, NPCDied, NPCReset, NPCAttack, WorkerMessageTypes } from './types/message_types';
import routes from './routes';
import Log from './logger';

/* Environment Variables */
const ListenPort: string = process.env.PORT;
const ServerName: string = process.env.SERVER;
const Environment: string = process.env.ENVIRONMENT;
const DatabaseName: string = process.env.DATABASE;
const DbHost: string = process.env.DB_HOST;
const DbPass: string = process.env.DB_PASS;
const DbUser: string = process.env.DB_USER;
const MasterServer: string = Environment == "local" ? "http://localhost:8081" : "http://66.245.193.154:8081";

const app = express().options("*", cors()).use([
  express.urlencoded({ extended: true }),
  express.json(),
  express.static(__dirname)
]);

const Server = http.createServer(app);
const io = new socketio.Server(Server, { cors: { origin: "*", methods: ["GET", "POST"] } });

const DB: Database = new Database(process.env.DATABASE, process.env.DB_HOST, process.env.DB_PASS, process.env.DB_USER);
const CM: CharacterManager = new CharacterManager(DB);
let PlayerCount = 0;

app.use('/', routes(CM));

app.post("/server_status", async (req: Request, res: Response) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.json({ players: PlayerCount });
});

app.get("/server_status", async (req: Request, res: Response) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.json({ players: PlayerCount });
});

let GameRegions: Record<string, RegionData> = {
  /*"A1": { name: "A1", Players: {}, NPCs: {}, NPCsSyncData: {}, PlayersSyncData: {}, Events: {}, Nodes: {}, Land: {}, worker: null },
  "A2": { name: "A2", Players: {}, NPCs: {}, NPCsSyncData: {}, PlayersSyncData: {}, Events: {}, Nodes: {}, Land: {}, worker: null },
  "A3": { name: "A3", Players: {}, NPCs: {}, NPCsSyncData: {}, PlayersSyncData: {}, Events: {}, Nodes: {}, Land: {}, worker: null },
  "A4": { name: "A4", Players: {}, NPCs: {}, NPCsSyncData: {}, PlayersSyncData: {}, Events: {}, Nodes: {}, Land: {}, worker: null },
  "B1": { name: "B1", Players: {}, NPCs: {}, NPCsSyncData: {}, PlayersSyncData: {}, Events: {}, Nodes: {}, Land: {}, worker: null },
  "B2": { name: "B2", Players: {}, NPCs: {}, NPCsSyncData: {}, PlayersSyncData: {}, Events: {}, Nodes: {}, Land: {}, worker: null },
  "B3": { name: "B3", Players: {}, NPCs: {}, NPCsSyncData: {}, PlayersSyncData: {}, Events: {}, Nodes: {}, Land: {}, worker: null },
  "B4": { name: "B4", Players: {}, NPCs: {}, NPCsSyncData: {}, PlayersSyncData: {}, Events: {}, Nodes: {}, Land: {}, worker: null },
  "C1": { name: "C1", Players: {}, NPCs: {}, NPCsSyncData: {}, PlayersSyncData: {}, Events: {}, Nodes: {}, Land: {}, worker: null },
  "C2": { name: "C2", Players: {}, NPCs: {}, NPCsSyncData: {}, PlayersSyncData: {}, Events: {}, Nodes: {}, Land: {}, worker: null },
  "C3": { name: "C3", Players: {}, NPCs: {}, NPCsSyncData: {}, PlayersSyncData: {}, Events: {}, Nodes: {}, Land: {}, worker: null },
  "C4": { name: "C4", Players: {}, NPCs: {}, NPCsSyncData: {}, PlayersSyncData: {}, Events: {}, Nodes: {}, Land: {}, worker: null },*/
  "D1": { name: "D1", Players: {}, NPCs: {}, NPCsSyncData: {}, PlayersSyncData: {}, Events: {}, Nodes: {}, Land: {}, worker: null },
  //"D2": { name: "D2", Players: {}, NPCs: {}, NPCsSyncData: {}, PlayersSyncData: {}, Events: {}, Nodes: {}, Land: {}, worker: null },
  //"D3": { name: "D3", Players: {}, NPCs: {}, NPCsSyncData: {}, PlayersSyncData: {}, Events: {}, Nodes: {}, Land: {}, worker: null },
  //"D4": { name: "D4", Players: {}, NPCs: {}, NPCsSyncData: {}, PlayersSyncData: {}, Events: {}, Nodes: {}, Land: {}, worker: null }
};

const workerMessageHandlers: Record<string, ( message: WorkerMessageTypes ) => void> = {
  REGION_DATA_TICK: SyncRegionData,
  NPC_CHANGED_TARGET: EmitNpcChangedTarget,
  NPC_STARTED_MOVING: EmitNpcStartMove,
  NPC_STOPPED_MOVING: EmitNpcStopMove,
  NPC_RESPAWNED: EmitNpcRespawn,
  NPC_DIED: EmitNpcDied,
  NPC_RESET: EmitNpcReset,
  NPC_ATTACKED_TARGET: EmitNpcAttack
};

// Boot up the server
(async () => {

  Log(`${ServerName} starting up - ENVIRONMENT: ${Environment} - PORT: ${ListenPort}, SERVER: ${ServerName}, DB: ${DatabaseName} (HOST: ${DbHost}, PASS: ${DbPass}, USER: ${DbUser})`);
  
  try {

    const response = await fetch(`${MasterServer}/realm_data`);
    const data = await response.json();
    console.log(data.races);

    //await DB.Connect();

    /*Object.keys(GameRegions).forEach( async(region) => {

      // Get NPCs in this region
      let [npcs] = await DB.Query("SELECT * FROM data_npcs WHERE region = ?", [region]);
      for ( const key in npcs ) {
        let id = npcs[key].id;
        GameRegions[region].NPCs[id] = npcs[key];
      }

      const worker = new Worker(`${__dirname}/region.js`, {
        workerData: GameRegions[region]
      }).on("message", ( message: WorkerMessageTypes ) => {
        workerMessageHandlers[message.type](message);
      }).on('error', (error) => {
        Log(`Worker error in ${region}: ${error}`);
      }).on('exit', (code) => {
        Log(`Worker in ${region} exited with code ${code}`);
      });

      GameRegions[region].worker = worker;
    });*/

    Server.listen(ListenPort, () => {
      Log(`${ServerName} finished start up and is running on Port ${ListenPort}`);
    });

  } catch (error) {
    Log(`Error starting up: ${error}`);
  }

})();

function SyncRegionData ( message: RegionDataTick ): void {
  let region = GameRegions[message.region];
  region.Players = message.Players;
  region.NPCs = message.NPCs;
  for ( const key in message.NPCs ) {
    region.NPCsSyncData[key] = {
      id: message.NPCs[key].id,
      x: message.NPCs[key].x,
      y: message.NPCs[key].y,
      target: message.NPCs[key].target,
      speed: message.NPCs[key].speed
    };
  }
}

function EmitNpcChangedTarget ( message: NpcChangedTarget ): void {
  io.to(message.region).emit( "NpcChangedTarget", message );
}

function EmitNpcStartMove ( message: NPCStartMove ): void {
  io.to(message.region).emit( "NpcStartMove", message );
}

function EmitNpcReset ( message: NPCReset ): void {
  io.to(message.region).emit( "NpcReset", message);
}

function EmitNpcStopMove ( message: NPCStopMove ): void {
  io.to(message.region).emit( "NpcStopMove", message);
}

function EmitNpcRespawn ( message: NPCRespawned ): void {
  io.to(message.region).emit( "NpcRespawned", message );
}

function EmitNpcDied ( message: NPCDied ): void {
  io.to(message.region).emit( "NpcDied", message );
}

function EmitNpcAttack ( message: NPCAttack ): void {
  io.to(message.region).emit( "NpcAttack", message );
}

// Listen for client socket.io connections
io.on( "connection", async ( socket: socketio.Socket ) => {

  // Get socket query vars
  const CharacterID = socket.handshake.query.CharacterID as string;
  const AccountID = socket.handshake.query.AccountID as string;
  const SocketID = socket.id as string;
  Log(`connected socketID: ${SocketID} - accountID: ${AccountID} - characterID: ${CharacterID}`);

  // Get character from the database
  let Character = await CM.GetCharacter(CharacterID, AccountID, SocketID);
  GameRegions[Character.area].worker.postMessage({ Action: "ADD_PLAYER", Character: Character });
  PlayerCount++;

  socket.emit("ConnectedToGameServer", {
    Character: Character,
    Players: GameRegions[Character.area].PlayersSyncData,
    NPCs: GameRegions[Character.area].NPCsSyncData
  });
  
  io.to(Character.area).emit("PlayerJoined", Character);
  socket.join(Character.area);

  socket.on("Player-Move", async (Coordinates: { x: number, y: number }) => {
    GameRegions[Character.area].worker.postMessage({ Action: "MOVE_PLAYER", Coordinates: Coordinates, Socket: socket.id });
    io.to(Character.area).emit("PlayerMoved", { socket: socket.id, x: Coordinates.x, y: Coordinates.y });
  });

  socket.on("disconnect", async () => {
    GameRegions[Character.area].worker.postMessage({ Action: "REMOVE_PLAYER", Socket: socket.id });
    //await CM.UpdateCharacter(Character);
    PlayerCount--;
    io.to(Character.area).emit("PlayerLeft", socket.id);
  });

});

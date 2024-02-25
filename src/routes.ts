import express, { Request, Response } from 'express';
import path from 'path';
import CharacterManager from './CharacterManager';

const router = express.Router();

export default function routes( CM: CharacterManager ) {

  router.get("/dev/monitor", async (req: Request, res: Response) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.sendFile(path.join(__dirname, '/monitor.html'));
  });

  router.post("/dev/monitor/data", async (req: Request, res: Response) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.json({ RegionData: {} });
  });

  router.post("/status", async (req: Request, res: Response) => {
    res.header("Access-Control-Allow-Origin", "*");
    console.table(req.body);
    const characters = await CM.GetAccountList(req.body.id);
    res.json({ characters: characters, success: true });
  });

  router.post("/create_character", async (req: Request, res: Response) => {
    res.header("Access-Control-Allow-Origin", "*");
    const character = await CM.CreateCharacter(req.body.Character, req.body.UserID);
    console.log(character);
    res.json({ success: true, character: character });
  });

  return router;
}
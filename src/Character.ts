export default class Character {

  // Database schema columns
  id: number; 
  player_id: number;
  name: string;
  class: string;
  subclass: string;
  race: string;
  area: string;
  x: number;
  y: number;
  level: number;
  faction: string;
  xp: number;
  inventory: string;
  equipment: string;
  quests: string;
  abilities: string;
  skills: string;
  carry_weight: number;
  strength: number;
  endurance: number;
  agility: number;
  personality: number;
  intelligence: number;
  willpower: number;
  sprite: number;

  // data set manually
  body: Body;
  socket: string;
  width: number = 8;
  height: number = 16;

  constructor ( Character: Character, Socket: string ) {
    Object.assign(this, Character);
    this.socket = Socket;
  }

}
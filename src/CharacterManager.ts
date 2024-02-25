import Character from "./Character";
import Database from "./db";
import crypto from 'crypto';
import Log from "./logger";

export default class CharacterManager {

  db: Database;

  constructor ( db: Database ) {
    this.db = db;
  }

  async CreateCharacter ( Character: Character, UserID: number ) {

    try {

      console.table(Character);
      console.log(UserID);
  
      // Build Inventory
      let ItemSQL: string = "";
      let ItemParams: Array<number[]> = [];

      if ( Character.class == "Gladiator" ) {
        ItemSQL = "SELECT * FROM data_items WHERE id IN(?)";
        ItemParams = [ [13, 14, 15, 16] ];
      } else if ( Character.class == "Godsworn" ) {
        ItemSQL = "SELECT * FROM data_items WHERE id IN(?)";
        ItemParams = [ [13, 14, 15, 16] ];
      } else if ( Character.class == "Operative" ) {
        ItemSQL = "SELECT * FROM data_items WHERE id IN(?)";
        ItemParams = [ [13, 14, 15, 16] ];
      } else if ( Character.class == "Arcanist" ) {
        ItemSQL = "SELECT * FROM data_items WHERE id IN(?)";
        ItemParams = [ [13, 14, 15, 16] ];
      } else if ( Character.class == "Harbinger" ) {
        ItemSQL = "SELECT * FROM data_items WHERE id IN(?)";
        ItemParams = [ [13, 14, 15, 16] ];
      } else {
        console.log("Invalid class choice");
        return;
      }
      
      let [Items] = await this.db.Query(ItemSQL, ItemParams);

      for ( const key in Items ) {
        Items[key].id = crypto.randomUUID({ disableEntropyCache: true});
      }

      const Inventory = JSON.stringify(Items);

      const Equipment = JSON.stringify({
        head: {},
        chest: {},
        legs: {},
        hands: {},
        feet: {},
        ring1: {},
        ring2: {},
        necklace: {},
        trinket: {},
        tool: {},
        ammo: {},
        mainhand: {},
        offhand: {}
      });

      let Strength = Character.strength;
      let Endurance = Character.endurance;
      let Agility = Character.agility;
      let Personality = Character.personality;
      let Intelligence = Character.intelligence;
      let Willpower = Character.willpower;

      if ( Character.race == "Human" ) {
        Strength++;
        Personality++;
        Willpower++;
        Agility++;
        Intelligence++;
        //Ability: Forestry Efficiency (Increased gathering yield, reduced gathering time)\n
        //Ability: Mercantile Efficiency (Reduced market tax, decreased buying and increased selling prices)`,
      }

      const Attributes = JSON.stringify([
        { attribute: "strength", value: Strength },
        { attribute: "endurance", value: Endurance },
        { attribute: "agility", value: Agility },
        { attribute: "personality", value: Personality },
        { attribute: "intelligence", value: Intelligence },
        { attribute: "willpower", value: Willpower }
      ]);

      // Fresh character, no quests
      const Quests = JSON.stringify({});

      // Add abilities based on selected class/race
      /*
      - Medium Armour Training
      - Sword Training
      - Greatweapon Training
      */
      const Abilities = JSON.stringify({});

      const DefaultSkillArray = JSON.stringify([

        // Trade Skills
        { name: "Forestry", level: 1, expert: false },
        { name: "Weaponsmithing", level: 1, expert: false },
        { name: "Woodworking", level: 1, expert: false },
        { name: "Armoursmithing", level: 1, expert: false },
        { name: "Leatherworking", level: 1, expert: false },
        { name: "Enchanting", level: 1, expert: false },
        { name: "Tailoring", level: 1, expert: false },
        { name: "Engineering", level: 1, expert: false },
        { name: "Alchemy", level: 1, expert: false },
        { name: "Researching", level: 1, expert: false },
        { name: "Herbalism", level: 1, expert: false },
        { name: "Fishing", level: 1, expert: false },
        { name: "Cooking", level: 1, expert: false },
        { name: "Jewelleler", level: 1, expert: false },
        { name: "Mining", level: 1, expert: false },
        { name: "Salvaging", level: 1, expert: false },
        { name: "Medicine", level: 1, expert: false },
        { name: "Mercantile", level: 1, expert: false },
        { name: "Lockpicking", level: 1, expert: false },
  
        // Melee
        { name: "Swords", level: 0 },
        { name: "Axes", level: 0 },
        { name: "Maces", level: 0 },
        { name: "Rapiers", level: 0 },
        { name: "Hammers", level: 0 },
        { name: "Morningstars", level: 0 },
        { name: "Spears", level: 0 },
        { name: "Daggers", level: 0 },
        { name: "Flails", level: 0 },
        { name: "Staffs", level: 0 },

        // Magic
        { name: "Fire Magic", level: 0 },
        { name: "Air Magic", level: 0 },
        { name: "Blood Magic", level: 0 },
        { name: "Nature Magic", level: 0 },
        { name: "Water Magic", level: 0 },
        { name: "Necromancy", level: 0 },
  
        // Ranged
        { name: "Guns", level: 0 },
        { name: "Bows", level: 0 },
        { name: "Throwing Weapons", level: 0 },
        { name: "Crossbows", level: 0 },
  
        // Armour
        { name: "Light Armour", level: 0 },
        { name: "Medium Armour", level: 0 },
        { name: "Heavy Armour", level: 0 },
        { name: "Shields", level: 0 },
  
        // Defensive
        { name: "Parry", level: 0 },
        { name: "Block", level: 0 },
        { name: "Dodge", level: 0 },
  
        // Specialist
        { name: "Dual Wielding", level: 0 },
        { name: "Greatweapons", level: 0 },
      ]);
  
      let Area = "";
      let X = 0;
      let Y = 0;
  
      if ( Character.faction == "The Crownhaven Kingdom" ) {
        Area = "D1";
        X = 329;
        Y = 3135;
      } else if ( Character.faction == "The Twilight Accord" ) {
        Area = "B7";
        X = 1;
        Y = 1;
      }

      let Level = 1;
      let XP = 0;
      let Sprite = 1;
      let Subclass = null;
      let ID = crypto.randomUUID({ disableEntropyCache: true});

      let SQL = "INSERT INTO characters VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

      let Params = [
        ID,
        UserID,
        "Chugmus",
        Character.race,
        Character.class,
        Subclass,
        Area,
        X,
        Y,
        Level,
        Character.faction,
        XP,
        Inventory,
        Equipment,
        Quests,
        Abilities,
        DefaultSkillArray,
        Attributes,
        Sprite
      ];

      const Result = await this.db.Query(SQL, Params);

      return { id: ID, name: "Chugmus", level: 1 };

    } catch ( error ) {
      Log(`Error when creating character: ${error}`);
    }

  }

  async GetAccountList ( PlayerID: string ) {
    const [Characters] = await this.db.Query("SELECT id, name, level FROM characters WHERE characters.player_id = ?", [ PlayerID ]);
    return Characters;
  }

  async GetCharacter ( CharacterID: string, PlayerID: string, SocketID: string ): Promise<Character> {
    const SQL = "SELECT * FROM characters WHERE characters.id = ? AND characters.player_id = ? LIMIT 1";
    const Params = [ CharacterID, PlayerID ];
    const [Result] = await this.db.Query(SQL, Params);
    const CharacterInstance = new Character(Result[0], SocketID);
    return CharacterInstance;
  }

  async UpdateCharacter ( Character: Character ) {
    Log(`Updating character ${Character.id}`);
    const SQL = `UPDATE characters SET x = ?, y = ? WHERE id = ?`;
    const Params = [ Character.x, Character.y, Character.id ];
    const Result = await this.db.Query(SQL, Params);
    console.log(Result);
  }

}

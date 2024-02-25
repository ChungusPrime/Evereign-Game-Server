import mysql from "mysql2/promise";
import Log from './logger';

export default class Database {
  
  connection: mysql.Connection;
  credentials = { host: '', user: '', password: '', database: '' };

  constructor ( database: string, host: string, pass: string, user: string ) {
    this.credentials.database = database;
    this.credentials.user = user;
    this.credentials.password = pass;
    this.credentials.host = host;
  }

  async Connect () {
    try {
      this.connection = await mysql.createConnection(this.credentials);
      Log('Database connection established');
    } catch ( error ) {
      Log(`Database connection failed - Error: ${error}`);
    }
  }

  async Query ( statement: string, params: any ): Promise<any> {
    try {
      console.log(params);
      const Result = await this.connection.query(statement, params);
      Log(`Executing Query: ${statement} - Success`);
      return Result;
    } catch (error) {
      Log(`Query Error: ${error}`);
    }
  }

}
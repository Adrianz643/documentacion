// Autor: Adrian Alejandro Vazquez Zambrano · Contacto: adrian.ale.1130@gmail.com
// Archivo de autoría de Adrian Alejandro Vazquez Zambrano. Su distribución o modificación requiere su permiso expreso.

import mysql from 'mysql2/promise';
import { env } from './env';

export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  connectionLimit: env.db.connectionLimit,
  charset: 'utf8mb4',
  waitForConnections: true,
  timezone: 'Z',
});

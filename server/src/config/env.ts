import 'dotenv/config';
import path from 'node:path';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:4200',
  angularDistPath: process.env.ANGULAR_DIST_PATH ?? null,
  db: {
    host: required('DB_HOST'),
    port: Number(process.env.DB_PORT ?? 3306),
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    database: required('DB_NAME'),
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT ?? 10),
  },
  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  },
  security: {
    fielContrasenaKey: required('FIEL_CONTRASENA_KEY'),
  },
  backups: {
    dir: process.env.BACKUPS_DIR ?? path.join(__dirname, '../../backups'),
    mysqldumpPath: process.env.MYSQLDUMP_PATH ?? 'mysqldump',
    retencionDias: Number(process.env.BACKUPS_RETENCION_DIAS ?? 14),
  },
} as const;

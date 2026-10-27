import { createApp } from './app';
import { env } from './config/env';
import { pool } from './config/database';
import { iniciarJobBackup } from './jobs/backup.job';
import { iniciarJobFielVencimiento } from './jobs/fielVencimiento.job';
import { iniciarJobDeclaracionesMensuales } from './jobs/declaracionesMensuales.job';
import { iniciarJobFacturasMensuales } from './jobs/facturasMensuales.job';
import { iniciarJobPurgaPapelera } from './jobs/papeleraPurge.job';

async function bootstrap(): Promise<void> {
  await pool.query('SELECT 1');

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`Servidor escuchando en el puerto ${env.port} (${env.nodeEnv})`);
  });

  iniciarJobFielVencimiento();
  iniciarJobDeclaracionesMensuales();
  iniciarJobFacturasMensuales();
  iniciarJobPurgaPapelera();
  iniciarJobBackup();
}

bootstrap().catch((error: unknown) => {
  console.error('No fue posible iniciar el servidor:', error);
  process.exit(1);
});

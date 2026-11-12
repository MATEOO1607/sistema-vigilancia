import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './src/routes/authRoutes.js';
import denunciaRoutes from './src/routes/denunciaRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

// Endpoint de prueba para verificar que el servidor levanta
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    servicio: 'Sistema de Vigilancia Ciudadana',
    fase: 2,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/denuncias', denunciaRoutes);

// Rutas no encontradas
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`✅ Servidor escuchando en http://localhost:${PORT}`);
});

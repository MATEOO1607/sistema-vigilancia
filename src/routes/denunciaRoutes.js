import { Router } from 'express';
import { authenticate, checkRole } from '../middlewares/auth.js';
import {
  createDenuncia,
  getMisDenuncias,
  getAllDenuncias,
  updateEstado,
} from '../controllers/denunciaController.js';

const router = Router();

// Todas las rutas de denuncias requieren autenticación
router.use(authenticate);

router.post('/', checkRole(['Ciudadano']), createDenuncia);
router.get('/mis-denuncias', checkRole(['Ciudadano']), getMisDenuncias);
router.get('/', checkRole(['Operador', 'Admin']), getAllDenuncias);
router.put('/:id/estado', checkRole(['Operador', 'Admin']), updateEstado);

export default router;

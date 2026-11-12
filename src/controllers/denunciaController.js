import { randomBytes } from 'crypto';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';

export const TIPOS_INCIDENCIA = [
  'Microbasural',
  'Quema',
  'Residuos especiales',
  'Otro',
];

// El cliente envía "En proceso" (con espacio); Prisma usa "En_proceso"
const estadoSchema = z.preprocess(
  (v) => (typeof v === 'string' ? v.replaceAll(' ', '_') : v),
  z.enum(['Recibida', 'En_proceso', 'Resuelta', 'Reincidente', 'Descartada']),
);

const createDenunciaSchema = z.object({
  descripcion: z.string().trim().min(10, 'La descripción debe tener al menos 10 caracteres'),
  tipo_incidencia: z.enum(TIPOS_INCIDENCIA),
  latitud: z.coerce.number().min(-90).max(90),
  longitud: z.coerce.number().min(-180).max(180),
  foto_url: z.url().optional().nullable(),
});

const updateEstadoSchema = z.object({
  estado: estadoSchema,
  observacion: z.string().trim().optional(),
});

// Estados que EXIGEN observación (regla estricta)
const ESTADOS_CON_OBSERVACION_OBLIGATORIA = ['Resuelta', 'Descartada'];

// Genera un código único tipo DEN-XXXXXX (6 caracteres hexadecimales)
function generarCodigoUnico() {
  return `DEN-${randomBytes(3).toString('hex').toUpperCase()}`;
}

// POST /api/denuncias — solo rol Ciudadano
export async function createDenuncia(req, res) {
  const parsed = createDenunciaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten().fieldErrors });
  }

  const { descripcion, tipo_incidencia, latitud, longitud, foto_url } = parsed.data;

  try {
    // Reintenta si colisiona el código único (improbable, pero posible)
    let denuncia;
    for (let intento = 0; intento < 3; intento++) {
      try {
        denuncia = await prisma.denuncia.create({
          data: {
            codigo_unico: generarCodigoUnico(),
            tipo_incidencia,
            descripcion,
            latitud,
            longitud,
            foto_url: foto_url ?? null,
            estado: 'Recibida',
            id_usuario_denunciante: req.user.id,
          },
        });
        break;
      } catch (err) {
        if (err?.code !== 'P2002') throw err;
        if (intento === 2) throw err;
      }
    }

    return res.status(201).json({ mensaje: 'Denuncia registrada', denuncia });
  } catch (err) {
    console.error('[denuncia.create]', err);
    return res.status(500).json({ error: 'Error interno al registrar la denuncia' });
  }
}

// GET /api/denuncias/mis-denuncias — solo las del usuario autenticado (rol Ciudadano)
export async function getMisDenuncias(req, res) {
  try {
    const denuncias = await prisma.denuncia.findMany({
      where: { id_usuario_denunciante: req.user.id },
      orderBy: { fecha_hora: 'desc' },
    });
    return res.json({ denuncias });
  } catch (err) {
    console.error('[denuncia.misDenuncias]', err);
    return res.status(500).json({ error: 'Error interno al listar tus denuncias' });
  }
}

// GET /api/denuncias — todas, opcionalmente filtradas por ?estado= (rol Operador/Admin)
export async function getAllDenuncias(req, res) {
  const filtro = estadoSchema.safeParse(req.query.estado);

  if (req.query.estado && !filtro.success) {
    return res.status(400).json({
      error: 'Estado inválido',
      estados_validos: ['Recibida', 'En proceso', 'Resuelta', 'Reincidente', 'Descartada'],
    });
  }

  try {
    const denuncias = await prisma.denuncia.findMany({
      where: filtro.success && req.query.estado ? { estado: filtro.data } : undefined,
      orderBy: { fecha_hora: 'desc' },
      include: {
        denunciante: { select: { id: true, nombre: true } },
        responsable: { select: { id: true, nombre: true, tipo: true } },
      },
    });
    return res.json({ denuncias });
  } catch (err) {
    console.error('[denuncia.getAll]', err);
    return res.status(500).json({ error: 'Error interno al listar las denuncias' });
  }
}

// PUT /api/denuncias/:id/estado — cambia estado (rol Operador/Admin)
export async function updateEstado(req, res) {
  const parsed = updateEstadoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten().fieldErrors });
  }

  const { estado, observacion } = parsed.data;
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'El id debe ser un número entero positivo' });
  }

  // REGLA ESTRICTA: Resuelta / Descartada exigen observación
  if (ESTADOS_CON_OBSERVACION_OBLIGATORIA.includes(estado) && !observacion) {
    return res.status(400).json({
      error: `La observación es obligatoria cuando el estado es "${estado.replaceAll('_', ' ')}"`,
    });
  }

  try {
    const denuncia = await prisma.denuncia.findUnique({ where: { id } });
    if (!denuncia) {
      return res.status(404).json({ error: 'Denuncia no encontrada' });
    }

    const actualizada = await prisma.denuncia.update({
      where: { id },
      data: { estado },
    });

    // Registro automático en Bitácora
    await prisma.bitacora.create({
      data: {
        tipo_accion: 'CAMBIO_ESTADO',
        id_usuario: req.user.id,
        id_denuncia: id,
        detalle: `Estado cambiado de "${denuncia.estado.replaceAll('_', ' ')}" a "${estado.replaceAll('_', ' ')}"` +
          (observacion ? `. Observación: ${observacion}` : '.'),
      },
    });

    return res.json({ mensaje: 'Estado actualizado', denuncia: actualizada });
  } catch (err) {
    console.error('[denuncia.updateEstado]', err);
    return res.status(500).json({ error: 'Error interno al actualizar el estado' });
  }
}

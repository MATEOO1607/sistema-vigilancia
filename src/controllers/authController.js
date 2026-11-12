import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';

const registerSchema = z.object({
  nombre: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres'),
  identificador: z.string().trim().email('Debe ser un email válido'),
  contrasena: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

const loginSchema = z.object({
  identificador: z.string().trim().email('Debe ser un email válido'),
  contrasena: z.string().min(1, 'La contraseña es obligatoria'),
});

// POST /api/auth/register — crea un usuario con rol Ciudadano por defecto
export async function register(req, res) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten().fieldErrors });
  }

  const { nombre, identificador, contrasena } = parsed.data;

  try {
    const rolCiudadano = await prisma.rol.findUnique({ where: { nombre: 'Ciudadano' } });
    if (!rolCiudadano) {
      return res.status(500).json({ error: 'Rol "Ciudadano" no existe. Ejecuta el seed: npx prisma db seed' });
    }

    const existente = await prisma.usuario.findUnique({ where: { identificador } });
    if (existente) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese email' });
    }

    const hash = await bcrypt.hash(contrasena, 10);

    const usuario = await prisma.usuario.create({
      data: { nombre, identificador, contrasena: hash, rol_id: rolCiudadano.id },
      select: { id: true, nombre: true, identificador: true, estado: true, rol: { select: { nombre: true } } },
    });

    return res.status(201).json({ mensaje: 'Usuario registrado', usuario });
  } catch (err) {
    console.error('[auth.register]', err);
    return res.status(500).json({ error: 'Error interno al registrar el usuario' });
  }
}

// POST /api/auth/login — valida credenciales y devuelve JWT de 24h
export async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten().fieldErrors });
  }

  const { identificador, contrasena } = parsed.data;

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { identificador },
      include: { rol: { select: { nombre: true } } },
    });

    // Mensaje genérico para no revelar si el email existe
    if (!usuario || !(await bcrypt.compare(contrasena, usuario.contrasena))) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (!usuario.estado) {
      return res.status(403).json({ error: 'Usuario desactivado' });
    }

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol.nombre },
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
    );

    return res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol.nombre },
    });
  } catch (err) {
    console.error('[auth.login]', err);
    return res.status(500).json({ error: 'Error interno al iniciar sesión' });
  }
}

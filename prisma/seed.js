import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ROLES = ['Ciudadano', 'Operador', 'Admin'];

// Usuarios de ejemplo (solo dev) — cambiar contraseñas en producción
const USUARIOS_DEMO = [
  { nombre: 'Administrador', identificador: 'admin@vigilancia.com', contrasena: 'admin1234', rol: 'Admin' },
  { nombre: 'Operador Emacruz', identificador: 'operador@emacruz.com', contrasena: 'operador1234', rol: 'Operador' },
];

async function crearUsuarioDemo({ nombre, identificador, contrasena, rol }) {
  await prisma.usuario.upsert({
    where: { identificador },
    update: {},
    create: {
      nombre,
      identificador,
      contrasena: await bcrypt.hash(contrasena, 10),
      rol_id: (await prisma.rol.findUnique({ where: { nombre: rol } })).id,
    },
  });
  console.log(`✅ Usuario ${rol} asegurado (${identificador} / ${contrasena})`);
}

async function main() {
  for (const nombre of ROLES) {
    await prisma.rol.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }
  console.log(`✅ Roles asegurados: ${ROLES.join(', ')}`);

  for (const usuario of USUARIOS_DEMO) {
    await crearUsuarioDemo(usuario);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

-- CreateEnum
CREATE TYPE "EstadoDenuncia" AS ENUM ('Recibida', 'En proceso', 'Resuelta', 'Reincidente', 'Descartada');

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "identificador" TEXT NOT NULL,
    "contrasena" TEXT NOT NULL,
    "rol_id" INTEGER NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "responsables" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "responsables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "denuncias" (
    "id" SERIAL NOT NULL,
    "codigo_unico" TEXT NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo_incidencia" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "foto_url" TEXT,
    "latitud" DECIMAL(10,7) NOT NULL,
    "longitud" DECIMAL(10,7) NOT NULL,
    "estado" "EstadoDenuncia" NOT NULL DEFAULT 'Recibida',
    "id_usuario_denunciante" INTEGER NOT NULL,
    "id_responsable_asignado" INTEGER,

    CONSTRAINT "denuncias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bitacora" (
    "id" SERIAL NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo_accion" TEXT NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_denuncia" INTEGER NOT NULL,
    "detalle" TEXT NOT NULL,

    CONSTRAINT "bitacora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" SERIAL NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mensaje" TEXT NOT NULL,
    "id_denuncia" INTEGER NOT NULL,
    "id_usuario_destinatario" INTEGER NOT NULL,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_identificador_key" ON "usuarios"("identificador");

-- CreateIndex
CREATE UNIQUE INDEX "denuncias_codigo_unico_key" ON "denuncias"("codigo_unico");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "denuncias" ADD CONSTRAINT "denuncias_id_usuario_denunciante_fkey" FOREIGN KEY ("id_usuario_denunciante") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "denuncias" ADD CONSTRAINT "denuncias_id_responsable_asignado_fkey" FOREIGN KEY ("id_responsable_asignado") REFERENCES "responsables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bitacora" ADD CONSTRAINT "bitacora_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bitacora" ADD CONSTRAINT "bitacora_id_denuncia_fkey" FOREIGN KEY ("id_denuncia") REFERENCES "denuncias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_id_denuncia_fkey" FOREIGN KEY ("id_denuncia") REFERENCES "denuncias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_id_usuario_destinatario_fkey" FOREIGN KEY ("id_usuario_destinatario") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

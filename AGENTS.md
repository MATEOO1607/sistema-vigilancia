# AGENTS.md

Backend del Sistema de Vigilancia Ciudadana. JavaScript puro (ESM, sin TypeScript), Express + Prisma sobre PostgreSQL alojado en Supabase. Desarrollo por fases; FASE 1 (setup + BD), FASE 2 (auth + denuncias) y FASE 3 (frontend) completas.

## Estructura

- Backend en la raíz: `index.js` (servidor), `prisma/`, `src/{routes,controllers,middlewares,config}`.
- Frontend en `frontend/`: Vite 8 + React 19 + Tailwind 4 (plugin `@tailwindcss/vite`, CSS con `@import "tailwindcss"`), `react-router-dom` 7, axios, Leaflet (`react-leaflet` 5, compatible con React 19).
- Frontend: `src/api/client.js` (axios con interceptores de token y 401→login), `src/context/AuthContext.jsx` (`useAuth`, `rutaSegunRol`; sesión en `localStorage`: `token` + `usuario`), `src/components/{RutaProtegida,Header,MapaDenuncias}.jsx`, `src/pages/{Login,Registro,Ciudadano,Admin}.jsx`, `src/utils/formato.js`.
- Rutas web: `/login`, `/registro` (auto-login tras registrar), `/ciudadano` (rol Ciudadano), `/admin` (Operador/Admin; tabla + modales Ver Detalles y Actualizar Estado + mapa).
- Producción: sin proxy de Vite; `frontend/src/api/client.js` construye la base como `${VITE_API_URL || 'http://localhost:3000'}/api` — en Vercel definir `VITE_API_URL` (URL de Render SIN `/api` al final). CORS abierto (`cors()`) en el backend; Render usa `npm start` (node index.js) y respeta `PORT`.

## Comandos

- Backend: `npm run dev` (raíz, puerto 3000).
- Frontend: `npm run dev` dentro de `frontend/` (puerto 5173). Build de verificación: `npm run build`.
- `npm run prisma:migrate` — aplica migraciones (`prisma migrate dev`). Requiere `DATABASE_URL` real en `.env` (copiar desde `.env.example`).
- `npx prisma db seed` — crea los roles (Ciudadano, Operador, Admin) y dos usuarios de prueba: admin@vigilancia.com / admin1234 (rol Admin) y operador@emacruz.com / operador1234 (rol Operador). `POST /api/auth/register` falla si el rol "Ciudadano" no existe.

## Restricciones del proyecto (pedidas por el usuario)

- JavaScript puro; NO introducir TypeScript.
- Base de datos en Supabase: solo la `DATABASE_URL` en `.env`; no configurar infraestructura adicional.
- Estructura: `src/routes`, `src/controllers`, `src/middlewares`, `src/config`. Validación con `zod` en los controladores.

## Convenciones de la API (FASE 2)

- Roles en `Rol.nombre`: `Ciudadano`, `Operador`, `Admin`. JWT con payload `{ id, rol }`, expira en 24h, firmado con `JWT_SECRET`.
- Middlewares de `src/middlewares/auth.js`: `authenticate` (inyecta `req.user`) y luego `checkRole([...])`.
- Tipos de incidencia permitidos (lista definitiva del usuario): `Microbasural`, `Quema`, `Residuos especiales`, `Otro` — ver `TIPOS_INCIDENCIA` en `src/controllers/denunciaController.js` (zod valida contra esa lista; es case-sensitive).
- REGLA ESTRICTA: al cambiar estado de una denuncia a `Resuelta` o `Descartada`, la `observacion` es obligatoria; todo cambio de estado crea registro en `Bitacora` con `tipo_accion: 'CAMBIO_ESTADO'`.
- Errores de validación zod responden 400 con `{ error, detalles: <fieldErrors> }`.

## Gotchas

- Prisma se fijó a la 5.x (el usuario bajó de 6 y migró su Supabase con esa). No actualizar a 6/7 sin migrar configuración: la v7 ya no acepta `url = env("DATABASE_URL")` en el schema.
- Frontend: la lista `TIPOS_INCIDENCIA` está duplicada en `frontend/src/pages/Ciudadano.jsx` (los `<option>` del select); mantenerla sincronizada con la del backend si cambian. El estado de denuncia viaja como `En_proceso` y se muestra con `mostrarEstado()`.
- Selector de ubicación (modal Nueva Denuncia): patrón "pin fijo en el centro" — el usuario arrastra el mapa y las coordenadas salen de `mapRef.current.getCenter()` al enviar (no hay inputs de lat/long). `ref` de `MapContainer` expone la instancia Leaflet. Fallback de ubicación: Santa Cruz (`SANTA_CRUZ` en el archivo). El pin es un SVG `pointer-events-none` con `z-[1001]`.
- `react-leaflet` 5 requiere React 19 (correcto aquí); el icono por defecto de Leaflet se registra a mano en `MapaDenuncias.jsx` porque el bundler rompe sus rutas. El mapa siempre arranca centrado en Santa Cruz de la Sierra (`-17.7833, -63.1821`, zoom 12), no en la primera denuncia.
- Los modales usan `z-[9999]` (no `z-50`) para quedar por encima de los paneles de Leaflet (~z-index 400–1000). Si creas un modal nuevo, usa ese mismo z-index.
- Frontend tiene su propio `package.json` y `node_modules` dentro de `frontend/`.
- `npm audit` reporta vulnerabilidades high en el CLI de Prisma (`@prisma/config` → `deepmerge-ts`); afectan solo al tooling de dev. No ejecutar `npm audit fix --force`.
- Este entorno npm bloquea scripts de postinstall: tras instalar paquetes Prisma, ejecutar `npm install-scripts approve <pkg>` (los aprobados están en `package.json` → `allowScripts`).
- En `schema.prisma` el enum usa `En_proceso @map("En proceso")`: la BD guarda "En proceso" con espacio, pero el cliente Prisma usa `En_proceso`. El endpoint `PUT /:id/estado` acepta ambas formas (un `z.preprocess` reemplaza espacios por `_`).
- La relación `Denuncia.id_responsable_asignado` apunta a `Responsable` (opcional), no a `Usuario`.
- `.env` contiene la `DATABASE_URL` real del usuario; nunca leerla ni mostrarla su contenido. Ya incluye `JWT_SECRET` generado aleatoriamente.

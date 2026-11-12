import jwt from 'jsonwebtoken';

/**
 * Middleware de autenticación: verifica el token Bearer
 * e inyecta el payload decodificado en req.user ({ id, rol }).
 */
export function authenticate(req, res, next) {
  const header = req.headers.authorization ?? '';

  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = header.slice(7);

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

/**
 * Middleware de autorización por rol. Usar DESPUÉS de authenticate.
 * Ejemplo: checkRole(['Operador', 'Admin'])
 */
export function checkRole(rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tienes permisos para esta acción' });
    }
    next();
  };
}

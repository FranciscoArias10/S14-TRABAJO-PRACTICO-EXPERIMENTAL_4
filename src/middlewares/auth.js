const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_jwt_desarrollo_web_unemi_2026';

/**
 * Genera un token JWT firmado para el usuario autenticado.
 */
function generarToken(usuario) {
  const payload = {
    id: String(usuario.id || usuario._id),
    email: usuario.email,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
  });
}

/**
 * Middleware que valida el token JWT enviado en el encabezado Authorization: Bearer <token>.
 */
function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Acceso denegado. No se proporcionó un token JWT válido.',
    });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({
      error: 'Acceso denegado. No se proporcionó un token JWT válido.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded;
    return next();
  } catch {
    return res.status(401).json({
      error: 'Token JWT inválido o expirado.',
    });
  }
}

module.exports = { generarToken, verificarToken };


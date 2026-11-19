// 404 para rutas que no existen
function notFound(req, res) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

// Manejador central de errores
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // JSON mal formado en el body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido.' });
  }

  // Violación de índice único en MongoDB (email duplicado)
  if (err.code === 11000 || err.code === '23505') {
    return res.status(409).json({ error: 'Ya existe un usuario registrado con ese email.' });
  }

  // Error de casteo de ObjectId en Mongoose
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Identificador de usuario no válido.' });
  }

  // Errores de validación de esquema en Mongoose
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Datos inválidos.', detalles: err.message });
  }

  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor.' });
}

module.exports = { notFound, errorHandler };

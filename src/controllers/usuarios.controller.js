const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');
const { generarToken } = require('../middlewares/auth');

// POST /usuarios -> Registrar usuario en MongoDB y generar JWT
async function crearUsuario(req, res) {
  const { nombre, apellido, email, password, telefono } = req.body;
  const emailNormalizado = email.trim().toLowerCase();

  const existente = await Usuario.findOne({ email: emailNormalizado });
  if (existente) {
    return res.status(409).json({ error: 'Ya existe un usuario registrado con ese email.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const usuario = await Usuario.create({
    nombre: nombre.trim(),
    apellido: apellido.trim(),
    email: emailNormalizado,
    password: passwordHash,
    telefono: telefono?.trim() || null,
  });

  const token = generarToken(usuario);

  return res.status(201).json({
    mensaje: 'Usuario registrado correctamente.',
    token,
    usuario,
  });
}

// GET /usuarios -> Consultar todos (ruta protegida)
async function obtenerUsuarios(req, res) {
  const usuarios = await Usuario.find().sort({ creado_en: -1 });
  return res.status(200).json({ total: usuarios.length, usuarios });
}

// GET /usuarios/:id -> Consultar por ID (ruta protegida)
async function obtenerUsuarioPorId(req, res) {
  const usuario = await Usuario.findById(req.params.id);

  if (!usuario) {
    return res.status(404).json({ error: `No existe un usuario con id ${req.params.id}.` });
  }
  return res.status(200).json(usuario);
}

// PUT /usuarios/:id -> Actualizar (solo los campos enviados, ruta protegida)
async function actualizarUsuario(req, res) {
  const { nombre, apellido, email, password, telefono } = req.body;
  const datos = {};

  if (nombre !== undefined) datos.nombre = nombre.trim();
  if (apellido !== undefined) datos.apellido = apellido.trim();
  if (email !== undefined) {
    const emailNormalizado = email.trim().toLowerCase();
    const duplicado = await Usuario.findOne({
      email: emailNormalizado,
      _id: { $ne: req.params.id },
    });
    if (duplicado) {
      return res.status(409).json({ error: 'Ya existe un usuario registrado con ese email.' });
    }
    datos.email = emailNormalizado;
  }
  if (password !== undefined) datos.password = await bcrypt.hash(password, 10);
  if (telefono !== undefined) datos.telefono = telefono?.trim() || null;

  const usuario = await Usuario.findByIdAndUpdate(req.params.id, datos, {
    returnDocument: 'after',
    runValidators: true,
  });

  if (!usuario) {
    return res.status(404).json({ error: `No existe un usuario con id ${req.params.id}.` });
  }
  return res.status(200).json({ mensaje: 'Usuario actualizado correctamente.', usuario });
}

// DELETE /usuarios/:id -> Eliminar (ruta protegida)
async function eliminarUsuario(req, res) {
  const usuario = await Usuario.findByIdAndDelete(req.params.id);

  if (!usuario) {
    return res.status(404).json({ error: `No existe un usuario con id ${req.params.id}.` });
  }
  return res.status(200).json({ mensaje: 'Usuario eliminado correctamente.', usuario });
}

module.exports = {
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  eliminarUsuario,
};

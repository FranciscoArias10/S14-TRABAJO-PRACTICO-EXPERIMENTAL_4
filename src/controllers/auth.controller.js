const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');
const { generarToken } = require('../middlewares/auth');
const { crearUsuario } = require('./usuarios.controller');

// POST /api/auth/register -> Registro de nuevo usuario
const registrar = crearUsuario;

// POST /api/auth/login -> Autenticación y generación de JWT
async function login(req, res) {
  const { email, password } = req.body;
  const emailNormalizado = email.trim().toLowerCase();

  const usuario = await Usuario.findOne({ email: emailNormalizado });
  if (!usuario) {
    return res.status(401).json({
      error: 'Credenciales inválidas (email o contraseña incorrectos).',
    });
  }

  const passwordValida = await bcrypt.compare(password, usuario.password);
  if (!passwordValida) {
    return res.status(401).json({
      error: 'Credenciales inválidas (email o contraseña incorrectos).',
    });
  }

  const token = generarToken(usuario);

  return res.status(200).json({
    mensaje: 'Inicio de sesión exitoso.',
    token,
    usuario,
  });
}

// GET /api/auth/perfil -> Ruta protegida que valida el JWT y devuelve el usuario autenticado
async function obtenerPerfil(req, res) {
  const usuario = await Usuario.findById(req.usuario.id);

  if (!usuario) {
    return res.status(404).json({ error: 'El usuario asociado al token ya no existe.' });
  }

  return res.status(200).json({
    mensaje: 'Acceso autorizado a ruta protegida.',
    usuario,
    tokenInfo: req.usuario,
  });
}

module.exports = {
  registrar,
  login,
  obtenerPerfil,
};


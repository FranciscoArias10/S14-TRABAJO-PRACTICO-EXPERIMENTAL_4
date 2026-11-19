const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { verificarToken } = require('../middlewares/auth');
const { validarLogin, validarUsuario } = require('../middlewares/validarUsuario');

const router = Router();

// Rutas públicas de autenticación
router.post('/register', validarUsuario({ parcial: false }), authController.registrar);
router.post('/login', validarLogin, authController.login);

// Ruta protegida mediante JWT
router.get('/perfil', verificarToken, authController.obtenerPerfil);

module.exports = router;


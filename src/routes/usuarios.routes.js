const { Router } = require('express');
const controller = require('../controllers/usuarios.controller');
const authController = require('../controllers/auth.controller');
const { verificarToken } = require('../middlewares/auth');
const { validarId, validarLogin, validarUsuario } = require('../middlewares/validarUsuario');

const router = Router();

// Rutas públicas (registro y login)
router.post('/', validarUsuario({ parcial: false }), controller.crearUsuario);
router.post('/login', validarLogin, authController.login);

// Rutas protegidas con JWT
router.get('/perfil', verificarToken, authController.obtenerPerfil);
router.get('/', verificarToken, controller.obtenerUsuarios);
router.get('/:id', verificarToken, validarId, controller.obtenerUsuarioPorId);
router.put('/:id', verificarToken, validarId, validarUsuario({ parcial: true }), controller.actualizarUsuario);
router.delete('/:id', verificarToken, validarId, controller.eliminarUsuario);

module.exports = router;

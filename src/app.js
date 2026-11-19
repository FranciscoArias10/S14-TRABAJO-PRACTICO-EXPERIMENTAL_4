const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Ruta de bienvenida / verificación
app.get('/', (req, res) => {
  res.status(200).json({
    mensaje: 'API REST Full Stack de Usuarios - Node.js + Express + MongoDB + JWT',
    endpointsPublicos: {
      registro: 'POST /api/auth/register (o POST /usuarios)',
      login: 'POST /api/auth/login (o POST /usuarios/login)',
    },
    endpointsProtegidosJWT: {
      perfil: 'GET /api/auth/perfil (o GET /usuarios/perfil)',
      consultarTodos: 'GET /usuarios',
      consultarPorId: 'GET /usuarios/:id',
      actualizar: 'PUT /usuarios/:id',
      eliminar: 'DELETE /usuarios/:id',
    },
  });
});

// Rutas de autenticación y usuarios
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/usuarios', usuariosRoutes);

// Manejo de rutas inexistentes y errores
app.use(notFound);
app.use(errorHandler);

module.exports = app;

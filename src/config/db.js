const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MongoMemoryServer } = require('mongodb-memory-server');
require('dotenv').config({ quiet: true });

const Usuario = require('../models/Usuario');

let memoryServer = null;

/**
 * Siembra usuarios de ejemplo en MongoDB cuando la colección está vacía.
 */
async function sembrarUsuariosIniciales() {
  const total = await Usuario.countDocuments();
  if (total > 0) return;

  const passwordHash = await bcrypt.hash('123456', 10);
  await Usuario.insertMany([
    {
      nombre: 'Ana',
      apellido: 'Torres',
      email: 'ana.torres@correo.com',
      password: passwordHash,
      telefono: '0991234567',
    },
    {
      nombre: 'Luis',
      apellido: 'Pérez',
      email: 'luis.perez@correo.com',
      password: passwordHash,
      telefono: '0987654321',
    },
  ]);

  console.log('✔ Usuarios iniciales creados en MongoDB (ana.torres@correo.com / luis.perez@correo.com)');
}

/**
 * Conecta con MongoDB usando MONGODB_URI o una instancia local en memoria si no hay servicio activo.
 */
async function conectarDB({ silenciarFallback = false } = {}) {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/api_usuarios';

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2500 });
    console.log(`✔ Conectado a MongoDB (${uri})`);
  } catch (err) {
    if (!silenciarFallback) {
      console.warn(`• MongoDB externo no disponible (${err.message}). Iniciando MongoDB local integrado...`);
    }
    memoryServer = await MongoMemoryServer.create();
    const memoryUri = memoryServer.getUri('api_usuarios');
    await mongoose.connect(memoryUri);
    console.log(`✔ Conectado a MongoDB local integrado (${memoryUri})`);
  }

  await Usuario.init();
  await sembrarUsuariosIniciales();
  return mongoose.connection;
}

/**
 * Cierra la conexión a MongoDB y detiene el servidor en memoria si fue iniciado.
 */
async function desconectarDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}

module.exports = { conectarDB, desconectarDB, sembrarUsuariosIniciales, mongoose };

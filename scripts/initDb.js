// Inicializa la colección "usuarios" en MongoDB e inserta datos de ejemplo.
// Uso: npm run db:init
require('dotenv').config({ quiet: true });

const { conectarDB, desconectarDB } = require('../src/config/db');
const Usuario = require('../src/models/Usuario');

async function main() {
  await conectarDB();
  const total = await Usuario.countDocuments();
  console.log(`✔ Colección "usuarios" lista en MongoDB (${total} registros).`);
  await desconectarDB();
}

main().catch(async (err) => {
  console.error('✖ Error inicializando MongoDB:', err.message);
  await desconectarDB().catch(() => {});
  process.exit(1);
});

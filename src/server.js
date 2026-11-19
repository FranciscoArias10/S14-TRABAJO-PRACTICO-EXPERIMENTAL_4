require('dotenv').config({ quiet: true });

const app = require('./app');
const { conectarDB } = require('./config/db');

const PORT = process.env.PORT || 3000;

async function iniciar() {
  try {
    await conectarDB();

    app.listen(PORT, () => {
      console.log(`✔ Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('✖ No se pudo iniciar el servidor o conectar a MongoDB:', err.message);
    process.exit(1);
  }
}

iniciar();

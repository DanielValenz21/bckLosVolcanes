const sql = require('mssql');

const dbSettings = {
  user: 'sa',
  password: 'Daniel12',
  server: 'DESKTOP-12PJMKF',  // o 'localhost'
  port: 1434,                // el puerto que fijaste
  database: 'SistemaInventarioVentasDB',
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

async function getConnection() {
  try {
    const pool = await sql.connect(dbSettings);
    return pool;
  } catch (error) {
    console.error('Error conectando a la base de datos:', error);
    throw error;
  }
}

module.exports = {
  getConnection,
  sql
};

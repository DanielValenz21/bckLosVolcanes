const express = require('express');
const { getConnection } = require('./config/db.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/test-db', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query('Select * from MovimientosCamiones');
    res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error probando la conexión:', error);
    res.status(500).json({
      success: false,
      message: 'No se pudo conectar a la base de datos',
      error
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto: ${PORT}`);
});

// controllers/clientes.controller.js
const { getConnection, sql } = require('../config/db');

async function getClientes(req, res) {
  try {
    const pool = await getConnection();
    // Un join para traer también el nombre del tipo de cliente
    const result = await pool.request().query(`
      SELECT 
        c.IdCliente,
        c.NombreCliente,
        c.IdTipoCliente,
        tc.NombreTipo as TipoCliente
      FROM Clientes c
      JOIN TiposCliente tc ON c.IdTipoCliente = tc.IdTipoCliente
      WHERE c.Activo = 1
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

module.exports = { getClientes };

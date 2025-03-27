// controllers/clientes.controller.js
const { pool } = require('../config/db');

async function getClientes(req, res) {
  try {
    // Un JOIN para traer también el nombre del tipo de cliente
    const [rows] = await pool.execute(`
      SELECT
        c.IdCliente,
        c.NombreCliente,
        c.IdTipoCliente,
        tc.NombreTipo AS TipoCliente
      FROM Clientes c
      JOIN TiposCliente tc ON c.IdTipoCliente = tc.IdTipoCliente
      WHERE c.Activo = 1
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

module.exports = { getClientes };
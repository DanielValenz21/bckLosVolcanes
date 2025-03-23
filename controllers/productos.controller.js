// controllers/productos.controller.js
const { getConnection, sql } = require('../config/db');

async function getProductos(req, res) {
  try {
    const pool = await getConnection();
    // Aquí devolvemos sólo lo básico: IdProducto, NombreProducto y PrecioBase.
    // Si quieres también stock, deberías guardarlo en la tabla o calcularlo.
    const result = await pool.request()
      .query(`
        SELECT 
          p.IdProducto,
          p.NombreProducto,
          p.PrecioBase,
          -- si tienes un campo "Stock" o quieres hacer un JOIN/VIEW para calcularlo, puedes incluirlo
          p.Activo
        FROM Productos p
        WHERE p.Activo = 1
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

module.exports = { getProductos };

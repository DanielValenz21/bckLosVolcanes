// controllers/productos.controller.js
const { pool } = require('../config/db');

async function getProductos(req, res) {
  try {
    // Sumamos el CambioCantidad de cada producto y lo llamamos "Stock".
    // Si no hay transacciones para un producto, usamos 0 (IFNULL).
    const [rows] = await pool.execute(`
      SELECT
        p.IdProducto,
        p.NombreProducto,
        p.PrecioBase,
        IFNULL(SUM(ti.CambioCantidad), 0) AS Stock
      FROM Productos p
      LEFT JOIN TransaccionesInventario ti ON p.IdProducto = ti.IdProducto
      WHERE p.Activo = 1
      GROUP BY p.IdProducto, p.NombreProducto, p.PrecioBase
      ORDER BY p.IdProducto
    `);

    res.json(rows);
  } catch (error) {
    console.error('Error al obtener productos con stock:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

module.exports = { getProductos };
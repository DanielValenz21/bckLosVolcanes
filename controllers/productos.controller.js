// controllers/productos.controller.js
const { getConnection, sql } = require('../config/db');

async function getProductos(req, res) {
  try {
    const pool = await getConnection();
    // Sumamos el CambioCantidad de cada producto y lo llamamos "Stock".
    // Si no hay transacciones para un producto, usamos 0 (ISNULL).
    const result = await pool.request()
      .query(`
        SELECT 
          p.IdProducto,
          p.NombreProducto,
          p.PrecioBase,
          ISNULL(SUM(ti.CambioCantidad), 0) AS Stock
        FROM Productos p
        LEFT JOIN TransaccionesInventario ti ON p.IdProducto = ti.IdProducto
        WHERE p.Activo = 1
        GROUP BY p.IdProducto, p.NombreProducto, p.PrecioBase
        ORDER BY p.IdProducto
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener productos con stock:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

module.exports = { getProductos };

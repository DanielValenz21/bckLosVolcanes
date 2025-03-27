// controllers/ventas.controller.js
const { pool } = require('../config/db');

/**
 * CREA UNA NUEVA VENTA (cabecera y detalles)
 */
const crearVenta = async (req, res) => {
  const { IdCliente, CreadoPor, Descuento = 0, Detalles } = req.body;
  if (!IdCliente || !CreadoPor || !Detalles || !Array.isArray(Detalles) || Detalles.length === 0) {
    return res.status(400).json({ message: 'Faltan campos requeridos o Detalles está vacío' });
  }
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Obtener el IdTipoCliente
    const [clienteRows] = await connection.execute(
      'SELECT IdTipoCliente FROM Clientes WHERE IdCliente = ?',
      [IdCliente]
    );
    if (clienteRows.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Cliente no encontrado' });
    }
    const IdTipoCliente = clienteRows[0].IdTipoCliente;

    let subtotalVenta = 0;
    const detallesParaInsertar = [];

    // Procesar cada detalle
    for (const detalle of Detalles) {
      const { IdProducto, Cantidad, PorcentajeDescuento = 0 } = detalle;
      if (!IdProducto || !Cantidad || Cantidad <= 0) {
        await connection.rollback();
        return res.status(400).json({ message: 'Detalle con campos inválidos' });
      }

      // Buscar precio especial
      const [precioEspecialRows] = await connection.execute(
        'SELECT PrecioEspecial FROM PreciosProducto WHERE IdProducto = ? AND IdTipoCliente = ?',
        [IdProducto, IdTipoCliente]
      );
      let PrecioUnitario;
      if (precioEspecialRows.length > 0 && precioEspecialRows[0].PrecioEspecial != null) {
        PrecioUnitario = precioEspecialRows[0].PrecioEspecial;
      } else {
        // Usar PrecioBase
        const [precioBaseRows] = await connection.execute(
          'SELECT PrecioBase FROM Productos WHERE IdProducto = ?',
          [IdProducto]
        );
        if (precioBaseRows.length === 0) {
          await connection.rollback();
          return res.status(400).json({ message: `Producto con Id ${IdProducto} no encontrado` });
        }
        PrecioUnitario = precioBaseRows[0].PrecioBase;
      }
      const precioEfectivo = PrecioUnitario * (1 - (PorcentajeDescuento / 100));
      const subtotalLinea = precioEfectivo * Cantidad;
      subtotalVenta += subtotalLinea;
      detallesParaInsertar.push({ IdProducto, Cantidad, PrecioUnitario, PorcentajeDescuento });
    }

    const Total = subtotalVenta - Descuento;

    // Insertar cabecera en Ventas
    const [ventaResult] = await connection.execute(
      `INSERT INTO Ventas (IdCliente, CreadoPor, FechaVenta, Subtotal, Descuento, Total, Estado)
       VALUES (?, ?, NOW(), ?, ?, ?, 'Pendiente')`,
      [IdCliente, CreadoPor, subtotalVenta, Descuento, Total]
    );
    const IdVenta = ventaResult.insertId;

    // Insertar detalles
    for (const detalle of detallesParaInsertar) {
      await connection.execute(
        `INSERT INTO DetallesVenta (IdVenta, IdProducto, Cantidad, PrecioUnitario, PorcentajeDescuento)
         VALUES (?, ?, ?, ?, ?)`,
        [IdVenta, detalle.IdProducto, detalle.Cantidad, detalle.PrecioUnitario, detalle.PorcentajeDescuento]
      );
    }

    await connection.commit();
    res.json({ message: 'Venta creada exitosamente', IdVenta });
  } catch (error) {
    console.error('Error al crear venta:', error);
    if (connection) await connection.rollback();
    res.status(500).json({ message: 'Error interno del servidor' });
  } finally {
    if (connection) connection.release();
  }
};

/**
 * LISTAR TODAS LAS VENTAS (incluye el NombreCliente)
 */
const getVentas = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        v.IdVenta,
        v.IdCliente,
        c.NombreCliente,
        v.FechaVenta,
        v.Subtotal,
        v.Descuento,
        v.Total,
        v.Estado,
        v.CreadoPor
      FROM Ventas v
      JOIN Clientes c ON v.IdCliente = c.IdCliente
      ORDER BY v.FechaVenta DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * OBTENER DETALLE DE UNA VENTA POR ID
 */
const getVentaById = async (req, res) => {
  const { id } = req.params;
  try {
    const [ventaRows] = await pool.execute(
      'SELECT * FROM Ventas WHERE IdVenta = ?',
      [id]
    );
    if (ventaRows.length === 0) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }
    const venta = ventaRows[0];
    const [detallesRows] = await pool.execute(
      `SELECT dv.*, p.NombreProducto
       FROM DetallesVenta dv
       LEFT JOIN Productos p ON dv.IdProducto = p.IdProducto
       WHERE dv.IdVenta = ?`,
      [id]
    );
    res.json({ venta, detalles: detallesRows });
  } catch (error) {
    console.error('Error al obtener la venta:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * ACTUALIZAR UNA VENTA (solo si está "Pendiente")
 */
const updateVenta = async (req, res) => {
  const { id } = req.params;
  const { Descuento = 0, Detalles } = req.body;
  if (!Detalles || !Array.isArray(Detalles) || Detalles.length === 0) {
    return res.status(400).json({ message: 'Detalles deben ser proporcionados' });
  }
  let connection;
  try {
    connection = await pool.getConnection();
    // Verificar la venta
    const [ventaRows] = await connection.execute(
      'SELECT * FROM Ventas WHERE IdVenta = ?',
      [id]
    );
    if (ventaRows.length === 0) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }
    const venta = ventaRows[0];
    if (venta.Estado !== 'Pendiente') {
      return res.status(400).json({ message: 'Solo se puede actualizar ventas en estado Pendiente' });
    }

    await connection.beginTransaction();
    // Obtener IdTipoCliente
    const [clienteRows] = await connection.execute(
      'SELECT IdTipoCliente FROM Clientes WHERE IdCliente = ?',
      [venta.IdCliente]
    );
    if (clienteRows.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Cliente no encontrado' });
    }
    const IdTipoCliente = clienteRows[0].IdTipoCliente;

    let subtotalVenta = 0;
    const detallesParaInsertar = [];

    // Procesar detalles
    for (const detalle of Detalles) {
      const { IdProducto, Cantidad, PorcentajeDescuento = 0 } = detalle;
      if (!IdProducto || !Cantidad || Cantidad <= 0) {
        await connection.rollback();
        return res.status(400).json({ message: 'Detalle con campos inválidos' });
      }
      const [precioEspecialRows] = await connection.execute(
        'SELECT PrecioEspecial FROM PreciosProducto WHERE IdProducto = ? AND IdTipoCliente = ?',
        [IdProducto, IdTipoCliente]
      );
      let PrecioUnitario;
      if (precioEspecialRows.length > 0 && precioEspecialRows[0].PrecioEspecial != null) {
        PrecioUnitario = precioEspecialRows[0].PrecioEspecial;
      } else {
        const [precioBaseRows] = await connection.execute(
          'SELECT PrecioBase FROM Productos WHERE IdProducto = ?',
          [IdProducto]
        );
        if (precioBaseRows.length === 0) {
          await connection.rollback();
          return res.status(400).json({ message: `Producto con Id ${IdProducto} no encontrado` });
        }
        PrecioUnitario = precioBaseRows[0].PrecioBase;
      }
      const precioEfectivo = PrecioUnitario * (1 - (PorcentajeDescuento / 100));
      const subtotalLinea = precioEfectivo * Cantidad;
      subtotalVenta += subtotalLinea;
      detallesParaInsertar.push({ IdProducto, Cantidad, PrecioUnitario, PorcentajeDescuento });
    }

    const Total = subtotalVenta - Descuento;

    // Actualizar cabecera
    await connection.execute(
      'UPDATE Ventas SET Subtotal = ?, Descuento = ?, Total = ? WHERE IdVenta = ?',
      [subtotalVenta, Descuento, Total, id]
    );

    // Eliminar detalles previos
    await connection.execute(
      'DELETE FROM DetallesVenta WHERE IdVenta = ?',
      [id]
    );

    // Insertar nuevos detalles
    for (const detalle of detallesParaInsertar) {
      await connection.execute(
        `INSERT INTO DetallesVenta (IdVenta, IdProducto, Cantidad, PrecioUnitario, PorcentajeDescuento)
         VALUES (?, ?, ?, ?, ?)`,
        [id, detalle.IdProducto, detalle.Cantidad, detalle.PrecioUnitario, detalle.PorcentajeDescuento]
      );
    }

    await connection.commit();
    res.json({ message: 'Venta actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar venta:', error);
    if (connection) await connection.rollback();
    res.status(500).json({ message: 'Error interno del servidor' });
  } finally {
    if (connection) connection.release();
  }
};

/**
 * CANCELAR UNA VENTA (actualiza estado a "Cancelado")
 */
const cancelVenta = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.execute(
      "UPDATE Ventas SET Estado = 'Cancelado' WHERE IdVenta = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }
    res.json({ message: 'Venta cancelada exitosamente' });
  } catch (error) {
    console.error('Error al cancelar venta:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  crearVenta,
  getVentas,
  getVentaById,
  updateVenta,
  cancelVenta
};
// controllers/ventas.controller.js
const { getConnection, sql } = require('../config/db');

/**
 * CREA UNA NUEVA VENTA (cabecera y detalles):
 *  - Body JSON:
 *    {
 *      "IdCliente": 1,
 *      "CreadoPor": 2,
 *      "Descuento": 0,
 *      "Detalles": [
 *        {
 *          "IdProducto": 10,
 *          "Cantidad": 2,
 *          "PorcentajeDescuento": 5
 *        },
 *        ...
 *      ]
 *    }
 */
const crearVenta = async (req, res) => {
  let transaction;
  try {
    const { IdCliente, CreadoPor, Descuento = 0, Detalles } = req.body;
    if (!IdCliente || !CreadoPor || !Detalles || !Array.isArray(Detalles) || Detalles.length === 0) {
      return res.status(400).json({ message: 'Faltan campos requeridos o Detalles está vacío' });
    }

    const pool = await getConnection();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    // 1. Obtener el IdTipoCliente del cliente
    let result = await transaction.request()
      .input('IdCliente', sql.Int, IdCliente)
      .query('SELECT IdTipoCliente FROM Clientes WHERE IdCliente = @IdCliente');
    if (result.recordset.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Cliente no encontrado' });
    }
    const IdTipoCliente = result.recordset[0].IdTipoCliente;

    let subtotalVenta = 0;
    const detallesParaInsertar = [];

    // 2. Recorrer cada detalle y calcular precios
    for (const detalle of Detalles) {
      const { IdProducto, Cantidad, PorcentajeDescuento = 0 } = detalle;
      if (!IdProducto || !Cantidad || Cantidad <= 0) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Detalle con campos inválidos' });
      }

      // Buscar precio especial
      result = await transaction.request()
        .input('IdProducto', sql.Int, IdProducto)
        .input('IdTipoCliente', sql.Int, IdTipoCliente)
        .query('SELECT PrecioEspecial FROM PreciosProducto WHERE IdProducto = @IdProducto AND IdTipoCliente = @IdTipoCliente');
      
      let PrecioUnitario;
      if (result.recordset.length > 0 && result.recordset[0].PrecioEspecial != null) {
        PrecioUnitario = result.recordset[0].PrecioEspecial;
      } else {
        // Usar precio base
        result = await transaction.request()
          .input('IdProducto', sql.Int, IdProducto)
          .query('SELECT PrecioBase FROM Productos WHERE IdProducto = @IdProducto');
        if (result.recordset.length === 0) {
          await transaction.rollback();
          return res.status(400).json({ message: `Producto con Id ${IdProducto} no encontrado` });
        }
        PrecioUnitario = result.recordset[0].PrecioBase;
      }

      // Calcular subtotal de la línea aplicando descuento de línea
      const precioEfectivo = PrecioUnitario * (1 - (PorcentajeDescuento / 100));
      const subtotalLinea = precioEfectivo * Cantidad;
      subtotalVenta += subtotalLinea;

      detallesParaInsertar.push({
        IdProducto,
        Cantidad,
        PrecioUnitario,
        PorcentajeDescuento
      });
    }

    // 3. Calcular total (subtotal - descuento global)
    const Total = subtotalVenta - Descuento;

    // 4. Insertar cabecera en Ventas
    result = await transaction.request()
      .input('IdCliente', sql.Int, IdCliente)
      .input('CreadoPor', sql.Int, CreadoPor)
      .input('FechaVenta', sql.DateTime, new Date())
      .input('Subtotal', sql.Decimal(18, 2), subtotalVenta)
      .input('Descuento', sql.Decimal(18, 2), Descuento)
      .input('Total', sql.Decimal(18, 2), Total)
      .input('Estado', sql.VarChar, 'Pendiente')
      .query(`
        INSERT INTO Ventas (IdCliente, CreadoPor, FechaVenta, Subtotal, Descuento, Total, Estado)
        VALUES (@IdCliente, @CreadoPor, @FechaVenta, @Subtotal, @Descuento, @Total, @Estado);
        SELECT SCOPE_IDENTITY() AS IdVenta;
      `);
    const IdVenta = result.recordset[0].IdVenta;

    // 5. Insertar detalles
    for (const detalle of detallesParaInsertar) {
      await transaction.request()
        .input('IdVenta', sql.Int, IdVenta)
        .input('IdProducto', sql.Int, detalle.IdProducto)
        .input('Cantidad', sql.Decimal(18, 2), detalle.Cantidad)
        .input('PrecioUnitario', sql.Decimal(18, 2), detalle.PrecioUnitario)
        .input('PorcentajeDescuento', sql.Decimal(5, 2), detalle.PorcentajeDescuento)
        .query(`
          INSERT INTO DetallesVenta (IdVenta, IdProducto, Cantidad, PrecioUnitario, PorcentajeDescuento)
          VALUES (@IdVenta, @IdProducto, @Cantidad, @PrecioUnitario, @PorcentajeDescuento)
        `);
    }

    await transaction.commit();
    return res.json({ message: 'Venta creada exitosamente', IdVenta });
  } catch (error) {
    console.error('Error al crear venta:', error);
    if (transaction) {
      try { await transaction.rollback(); } catch (e) { console.error('Rollback error:', e); }
    }
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * LISTAR TODAS LAS VENTAS
 */
const getVentas = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query('SELECT * FROM Ventas ORDER BY FechaVenta DESC');
    return res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * OBTENER DETALLE DE UNA VENTA POR ID
 */
const getVentaById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();
    
    let result = await pool.request()
      .input('IdVenta', sql.Int, id)
      .query('SELECT * FROM Ventas WHERE IdVenta = @IdVenta');
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }
    const venta = result.recordset[0];

    // Obtener detalles
    result = await pool.request()
      .input('IdVenta', sql.Int, id)
      .query(`
        SELECT dv.*, p.NombreProducto
        FROM DetallesVenta dv
        LEFT JOIN Productos p ON dv.IdProducto = p.IdProducto
        WHERE dv.IdVenta = @IdVenta
      `);
    const detalles = result.recordset;

    return res.json({ venta, detalles });
  } catch (error) {
    console.error('Error al obtener la venta:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * ACTUALIZAR UNA VENTA (si está en estado "Pendiente")
 *  - Reemplaza todos los detalles y recalcula Subtotal, Total, etc.
 */
const updateVenta = async (req, res) => {
  let transaction;
  try {
    const { id } = req.params;
    const { Descuento = 0, Detalles } = req.body;
    if (!Detalles || !Array.isArray(Detalles) || Detalles.length === 0) {
      return res.status(400).json({ message: 'Detalles deben ser proporcionados' });
    }

    const pool = await getConnection();

    // Verificar que la venta existe y que esté en estado "Pendiente"
    let result = await pool.request()
      .input('IdVenta', sql.Int, id)
      .query('SELECT * FROM Ventas WHERE IdVenta = @IdVenta');
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }
    const venta = result.recordset[0];
    if (venta.Estado !== 'Pendiente') {
      return res.status(400).json({ message: 'Solo se puede actualizar ventas en estado Pendiente' });
    }

    transaction = new sql.Transaction(pool);
    await transaction.begin();

    // Obtener IdTipoCliente
    result = await transaction.request()
      .input('IdCliente', sql.Int, venta.IdCliente)
      .query('SELECT IdTipoCliente FROM Clientes WHERE IdCliente = @IdCliente');
    if (result.recordset.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Cliente no encontrado' });
    }
    const IdTipoCliente = result.recordset[0].IdTipoCliente;

    let subtotalVenta = 0;
    const detallesParaInsertar = [];

    // Calcular nuevos detalles
    for (const detalle of Detalles) {
      const { IdProducto, Cantidad, PorcentajeDescuento = 0 } = detalle;
      if (!IdProducto || !Cantidad || Cantidad <= 0) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Detalle con campos inválidos' });
      }

      // Buscar precio especial
      result = await transaction.request()
        .input('IdProducto', sql.Int, IdProducto)
        .input('IdTipoCliente', sql.Int, IdTipoCliente)
        .query('SELECT PrecioEspecial FROM PreciosProducto WHERE IdProducto = @IdProducto AND IdTipoCliente = @IdTipoCliente');
      
      let PrecioUnitario;
      if (result.recordset.length > 0 && result.recordset[0].PrecioEspecial != null) {
        PrecioUnitario = result.recordset[0].PrecioEspecial;
      } else {
        result = await transaction.request()
          .input('IdProducto', sql.Int, IdProducto)
          .query('SELECT PrecioBase FROM Productos WHERE IdProducto = @IdProducto');
        if (result.recordset.length === 0) {
          await transaction.rollback();
          return res.status(400).json({ message: `Producto con Id ${IdProducto} no encontrado` });
        }
        PrecioUnitario = result.recordset[0].PrecioBase;
      }

      const precioEfectivo = PrecioUnitario * (1 - (PorcentajeDescuento / 100));
      const subtotalLinea = precioEfectivo * Cantidad;
      subtotalVenta += subtotalLinea;

      detallesParaInsertar.push({
        IdProducto,
        Cantidad,
        PrecioUnitario,
        PorcentajeDescuento
      });
    }

    const Total = subtotalVenta - Descuento;

    // Actualizar cabecera
    await transaction.request()
      .input('IdVenta', sql.Int, id)
      .input('Subtotal', sql.Decimal(18, 2), subtotalVenta)
      .input('Descuento', sql.Decimal(18, 2), Descuento)
      .input('Total', sql.Decimal(18, 2), Total)
      .query(`
        UPDATE Ventas
        SET Subtotal = @Subtotal,
            Descuento = @Descuento,
            Total = @Total
        WHERE IdVenta = @IdVenta
      `);

    // Eliminar los detalles actuales
    await transaction.request()
      .input('IdVenta', sql.Int, id)
      .query('DELETE FROM DetallesVenta WHERE IdVenta = @IdVenta');

    // Insertar los nuevos detalles
    for (const detalle of detallesParaInsertar) {
      await transaction.request()
        .input('IdVenta', sql.Int, id)
        .input('IdProducto', sql.Int, detalle.IdProducto)
        .input('Cantidad', sql.Decimal(18, 2), detalle.Cantidad)
        .input('PrecioUnitario', sql.Decimal(18, 2), detalle.PrecioUnitario)
        .input('PorcentajeDescuento', sql.Decimal(5, 2), detalle.PorcentajeDescuento)
        .query(`
          INSERT INTO DetallesVenta (IdVenta, IdProducto, Cantidad, PrecioUnitario, PorcentajeDescuento)
          VALUES (@IdVenta, @IdProducto, @Cantidad, @PrecioUnitario, @PorcentajeDescuento)
        `);
    }

    await transaction.commit();
    return res.json({ message: 'Venta actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar venta:', error);
    if (transaction) {
      try { await transaction.rollback(); } catch (e) { console.error('Rollback error:', e); }
    }
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * CANCELAR UNA VENTA (actualiza estado a "Cancelado")
 */
const cancelVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();
    const result = await pool.request()
      .input('IdVenta', sql.Int, id)
      .query("UPDATE Ventas SET Estado = 'Cancelado' WHERE IdVenta = @IdVenta");
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }
    return res.json({ message: 'Venta cancelada exitosamente' });
  } catch (error) {
    console.error('Error al cancelar venta:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  crearVenta,
  getVentas,
  getVentaById,
  updateVenta,
  cancelVenta
};

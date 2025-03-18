// routes/ventas.routes.js
const { Router } = require('express');
const { verifyToken } = require('../middlewares/auth.middleware');
const {
  crearVenta,
  getVentas,
  getVentaById,
  updateVenta,
  cancelVenta
} = require('../controllers/ventas.controller');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Ventas
 *   description: Endpoints del módulo de ventas
 */

/**
 * @swagger
 * /api/ventas:
 *   get:
 *     summary: Listar todas las ventas
 *     tags: [Ventas]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Devuelve un array de ventas
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', verifyToken, getVentas);

/**
 * @swagger
 * /api/ventas/{id}:
 *   get:
 *     summary: Obtener detalle de una venta
 *     tags: [Ventas]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: number
 *         required: true
 *         description: ID de la venta
 *     responses:
 *       200:
 *         description: Devuelve un objeto con la venta y sus detalles
 *       404:
 *         description: Venta no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', verifyToken, getVentaById);

/**
 * @swagger
 * /api/ventas:
 *   post:
 *     summary: Crear una nueva venta
 *     tags: [Ventas]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               IdCliente:
 *                 type: number
 *               CreadoPor:
 *                 type: number
 *               Descuento:
 *                 type: number
 *               Detalles:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     IdProducto:
 *                       type: number
 *                     Cantidad:
 *                       type: number
 *                     PorcentajeDescuento:
 *                       type: number
 *     responses:
 *       200:
 *         description: Venta creada exitosamente
 *       400:
 *         description: Error en los datos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', verifyToken, crearVenta);

/**
 * @swagger
 * /api/ventas/{id}:
 *   put:
 *     summary: Actualizar una venta (si está Pendiente)
 *     tags: [Ventas]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: number
 *         required: true
 *         description: ID de la venta a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Descuento:
 *                 type: number
 *               Detalles:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     IdProducto:
 *                       type: number
 *                     Cantidad:
 *                       type: number
 *                     PorcentajeDescuento:
 *                       type: number
 *     responses:
 *       200:
 *         description: Venta actualizada exitosamente
 *       400:
 *         description: Error en los datos o venta no actualizable
 *       404:
 *         description: Venta no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put('/:id', verifyToken, updateVenta);

/**
 * @swagger
 * /api/ventas/{id}:
 *   delete:
 *     summary: Cancelar una venta (actualiza estado a Cancelado)
 *     tags: [Ventas]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: number
 *         required: true
 *         description: ID de la venta a cancelar
 *     responses:
 *       200:
 *         description: Venta cancelada exitosamente
 *       404:
 *         description: Venta no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/:id', verifyToken, cancelVenta);

module.exports = router;

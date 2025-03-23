// routes/productos.routes.js
const { Router } = require('express');
const { verifyToken } = require('../middlewares/auth.middleware');
const { getProductos } = require('../controllers/productos.controller');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Productos
 *   description: Endpoints para gestión de productos
 */

/**
 * @swagger
 * /api/productos:
 *   get:
 *     summary: Obtiene la lista de productos
 *     tags: [Productos]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Devuelve un array de productos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   IdProducto:
 *                     type: number
 *                     example: 1
 *                   NombreProducto:
 *                     type: string
 *                     example: "Cemento Portland"
 *                   PrecioBase:
 *                     type: number
 *                     example: 85.5
 *       401:
 *         description: No se proporcionó token o es inválido
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', verifyToken, getProductos);

module.exports = router;

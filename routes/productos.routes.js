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
 *     summary: Obtiene la lista de productos con su stock
 *     tags: [Productos]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Devuelve un array de productos con stock
 *       401:
 *         description: No se proporcionó token o es inválido
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', verifyToken, getProductos);

module.exports = router;
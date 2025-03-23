// routes/clientes.routes.js
const { Router } = require('express');
const { verifyToken } = require('../middlewares/auth.middleware');
const { getClientes } = require('../controllers/clientes.controller');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Clientes
 *   description: Endpoints para gestión de clientes
 */

/**
 * @swagger
 * /api/clientes:
 *   get:
 *     summary: Obtiene la lista de clientes
 *     tags: [Clientes]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Devuelve un array de clientes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   IdCliente:
 *                     type: number
 *                     example: 1
 *                   NombreCliente:
 *                     type: string
 *                     example: "Constructora Edificar"
 *                   IdTipoCliente:
 *                     type: number
 *                     example: 2
 *                   TipoCliente:
 *                     type: string
 *                     example: "Ferreteria"
 *       401:
 *         description: No se proporcionó token o es inválido
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', verifyToken, getClientes);

module.exports = router;

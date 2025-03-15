// routes/user.routes.js
const { Router } = require('express');
const { createUser } = require('../controllers/user.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

const router = Router();

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Crea un nuevo usuario (solo para administradores autenticados)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombreUsuario:
 *                 type: string
 *                 example: adminNuevo
 *               password:
 *                 type: string
 *                 example: admin123
 *               idRol:
 *                 type: number
 *                 example: 1
 *     responses:
 *       200:
 *         description: Usuario creado exitosamente
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', verifyToken, createUser);

module.exports = router;

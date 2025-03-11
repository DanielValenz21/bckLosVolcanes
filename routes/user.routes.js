// routes/user.routes.js
const { Router } = require('express');
const { createUser } = require('../controllers/user.controller');
// Si deseas proteger la creación, puedes usar un middleware verifyToken
// const { verifyToken } = require('../middlewares/auth.middleware');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Endpoints para gestionar usuarios
 */

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Crea un nuevo usuario
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombreUsuario:
 *                 type: string
 *                 example: admin
 *               password:
 *                 type: string
 *                 example: admin123
 *               idRol:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Faltan campos requeridos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', createUser);

module.exports = router;

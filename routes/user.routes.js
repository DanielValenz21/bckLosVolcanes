// routes/user.routes.js
const { Router } = require('express');
const { createUser } = require('../controllers/user.controller');
// const { verifyToken } = require('../middlewares/auth.middleware'); // si quisieras protegerlo

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Endpoints para manejo de usuarios
 */

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Crea un nuevo usuario (público, sin token)
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
 *                 example: "nuevoUsuario"
 *               password:
 *                 type: string
 *                 example: "123456"
 *               idRol:
 *                 type: number
 *                 example: 2
 *     responses:
 *       200:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Error en los datos o nombre de usuario duplicado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', createUser);

module.exports = router;
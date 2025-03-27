// routes/auth.routes.js
const { Router } = require('express');
const { login } = require('../controllers/auth.controller');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Endpoints de autenticación
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Inicia sesión (Login)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombreUsuario:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Retorna token JWT y datos de usuario
 *       401:
 *         description: Usuario o contraseña inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/login', login);

module.exports = router;
// controllers/auth.controller.js
const { pool } = require('../config/db');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const login = async (req, res) => {
  try {
    const { nombreUsuario, password } = req.body;
    if (!nombreUsuario || !password) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }

    // Buscar usuario por nombreUsuario
    const [rows] = await pool.execute(
      `SELECT IdUsuario, NombreUsuario, HashContrasena, SalContrasena, IdRol
       FROM Usuarios
       WHERE NombreUsuario = ?`,
      [nombreUsuario]
    );
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Usuario o contraseña inválidos' });
    }

    const user = rows[0];
    const storedSalt = user.SalContrasena;  // Buffer
    const storedHash = user.HashContrasena; // Buffer

    // Generar hash local para comparar
    const hashToCheck = crypto.createHash('sha256')
                              .update(storedSalt)
                              .update(password)
                              .digest();

    if (!hashToCheck.equals(storedHash)) {
      return res.status(401).json({ message: 'Usuario o contraseña inválidos' });
    }

    // Generar el JWT
    const token = jwt.sign(
      { userId: user.IdUsuario, role: user.IdRol },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.json({
      token,
      user: {
        id: user.IdUsuario,
        nombreUsuario: user.NombreUsuario,
        role: user.IdRol
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { login };
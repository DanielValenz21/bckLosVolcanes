// controllers/auth.controller.js
const { getConnection, sql } = require('../config/db');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Lee JWT_SECRET desde .env

/**
 * LOGIN:
 *  - nombreUsuario
 *  - password
 * Retorna token JWT si coincide HashContrasena + SalContrasena
 */
const login = async (req, res) => {
  try {
    const { nombreUsuario, password } = req.body;
    if (!nombreUsuario || !password) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }

    // 1) Buscar en BD
    const pool = await getConnection();
    const result = await pool.request()
      .input('nombreUsuario', sql.VarChar, nombreUsuario)
      .query(`
        SELECT IdUsuario, NombreUsuario, HashContrasena, SalContrasena, IdRol
        FROM Usuarios
        WHERE NombreUsuario = @nombreUsuario
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'Usuario o contraseña inválidos' });
    }

    const user = result.recordset[0];

    // 2) Re-hashear la password con la sal recuperada
    const storedSalt = user.SalContrasena;     // Buffer (varbinary)
    const storedHash = user.HashContrasena;    // Buffer (varbinary)
    const hashToCheck = crypto.createHash('sha256')
                              .update(storedSalt)
                              .update(password)
                              .digest(); // Buffer

    if (!hashToCheck.equals(storedHash)) {
      return res.status(401).json({ message: 'Usuario o contraseña inválidos' });
    }

    // 3) Generar JWT
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

module.exports = {
  login
};

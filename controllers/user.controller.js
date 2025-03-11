// controllers/user.controller.js
const { getConnection, sql } = require('../config/db');
const crypto = require('crypto');

/**
 * CREA USUARIO:
 *  - nombreUsuario
 *  - password
 *  - idRol (opcional, default 2 => Vendedor, por ejemplo)
 */
const createUser = async (req, res) => {
  try {
    const { nombreUsuario, password, idRol = 2 } = req.body;

    if (!nombreUsuario || !password) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }

    // 1) Generar sal aleatoria
    const salt = crypto.randomBytes(16); // Buffer

    // 2) Hashear con SHA-256
    const hash = crypto.createHash('sha256')
                       .update(salt)
                       .update(password)
                       .digest(); // Buffer

    // 3) Insertar en la BD
    const pool = await getConnection();
    await pool.request()
      .input('nombreUsuario', sql.VarChar, nombreUsuario)
      .input('hash', sql.VarBinary, hash)
      .input('salt', sql.VarBinary, salt)
      .input('idRol', sql.Int, idRol)
      .query(`
        INSERT INTO Usuarios (NombreUsuario, HashContrasena, SalContrasena, IdRol)
        VALUES (@nombreUsuario, @hash, @salt, @idRol)
      `);

    return res.json({ message: 'Usuario creado exitosamente' });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  createUser
};

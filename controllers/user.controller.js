// controllers/user.controller.js
const { pool } = require('../config/db');
const crypto = require('crypto');

/**
 * createUser:
 *  - nombreUsuario
 *  - password
 *  - idRol (opcional, default 2 => "Vendedor")
 */
const createUser = async (req, res) => {
  try {
    const { nombreUsuario, password, idRol = 2 } = req.body;
    if (!nombreUsuario || !password) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }

    // Generar sal aleatoria
    const salt = crypto.randomBytes(16);
    // Hashear con SHA-256
    const hash = crypto.createHash('sha256')
                       .update(salt)
                       .update(password)
                       .digest();

    // Verificar si ya existe el mismo nombre de usuario
    const [rows] = await pool.execute(
      'SELECT IdUsuario FROM Usuarios WHERE NombreUsuario = ?',
      [nombreUsuario]
    );
    if (rows.length > 0) {
      return res.status(400).json({ message: 'El nombre de usuario ya existe' });
    }

    // Insertar en la tabla Usuarios
    await pool.execute(
      `INSERT INTO Usuarios (NombreUsuario, HashContrasena, SalContrasena, IdRol)
       VALUES (?, ?, ?, ?)`,
      [nombreUsuario, hash, salt, idRol]
    );

    return res.json({ message: 'Usuario creado exitosamente' });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  createUser
};
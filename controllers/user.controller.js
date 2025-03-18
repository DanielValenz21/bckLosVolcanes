// controllers/user.controller.js
const { getConnection, sql } = require('../config/db');
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

    const pool = await getConnection();
    // Verificar si ya existe el mismo nombre de usuario
    let result = await pool.request()
      .input('NombreUsuario', sql.VarChar, nombreUsuario)
      .query('SELECT IdUsuario FROM Usuarios WHERE NombreUsuario = @NombreUsuario');
    if (result.recordset.length > 0) {
      return res.status(400).json({ message: 'El nombre de usuario ya existe' });
    }

    // Insertar en la tabla Usuarios
    await pool.request()
      .input('NombreUsuario', sql.VarChar, nombreUsuario)
      .input('HashContrasena', sql.VarBinary, hash)
      .input('SalContrasena', sql.VarBinary, salt)
      .input('IdRol', sql.Int, idRol)
      .query(`
        INSERT INTO Usuarios (NombreUsuario, HashContrasena, SalContrasena, IdRol)
        VALUES (@NombreUsuario, @HashContrasena, @SalContrasena, @IdRol)
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

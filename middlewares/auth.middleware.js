// middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Para leer JWT_SECRET

/**
 * verifyToken
 * Valida que venga un header "Authorization: Bearer <token>"
 * y comprueba que sea un JWT correcto.
 */
const verifyToken = (req, res, next) => {
  // 1. Obtener token de la cabecera Authorization
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'No se proporcionó Authorization header' });
  }

  // El header viene como "Bearer xxxxxxx"
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token ausente o mal formateado' });
  }

  try {
    // 2. Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // 3. Guardar datos del usuario en req para usos posteriores
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

module.exports = { verifyToken };

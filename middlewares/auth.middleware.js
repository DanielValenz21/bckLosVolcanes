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
    return res.status(401).json({ message: 'No se proporcionó token de autorización' });
  }

  // El header viene como "Bearer xxxxxxx"
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token ausente o mal formateado' });
  }

  // Verificar el token de forma asíncrona
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token inválido o expirado' });
    }
    // Guardamos la información del token en req.user para usarla en los endpoints
    req.user = decoded;
    next();
  });
};

module.exports = { verifyToken };

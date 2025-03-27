// middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'No se proporcionó token de autorización' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token ausente o mal formateado' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token inválido o expirado' });
    }
    req.user = decoded;
    next();
  });
};

module.exports = { verifyToken };
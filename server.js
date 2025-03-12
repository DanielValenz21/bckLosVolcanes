// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');

const app = express();
app.use(express.json());
app.use(cors()); // Habilitar CORS para permitir peticiones desde el frontend (puerto 3000)

// === Configuración de Swagger ===
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LosVolcanes API',
      version: '1.0.0',
      description: 'API de Inventario/Ventas'
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Servidor Local'
      }
    ]
  },
  // Aquí define dónde buscar las anotaciones
  apis: ['./routes/*.js', './controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// === Rutas de la aplicación ===
app.use('/api/auth', authRoutes);   // POST /api/auth/login
app.use('/api/users', userRoutes);  // POST /api/users

// Levantar servidor
const PORT = 3001; // Asegúrate de que sea 3001
app.listen(PORT, () => {
  console.log('Servidor corriendo en puerto ' + PORT);
});

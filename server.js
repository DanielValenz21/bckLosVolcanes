// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Rutas
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const ventasRoutes = require('./routes/ventas.routes'); // <-- Aquí

const app = express();
app.use(express.json());
app.use(cors());

// Configuración Swagger
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
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./routes/*.js', './controllers/*.js']
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ventas', ventasRoutes); // <-- Montar aquí

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('Servidor corriendo en puerto ' + PORT);
});

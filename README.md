# Aplicación Web Full Stack de Usuarios — React + Node.js + Express + MongoDB + JWT

Aplicación web Full Stack para la gestión de usuarios y autenticación segura mediante JSON Web Tokens (JWT), desarrollada como parte de la **Guía de Práctica 4** de Desarrollo Web (UNEMI).

## Tecnologías utilizadas

### Back-End
- **Node.js**: entorno de ejecución de JavaScript.
- **Express 5**: framework para la API REST.
- **MongoDB + Mongoose**: base de datos NoSQL y modelado de documentos para la colección `usuarios` (con respaldo automático integrado mediante `mongodb-memory-server` si no hay un servicio local de MongoDB activo en `127.0.0.1:27017`).
- **jsonwebtoken (JWT)**: generación y verificación de tokens de autenticación.
- **bcryptjs**: cifrado seguro de contraseñas con salt.
- **dotenv** y **cors**: variables de entorno y comunicación entre Front-End y Back-End.

### Front-End
- **React 19 + Vite**: interfaz web interactiva conectada a la API REST.

## Funcionalidades implementadas

- **Registro e Inicio de Sesión**: creación de usuarios en MongoDB con validación de campos, email único (`409 Conflict` si se repite) y contraseñas cifradas con `bcryptjs` (nunca se exponen en respuestas JSON).
- **Autenticación con JWT**: generación de token JWT al registrarse o iniciar sesión (`POST /api/auth/login`), con expiración configurable.
- **Middleware de Validación y Rutas Protegidas**: validación del encabezado `Authorization: Bearer <token>` en rutas protegidas (`GET /api/auth/perfil`, `GET /usuarios`, `GET /usuarios/:id`, `PUT /usuarios/:id`, `DELETE /usuarios/:id`), devolviendo `401 Unauthorized` cuando falta el token o es inválido.
- **CRUD Transaccional de Usuarios**: creación, consulta, búsqueda, actualización parcial y eliminación de usuarios en MongoDB desde la interfaz React.
- **Panel de Verificación de Seguridad JWT en React**: permite probar en tiempo real el acceso autorizado (`200 OK`) con token válido y el rechazo de accesos no autorizados (`401 Unauthorized`) sin token o con token inválido.

## Endpoints de la API

### Rutas Públicas
| Método | Ruta | Descripción | Respuesta exitosa |
|--------|------|-------------|-------------------|
| GET | `/` | Información general de la API | `200 OK` |
| POST | `/api/auth/register` (o `/usuarios`) | Registrar usuario y emitir JWT | `201 Created` |
| POST | `/api/auth/login` (o `/usuarios/login`) | Iniciar sesión y generar JWT | `200 OK` |

### Rutas Protegidas (requieren `Authorization: Bearer <token>`)
| Método | Ruta | Descripción | Respuesta exitosa |
|--------|------|-------------|-------------------|
| GET | `/api/auth/perfil` (o `/usuarios/perfil`) | Consultar perfil del usuario autenticado | `200 OK` |
| GET | `/usuarios` | Listar todos los usuarios en MongoDB | `200 OK` |
| GET | `/usuarios/:id` | Consultar un usuario por ObjectId | `200 OK` |
| PUT | `/usuarios/:id` | Actualizar parcialmente un usuario | `200 OK` |
| DELETE | `/usuarios/:id` | Eliminar un usuario | `200 OK` |

**Códigos de error:** `400` datos o ID inválido · `401` token ausente/inválido o credenciales incorrectas · `404` usuario o ruta no encontrada · `409` email duplicado · `500` error interno.

## Estructura del proyecto

```
├── frontend/                      # Aplicación React + Vite
│   ├── src/
│   │   ├── services/api.js        # Consumo de API REST y manejo de JWT
│   │   ├── App.jsx                # Registro, login, pruebas 401/200 y CRUD protegido
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── postman/
│   └── API_Usuarios.postman_collection.json
├── scripts/
│   └── initDb.js                  # Inicializa colección en MongoDB y datos de ejemplo
├── src/
│   ├── config/db.js               # Conexión a MongoDB + siembra inicial
│   ├── controllers/
│   │   ├── auth.controller.js     # Registro, login con JWT y perfil protegido
│   │   └── usuarios.controller.js # CRUD de usuarios en MongoDB
│   ├── middlewares/
│   │   ├── auth.js                # Generación y verificación de JWT (verificarToken)
│   │   ├── errorHandler.js        # 404 y manejo central de errores
│   │   └── validarUsuario.js      # Validación de ObjectId, login y datos de usuario
│   ├── models/
│   │   └── Usuario.js             # Esquema y modelo Mongoose
│   ├── routes/
│   │   ├── auth.routes.js
│   │   └── usuarios.routes.js
│   ├── app.js                     # Configuración de Express y CORS
│   └── server.js                  # Arranque de MongoDB y servidor HTTP
├── .env.example
└── package.json
```

## Instalación y ejecución

### 1. Configurar variables de entorno
Copia `.env.example` como `.env` (ya viene configurado por defecto para puerto `3000`, MongoDB local y JWT):
```bash
cp .env.example .env
```

### 2. Instalar dependencias e iniciar el Back-End
```bash
npm install
npm run db:init
npm run dev
```
El Back-End quedará disponible en `http://localhost:3000`.
> **Nota sobre MongoDB:** Si tienes MongoDB instalado localmente (`mongodb://127.0.0.1:27017/api_usuarios`) o configuras una URI de MongoDB Atlas en `.env`, la aplicación se conectará directamente a esa instancia. Si no hay un servicio MongoDB corriendo en el puerto `27017`, el proyecto inicia automáticamente una instancia local integrada (`mongodb-memory-server`) con 2 usuarios de prueba precargados (`ana.torres@correo.com` y `luis.perez@correo.com`, contraseña `123456`).

### 3. Instalar dependencias e iniciar el Front-End (React)
En una segunda terminal:
```bash
npm run frontend:install
npm run frontend:dev
```
El Front-End quedará disponible en `http://localhost:5173`.

## Pruebas con Postman

Importa `postman/API_Usuarios.postman_collection.json` en Postman (**Import → File**). Al ejecutar **Registrar usuario** o **Iniciar sesión**, el token JWT y el `usuarioId` se guardan automáticamente en las variables de colección para probar las rutas protegidas y los casos de error (`401`, `400`, `404`, `409`).

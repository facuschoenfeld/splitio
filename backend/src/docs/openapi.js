// Especificación OpenAPI 3.0 de la API de Split Expenses (Splitio).
// Se sirve con swagger-ui-express en /api/docs y como JSON en /api/docs.json
// (ver index.js). Mantener sincronizada con las rutas/validators al agregar
// o cambiar endpoints.

const bearerAuth = [{ bearerAuth: [] }]

// Respuestas de error reutilizables.
const errorResponse = {
  description: 'Error',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/Error' },
    },
  },
}

const validationErrorResponse = {
  description: 'Datos inválidos (falló express-validator)',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ValidationError' },
    },
  },
}

const unauthorizedResponse = {
  description: 'Token ausente, inválido o expirado',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/Error' },
    },
  },
}

const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'Split Expenses API',
    version: '1.0.0',
    description:
      'API REST de Splitio para el seguimiento de gastos compartidos entre grupos. ' +
      'La autenticación es por JWT: enviá el access token en el header ' +
      '`Authorization: Bearer <token>`. El access token dura 15 minutos y se ' +
      'renueva con `POST /api/auth/refresh` usando el refresh token (dura 7 días).',
  },
  servers: [
    { url: '/api', description: 'Servidor actual (relativo)' },
    { url: 'http://localhost:3001/api', description: 'Desarrollo local' },
  ],
  tags: [
    { name: 'Auth', description: 'Registro, login y recuperación de contraseña' },
    { name: 'Users', description: 'Perfil de usuario y avatares' },
    { name: 'Groups', description: 'Grupos, miembros, balances e invitaciones' },
    { name: 'Expenses', description: 'Gastos y liquidación de deudas' },
    { name: 'Invitations', description: 'Preview y aceptación de invitaciones' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: { message: { type: 'string', example: 'Recurso no encontrado' } },
          },
        },
      },
      ValidationError: {
        type: 'object',
        properties: {
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', example: 'field' },
                msg: { type: 'string', example: 'Email inválido' },
                path: { type: 'string', example: 'email' },
                location: { type: 'string', example: 'body' },
              },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Juan Pérez' },
          email: { type: 'string', format: 'email', example: 'juan@example.com' },
          avatar: { type: 'string', nullable: true, example: '/uploads/avatars/abc.png' },
          payment_alias: { type: 'string', nullable: true, example: 'juan.mp' },
          cbu: { type: 'string', nullable: true, example: '0000003100010000000001' },
          notify_group_invites: { type: 'boolean', example: true },
          notify_group_summaries: { type: 'boolean', example: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Tokens: {
        type: 'object',
        properties: {
          accessToken: { type: 'string', description: 'JWT de acceso (15 min)' },
          refreshToken: { type: 'string', description: 'JWT de refresh (7 días)' },
        },
      },
      AuthResponse: {
        allOf: [
          { $ref: '#/components/schemas/Tokens' },
          {
            type: 'object',
            properties: { user: { $ref: '#/components/schemas/User' } },
          },
        ],
      },
      GroupMember: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          avatar: { type: 'string', nullable: true },
          nickname: { type: 'string', nullable: true, description: 'Apodo por grupo' },
          payment_alias: { type: 'string', nullable: true, description: 'Override por grupo' },
          cbu: { type: 'string', nullable: true, description: 'Override por grupo' },
          joined_at: { type: 'string', format: 'date-time' },
        },
      },
      Group: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Viaje a Bariloche' },
          description: { type: 'string', nullable: true },
          emoji: { type: 'string', nullable: true, example: '🏔️' },
          created_by: { type: 'string', format: 'uuid', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Expense: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          group_id: { type: 'string', format: 'uuid' },
          description: { type: 'string', example: 'Supermercado' },
          amount: { type: 'string', example: '12500.00', description: 'Decimal(12,2) serializado como string' },
          paid_by: { type: 'string', format: 'uuid' },
          category: {
            type: 'string',
            enum: ['vivienda', 'servicios', 'comida', 'transporte', 'entretenimiento', 'alojamiento', 'otros', 'settlement'],
          },
          date: { type: 'string', format: 'date' },
          created_at: { type: 'string', format: 'date-time' },
          splitBetween: {
            type: 'array',
            items: { type: 'string', format: 'uuid' },
            description: 'IDs de los miembros entre los que se divide',
          },
        },
      },
      Balance: {
        type: 'object',
        properties: {
          userId: { type: 'string', format: 'uuid' },
          balance: { type: 'number', description: 'Positivo = le deben; negativo = debe' },
        },
      },
      Invitation: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          group_id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email', nullable: true, description: 'null = código compartible reutilizable' },
          token: { type: 'string' },
          invited_by: { type: 'string', format: 'uuid', nullable: true },
          expires_at: { type: 'string', format: 'date-time', nullable: true },
          accepted_at: { type: 'string', format: 'date-time', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
    },
    responses: {
      Unauthorized: unauthorizedResponse,
      ValidationError: validationErrorResponse,
      Error: errorResponse,
    },
    parameters: {
      GroupId: {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: 'ID del grupo',
      },
    },
  },
  paths: {
    // ---------- Auth ----------
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registrar un usuario nuevo',
        description: 'Rate limit: 10 req / 15 min por IP.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Juan Pérez' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6, format: 'password' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Usuario invitado que completó su registro', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          201: { description: 'Usuario creado', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          400: validationErrorResponse,
          409: { description: 'El email ya está registrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Iniciar sesión',
        description: 'Rate limit: 10 req / 15 min por IP.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', format: 'password' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login exitoso', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          400: validationErrorResponse,
          401: { description: 'Credenciales inválidas', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Renovar el access token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: { refreshToken: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Nuevos tokens', content: { 'application/json': { schema: { $ref: '#/components/schemas/Tokens' } } } },
          400: errorResponse,
          401: { description: 'Refresh token inválido o expirado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Solicitar email de recuperación de contraseña',
        description: 'Siempre responde 200 con un mensaje genérico para no filtrar qué emails existen. Rate limit: 10 req / 15 min.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: { email: { type: 'string', format: 'email' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Mensaje genérico', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
          400: validationErrorResponse,
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Restablecer la contraseña con un token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password'],
                properties: {
                  token: { type: 'string' },
                  password: { type: 'string', minLength: 6, format: 'password' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Contraseña actualizada', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
          400: { description: 'Token inválido/expirado o datos inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    // ---------- Users ----------
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'Listar usuarios que comparten grupo con el usuario actual',
        security: bearerAuth,
        responses: {
          200: { description: 'Lista de usuarios', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } } },
          401: unauthorizedResponse,
        },
      },
    },
    '/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Obtener el perfil del usuario actual',
        security: bearerAuth,
        responses: {
          200: { description: 'Perfil', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          401: unauthorizedResponse,
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Actualizar el perfil del usuario actual',
        security: bearerAuth,
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  payment_alias: { type: 'string' },
                  cbu: { type: 'string' },
                  notify_group_invites: { type: 'boolean' },
                  notify_group_summaries: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Perfil actualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          401: unauthorizedResponse,
        },
      },
    },
    '/users/me/avatar': {
      post: {
        tags: ['Users'],
        summary: 'Subir el avatar del usuario actual',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: { avatar: { type: 'string', format: 'binary' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Perfil con el nuevo avatar', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          401: unauthorizedResponse,
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Eliminar el avatar del usuario actual',
        security: bearerAuth,
        responses: {
          200: { description: 'Perfil sin avatar', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          401: unauthorizedResponse,
        },
      },
    },
    '/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Obtener un usuario por ID',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Usuario', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          401: unauthorizedResponse,
          404: errorResponse,
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Actualizar un usuario por ID',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  payment_alias: { type: 'string' },
                  cbu: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Usuario actualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          401: unauthorizedResponse,
          404: errorResponse,
        },
      },
    },

    // ---------- Groups ----------
    '/groups': {
      get: {
        tags: ['Groups'],
        summary: 'Listar los grupos del usuario actual',
        security: bearerAuth,
        responses: {
          200: { description: 'Grupos', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Group' } } } } },
          401: unauthorizedResponse,
        },
      },
      post: {
        tags: ['Groups'],
        summary: 'Crear un grupo',
        description: 'El creador queda como admin. Máximo 10 miembros por grupo (incluido el creador).',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'memberIds'],
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  emoji: { type: 'string' },
                  memberIds: { type: 'array', items: { type: 'string', format: 'uuid' }, description: 'IDs de usuarios existentes a agregar' },
                  newMembers: {
                    type: 'array',
                    maxItems: 10,
                    items: {
                      type: 'object',
                      required: ['name'],
                      properties: {
                        name: { type: 'string', maxLength: 100 },
                        email: { type: 'string', format: 'email' },
                      },
                    },
                    description: 'Miembros nuevos (sin cuenta) a crear en el grupo',
                  },
                  inviteEmails: {
                    type: 'array',
                    maxItems: 10,
                    items: { type: 'string', format: 'email' },
                    description: 'Emails a invitar por link',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Grupo creado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Group' } } } },
          400: validationErrorResponse,
          401: unauthorizedResponse,
        },
      },
    },
    '/groups/{id}': {
      get: {
        tags: ['Groups'],
        summary: 'Obtener un grupo por ID',
        security: bearerAuth,
        parameters: [{ $ref: '#/components/parameters/GroupId' }],
        responses: {
          200: { description: 'Grupo', content: { 'application/json': { schema: { $ref: '#/components/schemas/Group' } } } },
          401: unauthorizedResponse,
          403: { description: 'No sos miembro del grupo', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: errorResponse,
        },
      },
      put: {
        tags: ['Groups'],
        summary: 'Actualizar un grupo (admin)',
        security: bearerAuth,
        parameters: [{ $ref: '#/components/parameters/GroupId' }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  emoji: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Grupo actualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Group' } } } },
          401: unauthorizedResponse,
          403: errorResponse,
          404: errorResponse,
        },
      },
      delete: {
        tags: ['Groups'],
        summary: 'Eliminar un grupo (admin)',
        security: bearerAuth,
        parameters: [{ $ref: '#/components/parameters/GroupId' }],
        responses: {
          204: { description: 'Grupo eliminado' },
          401: unauthorizedResponse,
          403: errorResponse,
          404: errorResponse,
        },
      },
    },
    '/groups/{id}/members': {
      get: {
        tags: ['Groups'],
        summary: 'Listar los miembros de un grupo',
        security: bearerAuth,
        parameters: [{ $ref: '#/components/parameters/GroupId' }],
        responses: {
          200: { description: 'Miembros', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/GroupMember' } } } } },
          401: unauthorizedResponse,
          403: errorResponse,
        },
      },
      post: {
        tags: ['Groups'],
        summary: 'Agregar un miembro a un grupo',
        description: 'Enforcea el cap de 10 miembros.',
        security: bearerAuth,
        parameters: [{ $ref: '#/components/parameters/GroupId' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  userId: { type: 'string', format: 'uuid', description: 'Usuario existente' },
                  name: { type: 'string', description: 'Alternativa: crear un miembro nuevo' },
                  email: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Miembro agregado', content: { 'application/json': { schema: { $ref: '#/components/schemas/GroupMember' } } } },
          400: errorResponse,
          401: unauthorizedResponse,
          403: errorResponse,
        },
      },
    },
    '/groups/{id}/members/{userId}': {
      put: {
        tags: ['Groups'],
        summary: 'Actualizar los datos de un miembro dentro del grupo',
        description: 'Overrides por grupo: nickname, payment_alias, cbu.',
        security: bearerAuth,
        parameters: [
          { $ref: '#/components/parameters/GroupId' },
          { name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nickname: { type: 'string' },
                  payment_alias: { type: 'string' },
                  cbu: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Miembro actualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/GroupMember' } } } },
          401: unauthorizedResponse,
          403: errorResponse,
        },
      },
      delete: {
        tags: ['Groups'],
        summary: 'Quitar un miembro del grupo',
        security: bearerAuth,
        parameters: [
          { $ref: '#/components/parameters/GroupId' },
          { name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          204: { description: 'Miembro eliminado' },
          401: unauthorizedResponse,
          403: errorResponse,
        },
      },
    },
    '/groups/{id}/balances': {
      get: {
        tags: ['Groups'],
        summary: 'Obtener los balances del grupo',
        security: bearerAuth,
        parameters: [{ $ref: '#/components/parameters/GroupId' }],
        responses: {
          200: { description: 'Balances por miembro', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Balance' } } } } },
          401: unauthorizedResponse,
          403: errorResponse,
        },
      },
    },
    '/groups/{id}/summary': {
      post: {
        tags: ['Groups'],
        summary: 'Enviar por email un resumen (PDF/HTML) del grupo',
        security: bearerAuth,
        parameters: [{ $ref: '#/components/parameters/GroupId' }],
        responses: {
          200: { description: 'Resumen enviado', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
          401: unauthorizedResponse,
          403: errorResponse,
        },
      },
    },
    '/groups/{id}/summary/pdf': {
      get: {
        tags: ['Groups'],
        summary: 'Descargar el resumen del grupo en PDF',
        security: bearerAuth,
        parameters: [{ $ref: '#/components/parameters/GroupId' }],
        responses: {
          200: { description: 'Archivo PDF', content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } } },
          401: unauthorizedResponse,
          403: errorResponse,
        },
      },
    },
    '/groups/{id}/invitations': {
      get: {
        tags: ['Groups'],
        summary: 'Listar las invitaciones pendientes del grupo',
        security: bearerAuth,
        parameters: [{ $ref: '#/components/parameters/GroupId' }],
        responses: {
          200: { description: 'Invitaciones', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Invitation' } } } } },
          401: unauthorizedResponse,
          403: errorResponse,
        },
      },
      post: {
        tags: ['Groups'],
        summary: 'Invitar a alguien por email',
        security: bearerAuth,
        parameters: [{ $ref: '#/components/parameters/GroupId' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: { email: { type: 'string', format: 'email' } },
              },
            },
          },
        },
        responses: {
          201: { description: 'Invitación creada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Invitation' } } } },
          400: validationErrorResponse,
          401: unauthorizedResponse,
          403: errorResponse,
        },
      },
    },
    '/groups/{id}/invitations/{invitationId}': {
      delete: {
        tags: ['Groups'],
        summary: 'Revocar una invitación',
        security: bearerAuth,
        parameters: [
          { $ref: '#/components/parameters/GroupId' },
          { name: 'invitationId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          204: { description: 'Invitación revocada' },
          401: unauthorizedResponse,
          403: errorResponse,
        },
      },
    },
    '/groups/{id}/invite-code': {
      get: {
        tags: ['Groups'],
        summary: 'Obtener el código compartible del grupo',
        security: bearerAuth,
        parameters: [{ $ref: '#/components/parameters/GroupId' }],
        responses: {
          200: { description: 'Código de invitación (o null si no existe)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Invitation' } } } },
          401: unauthorizedResponse,
          403: errorResponse,
        },
      },
      post: {
        tags: ['Groups'],
        summary: 'Generar/regenerar el código compartible (admin)',
        security: bearerAuth,
        parameters: [{ $ref: '#/components/parameters/GroupId' }],
        responses: {
          201: { description: 'Código generado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Invitation' } } } },
          401: unauthorizedResponse,
          403: errorResponse,
        },
      },
      delete: {
        tags: ['Groups'],
        summary: 'Revocar el código compartible (admin)',
        security: bearerAuth,
        parameters: [{ $ref: '#/components/parameters/GroupId' }],
        responses: {
          204: { description: 'Código revocado' },
          401: unauthorizedResponse,
          403: errorResponse,
        },
      },
    },

    // ---------- Expenses ----------
    '/expenses': {
      get: {
        tags: ['Expenses'],
        summary: 'Listar gastos',
        description: 'Filtrable por grupo con el query param `groupId`.',
        security: bearerAuth,
        parameters: [{ name: 'groupId', in: 'query', required: false, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Gastos', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Expense' } } } } },
          401: unauthorizedResponse,
        },
      },
      post: {
        tags: ['Expenses'],
        summary: 'Crear un gasto',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['groupId', 'description', 'amount', 'paidBy', 'splitBetween', 'category', 'date'],
                properties: {
                  groupId: { type: 'string', format: 'uuid' },
                  description: { type: 'string' },
                  amount: { type: 'number', minimum: 0, exclusiveMinimum: true },
                  paidBy: { type: 'string', format: 'uuid' },
                  splitBetween: { type: 'array', minItems: 1, items: { type: 'string', format: 'uuid' } },
                  category: {
                    type: 'string',
                    enum: ['vivienda', 'servicios', 'comida', 'transporte', 'entretenimiento', 'alojamiento', 'otros'],
                  },
                  date: { type: 'string', format: 'date' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Gasto creado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Expense' } } } },
          400: validationErrorResponse,
          401: unauthorizedResponse,
          403: errorResponse,
        },
      },
    },
    '/expenses/settle': {
      post: {
        tags: ['Expenses'],
        summary: 'Registrar una liquidación de deuda',
        description: 'Se almacena como un gasto con `category: "settlement"`.',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['groupId', 'fromUserId', 'toUserId', 'amount'],
                properties: {
                  groupId: { type: 'string', format: 'uuid' },
                  fromUserId: { type: 'string', format: 'uuid', description: 'Deudor' },
                  toUserId: { type: 'string', format: 'uuid', description: 'Acreedor' },
                  amount: { type: 'number', minimum: 0, exclusiveMinimum: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Liquidación registrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Expense' } } } },
          400: validationErrorResponse,
          401: unauthorizedResponse,
          403: errorResponse,
        },
      },
    },
    '/expenses/{id}': {
      get: {
        tags: ['Expenses'],
        summary: 'Obtener un gasto por ID',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Gasto', content: { 'application/json': { schema: { $ref: '#/components/schemas/Expense' } } } },
          401: unauthorizedResponse,
          403: errorResponse,
          404: errorResponse,
        },
      },
      delete: {
        tags: ['Expenses'],
        summary: 'Eliminar un gasto',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          204: { description: 'Gasto eliminado' },
          401: unauthorizedResponse,
          403: errorResponse,
          404: errorResponse,
        },
      },
    },

    // ---------- Invitations ----------
    '/invitations/{token}': {
      get: {
        tags: ['Invitations'],
        summary: 'Preview público de una invitación',
        description: 'No requiere autenticación. Devuelve datos básicos del grupo para mostrar antes de loguearse.',
        parameters: [{ name: 'token', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Preview de la invitación', content: { 'application/json': { schema: { type: 'object', properties: { group: { $ref: '#/components/schemas/Group' }, email: { type: 'string', nullable: true } } } } } },
          404: { description: 'Invitación inexistente o expirada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/invitations/{token}/accept': {
      post: {
        tags: ['Invitations'],
        summary: 'Aceptar una invitación y unirse al grupo',
        description: 'Requiere sesión. Enforcea el cap de 10 miembros.',
        security: bearerAuth,
        parameters: [{ name: 'token', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Unido al grupo', content: { 'application/json': { schema: { $ref: '#/components/schemas/Group' } } } },
          400: { description: 'Invitación inválida o grupo lleno', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: unauthorizedResponse,
          404: errorResponse,
        },
      },
    },
  },
}

module.exports = openapi

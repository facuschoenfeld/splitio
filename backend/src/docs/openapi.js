// Especificación OpenAPI 3.0 de la API de Split Expenses (Splitio).
// Se sirve con swagger-ui-express en /api/docs y como JSON en /api/docs.json
// (ver index.js). Mantener sincronizada con las rutas/validators al agregar
// o cambiar endpoints.

const bearerAuth = [{ bearerAuth: [] }]

// ---------- Helpers de respuestas ----------

const ref = (name) => ({ $ref: `#/components/schemas/${name}` })

function jsonResponse(description, schema) {
  return { description, content: { 'application/json': { schema } } }
}

// Error { error: { message } } con el mensaje real que devuelve cada caso.
function errorResponse(description, message = description) {
  return {
    description,
    content: {
      'application/json': {
        schema: ref('Error'),
        example: { error: { message } },
      },
    },
  }
}

// Error de express-validator ({ errors: [...] }) con un ejemplo del endpoint.
function validationErrorResponse(msg, path) {
  return {
    description: 'Datos inválidos (falló express-validator)',
    content: {
      'application/json': {
        schema: ref('ValidationError'),
        example: { errors: [{ type: 'field', msg, path, location: 'body' }] },
      },
    },
  }
}

const unauthorizedResponse = errorResponse('Token ausente, inválido o expirado', 'Token inválido o expirado')
const forbiddenGroupResponse = errorResponse('No es miembro del grupo', 'No tenés acceso a este grupo')
const adminOnlyResponse = errorResponse(
  'No es el administrador del grupo',
  'Solo el administrador del grupo puede realizar esta acción'
)
const groupNotFoundResponse = errorResponse('Grupo no encontrado')
const forbiddenExpenseResponse = errorResponse('No es miembro del grupo del gasto', 'No tenés acceso a este recurso')
const expenseNotFoundResponse = errorResponse('Gasto no encontrado')
const userNotFoundResponse = errorResponse('Usuario no encontrado')

const messageSchema = (example) => ({
  type: 'object',
  properties: { message: { type: 'string', example } },
})

const groupIdParam = { $ref: '#/components/parameters/GroupId' }
const userIdPathParam = { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'ID del usuario' }
const expenseIdParam = { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'ID del gasto' }
const tokenParam = { name: 'token', in: 'path', required: true, schema: { type: 'string' }, description: 'Token de la invitación o código compartible' }

const CATEGORIES = ['vivienda', 'servicios', 'comida', 'transporte', 'entretenimiento', 'alojamiento', 'otros']

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
            properties: { message: { type: 'string', example: 'Grupo no encontrado' } },
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
          email: {
            type: 'string',
            format: 'email',
            nullable: true,
            example: 'juan@example.com',
            description: 'null para miembros agregados sin email',
          },
          avatar: { type: 'string', nullable: true, example: '/uploads/avatars/abc.png' },
          payment_alias: { type: 'string', nullable: true, example: 'juan.mp' },
          cbu: { type: 'string', nullable: true, example: '0000003100010000000001' },
          notify_group_invites: { type: 'boolean', example: true },
          notify_group_summaries: { type: 'boolean', example: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      // Datos del usuario que devuelven register y login (subconjunto de User).
      AuthUser: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Juan Pérez' },
          email: { type: 'string', format: 'email', example: 'juan@example.com' },
          avatar: { type: 'string', nullable: true, example: null },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Tokens: {
        type: 'object',
        properties: {
          access: { type: 'string', description: 'JWT de acceso (15 min)' },
          refresh: { type: 'string', description: 'JWT de refresh (7 días)' },
        },
      },
      AuthResponse: {
        allOf: [
          ref('Tokens'),
          {
            type: 'object',
            properties: { user: ref('AuthUser') },
          },
        ],
      },
      GroupMember: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Matías' },
          email: { type: 'string', format: 'email', nullable: true, description: 'null para miembros agregados sin email' },
          avatar: { type: 'string', nullable: true },
        },
      },
      // Miembro con los datos propios de ese grupo (solo en GET /groups/{id}).
      GroupMemberWithOverrides: {
        allOf: [
          ref('GroupMember'),
          {
            type: 'object',
            properties: {
              nickname: { type: 'string', nullable: true, description: 'Apodo dentro del grupo' },
              payment_alias: { type: 'string', nullable: true, description: 'Alias de pago para este grupo' },
              cbu: { type: 'string', nullable: true, description: 'CBU para este grupo' },
            },
          },
        ],
      },
      MemberOverrides: {
        type: 'object',
        properties: {
          userId: { type: 'string', format: 'uuid' },
          nickname: { type: 'string', nullable: true },
          payment_alias: { type: 'string', nullable: true },
          cbu: { type: 'string', nullable: true },
        },
      },
      Group: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Viaje a Bariloche' },
          description: { type: 'string', nullable: true },
          emoji: { type: 'string', nullable: true, example: '🏔️' },
          created_by: { type: 'string', format: 'uuid', nullable: true, description: 'Administrador del grupo' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      // Grupo + IDs de sus miembros (POST y PUT /groups).
      GroupWithMemberIds: {
        allOf: [
          ref('Group'),
          {
            type: 'object',
            properties: {
              members: { type: 'array', items: { type: 'string', format: 'uuid' } },
            },
          },
        ],
      },
      // Elemento de GET /groups: IDs de miembros + datos por grupo de cada uno.
      GroupListItem: {
        allOf: [
          ref('GroupWithMemberIds'),
          {
            type: 'object',
            properties: {
              memberOverrides: {
                type: 'object',
                description: 'Por ID de usuario: { nickname, payment_alias, cbu }. Solo incluye a los miembros con algún dato propio.',
                additionalProperties: {
                  type: 'object',
                  properties: {
                    nickname: { type: 'string', nullable: true },
                    payment_alias: { type: 'string', nullable: true },
                    cbu: { type: 'string', nullable: true },
                  },
                },
              },
            },
          },
        ],
      },
      GroupDetail: {
        allOf: [
          ref('Group'),
          {
            type: 'object',
            properties: {
              members: { type: 'array', items: ref('GroupMemberWithOverrides') },
            },
          },
        ],
      },
      Expense: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          groupId: { type: 'string', format: 'uuid' },
          description: { type: 'string', example: 'Supermercado' },
          amount: { type: 'number', example: 12500.5 },
          paidBy: { type: 'string', format: 'uuid', nullable: true, description: 'null si el usuario que pagó fue eliminado' },
          splitBetween: {
            type: 'array',
            items: { type: 'string', format: 'uuid' },
            description: 'IDs de los miembros entre los que se divide',
          },
          category: { type: 'string', enum: [...CATEGORIES, 'settlement'] },
          date: { type: 'string', format: 'date-time', description: 'Fecha del gasto (columna DATE serializada como timestamp ISO)' },
        },
      },
      MemberBalance: {
        allOf: [
          ref('GroupMember'),
          {
            type: 'object',
            properties: {
              balance: { type: 'number', example: -1833.33, description: 'Positivo = le deben; negativo = debe' },
            },
          },
        ],
      },
      Debt: {
        type: 'object',
        properties: {
          from: ref('MemberBalance'),
          to: ref('MemberBalance'),
          amount: { type: 'number', example: 1833.33 },
        },
      },
      GroupBalances: {
        type: 'object',
        properties: {
          balances: {
            type: 'object',
            description: 'Balance neto de cada miembro, indexado por su ID. Siempre suman 0.',
            additionalProperties: ref('MemberBalance'),
          },
          debts: {
            type: 'array',
            description: 'Transferencias mínimas para saldar el grupo',
            items: ref('Debt'),
          },
        },
      },
      PendingInvitation: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          expires_at: { type: 'string', format: 'date-time', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      InviteCode: {
        type: 'object',
        properties: { token: { type: 'string', example: 'xYBnxW9S' } },
      },
      InvitationPreview: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['valid', 'expired', 'accepted', 'full', 'invalid'],
            description: 'Con `invalid` no se envía ningún otro campo',
          },
          type: { type: 'string', enum: ['email', 'shared'], description: 'Invitación personal o código compartible' },
          email: { type: 'string', format: 'email', nullable: true },
          inviterName: { type: 'string', nullable: true, example: 'Facundo' },
          group: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string', example: 'Cumpleaños sábado' },
              emoji: { type: 'string', nullable: true, example: '🎉' },
            },
          },
        },
      },
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
        description:
          'Si el email pertenece a un miembro invitado sin cuenta, completa su registro (200). ' +
          'Rate limit: 10 req / 15 min por IP.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Juan Pérez' },
                  email: { type: 'string', format: 'email', example: 'juan@example.com' },
                  password: { type: 'string', minLength: 6, format: 'password' },
                },
              },
            },
          },
        },
        responses: {
          200: jsonResponse('Usuario invitado que completó su registro', ref('AuthResponse')),
          201: jsonResponse('Usuario creado', ref('AuthResponse')),
          400: validationErrorResponse('La contraseña debe tener al menos 6 caracteres', 'password'),
          409: errorResponse('El email ya está registrado'),
          429: errorResponse('Demasiados intentos', 'Demasiados intentos, probá de nuevo más tarde'),
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
                  email: { type: 'string', format: 'email', example: 'juan@example.com' },
                  password: { type: 'string', format: 'password' },
                },
              },
            },
          },
        },
        responses: {
          200: jsonResponse('Login exitoso', ref('AuthResponse')),
          400: validationErrorResponse('Email inválido', 'email'),
          401: errorResponse('Credenciales inválidas'),
          429: errorResponse('Demasiados intentos', 'Demasiados intentos, probá de nuevo más tarde'),
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Renovar el access token',
        description: 'Devuelve un par de tokens nuevo (access y refresh).',
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
          200: jsonResponse('Nuevos tokens', ref('Tokens')),
          400: errorResponse('Falta el refresh token', 'Refresh token requerido'),
          401: errorResponse('Refresh token inválido o expirado'),
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Solicitar email de recuperación de contraseña',
        description:
          'Siempre responde 200 con un mensaje genérico para no filtrar qué emails existen. ' +
          'El enlace enviado vence en 1 hora. Rate limit: 10 req / 15 min.',
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
          200: jsonResponse(
            'Mensaje genérico',
            messageSchema('Si el email está registrado, te enviamos un enlace para restablecer la contraseña')
          ),
          400: validationErrorResponse('Email inválido', 'email'),
          429: errorResponse('Demasiados intentos', 'Demasiados intentos, probá de nuevo más tarde'),
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Restablecer la contraseña con un token',
        description: 'Rate limit: 10 req / 15 min.',
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
          200: jsonResponse('Contraseña actualizada', messageSchema('Contraseña actualizada, ya podés iniciar sesión')),
          400: {
            description: 'Token inválido o expirado, o datos inválidos',
            content: {
              'application/json': {
                schema: { oneOf: [ref('Error'), ref('ValidationError')] },
                example: { error: { message: 'El enlace es inválido o expiró' } },
              },
            },
          },
          429: errorResponse('Demasiados intentos', 'Demasiados intentos, probá de nuevo más tarde'),
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
          200: jsonResponse('Lista de usuarios', { type: 'array', items: ref('User') }),
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
          200: jsonResponse('Perfil', ref('User')),
          401: unauthorizedResponse,
          404: userNotFoundResponse,
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Actualizar el perfil del usuario actual',
        description: 'Solo se modifican los campos enviados. El email no se puede cambiar.',
        security: bearerAuth,
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
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
          200: jsonResponse('Perfil actualizado', ref('User')),
          401: unauthorizedResponse,
        },
      },
    },
    '/users/me/avatar': {
      post: {
        tags: ['Users'],
        summary: 'Subir el avatar del usuario actual',
        description: 'Imagen PNG, JPG o WEBP de hasta 2 MB. Reemplaza el avatar anterior.',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['avatar'],
                properties: { avatar: { type: 'string', format: 'binary' } },
              },
            },
          },
        },
        responses: {
          200: jsonResponse('Perfil con el nuevo avatar', ref('User')),
          400: errorResponse('Sin imagen, formato no permitido o mayor a 2 MB', 'La imagen no puede superar los 2 MB'),
          401: unauthorizedResponse,
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Eliminar el avatar del usuario actual',
        security: bearerAuth,
        responses: {
          200: jsonResponse('Perfil sin avatar', ref('User')),
          401: unauthorizedResponse,
        },
      },
    },
    '/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Obtener un usuario por ID',
        security: bearerAuth,
        parameters: [userIdPathParam],
        responses: {
          200: jsonResponse('Usuario', ref('User')),
          401: unauthorizedResponse,
          404: userNotFoundResponse,
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Actualizar un usuario por ID',
        description: 'Solo se permite sobre el propio usuario (equivale a `PUT /users/me`).',
        security: bearerAuth,
        parameters: [userIdPathParam],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
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
          200: jsonResponse('Usuario actualizado', ref('User')),
          401: unauthorizedResponse,
          403: errorResponse('No es el propio usuario', 'Solo podés actualizar tu propio perfil'),
          404: userNotFoundResponse,
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
          200: jsonResponse('Grupos', { type: 'array', items: ref('GroupListItem') }),
          401: unauthorizedResponse,
        },
      },
      post: {
        tags: ['Groups'],
        summary: 'Crear un grupo',
        description:
          'El creador queda como administrador y se agrega como miembro automáticamente. ' +
          'Debe incluir al menos un miembro además del creador. Máximo 10 miembros por grupo ' +
          '(incluido el creador) y hasta 10 entre `newMembers` e `inviteEmails`.',
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
                        payment_alias: { type: 'string' },
                      },
                    },
                    description: 'Miembros sin cuenta que se agregan al grupo. Si el email ya tiene cuenta, se agrega ese usuario.',
                  },
                  inviteEmails: {
                    type: 'array',
                    maxItems: 10,
                    items: { type: 'string', format: 'email' },
                    description: 'Emails a los que se envía una invitación personal (se unen al aceptarla)',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: jsonResponse('Grupo creado', ref('GroupWithMemberIds')),
          400: {
            description: 'Datos inválidos o se supera el límite de 10 miembros',
            content: {
              'application/json': {
                schema: { oneOf: [ref('ValidationError'), ref('Error')] },
                example: { error: { message: 'Un grupo puede tener hasta 10 miembros (incluyéndote)' } },
              },
            },
          },
          401: unauthorizedResponse,
        },
      },
    },
    '/groups/{id}': {
      get: {
        tags: ['Groups'],
        summary: 'Obtener un grupo por ID',
        description: 'Incluye los miembros con sus datos propios de este grupo.',
        security: bearerAuth,
        parameters: [groupIdParam],
        responses: {
          200: jsonResponse('Grupo', ref('GroupDetail')),
          401: unauthorizedResponse,
          403: forbiddenGroupResponse,
          404: groupNotFoundResponse,
        },
      },
      put: {
        tags: ['Groups'],
        summary: 'Actualizar un grupo (admin)',
        security: bearerAuth,
        parameters: [groupIdParam],
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
          200: jsonResponse('Grupo actualizado', ref('GroupWithMemberIds')),
          401: unauthorizedResponse,
          403: adminOnlyResponse,
          404: groupNotFoundResponse,
        },
      },
      delete: {
        tags: ['Groups'],
        summary: 'Eliminar un grupo (admin)',
        description: 'Borra en cascada los miembros, gastos e invitaciones del grupo.',
        security: bearerAuth,
        parameters: [groupIdParam],
        responses: {
          204: { description: 'Grupo eliminado' },
          401: unauthorizedResponse,
          403: errorResponse('No es el creador del grupo', 'Solo el creador puede eliminar el grupo'),
          404: groupNotFoundResponse,
        },
      },
    },
    '/groups/{id}/members': {
      get: {
        tags: ['Groups'],
        summary: 'Listar los miembros de un grupo',
        security: bearerAuth,
        parameters: [groupIdParam],
        responses: {
          200: jsonResponse('Miembros', { type: 'array', items: ref('GroupMember') }),
          401: unauthorizedResponse,
          403: forbiddenGroupResponse,
        },
      },
      post: {
        tags: ['Groups'],
        summary: 'Agregar un usuario existente al grupo',
        description: 'Respeta el límite de 10 miembros por grupo.',
        security: bearerAuth,
        parameters: [groupIdParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId'],
                properties: {
                  userId: { type: 'string', format: 'uuid', description: 'Usuario existente' },
                },
              },
            },
          },
        },
        responses: {
          201: jsonResponse('Miembro agregado', messageSchema('Miembro agregado')),
          400: errorResponse('Falta el userId', 'userId requerido'),
          401: unauthorizedResponse,
          403: forbiddenGroupResponse,
          404: userNotFoundResponse,
          409: errorResponse('Ya es miembro o el grupo está lleno', 'Grupo lleno'),
        },
      },
    },
    '/groups/{id}/members/{userId}': {
      put: {
        tags: ['Groups'],
        summary: 'Editar los datos de un miembro dentro del grupo (admin)',
        description: 'Datos propios del grupo: apodo, alias de pago y CBU. No modifica el perfil del usuario.',
        security: bearerAuth,
        parameters: [
          groupIdParam,
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
          200: jsonResponse('Miembro actualizado', ref('MemberOverrides')),
          401: unauthorizedResponse,
          403: adminOnlyResponse,
          404: errorResponse('Miembro no encontrado en el grupo'),
        },
      },
      delete: {
        tags: ['Groups'],
        summary: 'Quitar un miembro del grupo',
        security: bearerAuth,
        parameters: [
          groupIdParam,
          { name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          204: { description: 'Miembro eliminado' },
          401: unauthorizedResponse,
          403: forbiddenGroupResponse,
          404: errorResponse('Miembro no encontrado en el grupo'),
        },
      },
    },
    '/groups/{id}/balances': {
      get: {
        tags: ['Groups'],
        summary: 'Obtener los balances y las deudas mínimas del grupo',
        description: 'Calculado con `shared/balances.mjs`, el mismo módulo que usa el frontend.',
        security: bearerAuth,
        parameters: [groupIdParam],
        responses: {
          200: jsonResponse('Balances por miembro y deudas', ref('GroupBalances')),
          401: unauthorizedResponse,
          403: forbiddenGroupResponse,
        },
      },
    },
    '/groups/{id}/summary': {
      post: {
        tags: ['Groups'],
        summary: 'Enviar el resumen del grupo en PDF al email del usuario actual',
        security: bearerAuth,
        parameters: [groupIdParam],
        responses: {
          200: jsonResponse('Resumen enviado', {
            type: 'object',
            properties: {
              message: { type: 'string', example: 'Resumen enviado' },
              sentTo: { type: 'integer', example: 1 },
            },
          }),
          400: errorResponse(
            'Sin email configurado o resúmenes por email desactivados',
            'Tenés desactivados los resúmenes por email. Activalos en tu perfil para recibirlos'
          ),
          401: unauthorizedResponse,
          403: forbiddenGroupResponse,
          404: groupNotFoundResponse,
        },
      },
    },
    '/groups/{id}/summary/pdf': {
      get: {
        tags: ['Groups'],
        summary: 'Descargar el resumen del grupo en PDF',
        security: bearerAuth,
        parameters: [groupIdParam],
        responses: {
          200: {
            description: 'Archivo PDF (`resumen-<grupo>-<fecha>.pdf`)',
            headers: {
              'Content-Disposition': {
                schema: { type: 'string', example: 'attachment; filename="resumen-cumpleanos-sabado-2026-10-07.pdf"' },
              },
            },
            content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } },
          },
          401: unauthorizedResponse,
          403: forbiddenGroupResponse,
          404: groupNotFoundResponse,
        },
      },
    },
    '/groups/{id}/invitations': {
      get: {
        tags: ['Groups'],
        summary: 'Listar las invitaciones por email pendientes del grupo',
        security: bearerAuth,
        parameters: [groupIdParam],
        responses: {
          200: jsonResponse('Invitaciones pendientes', { type: 'array', items: ref('PendingInvitation') }),
          401: unauthorizedResponse,
          403: forbiddenGroupResponse,
        },
      },
      post: {
        tags: ['Groups'],
        summary: 'Invitar a alguien por email',
        description: 'Si ya había una invitación pendiente para ese email, se reutiliza y se renueva su vencimiento.',
        security: bearerAuth,
        parameters: [groupIdParam],
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
          201: jsonResponse('Invitación enviada', {
            type: 'object',
            properties: {
              message: { type: 'string', example: 'Invitación enviada' },
              email: { type: 'string', format: 'email' },
            },
          }),
          400: validationErrorResponse('Email inválido', 'email'),
          401: unauthorizedResponse,
          403: forbiddenGroupResponse,
          409: errorResponse('Ya es miembro del grupo', 'Esa persona ya es miembro del grupo'),
        },
      },
    },
    '/groups/{id}/invitations/{invitationId}': {
      delete: {
        tags: ['Groups'],
        summary: 'Revocar una invitación por email',
        security: bearerAuth,
        parameters: [
          groupIdParam,
          { name: 'invitationId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          204: { description: 'Invitación revocada' },
          401: unauthorizedResponse,
          403: forbiddenGroupResponse,
          404: errorResponse('Invitación no encontrada'),
        },
      },
    },
    '/groups/{id}/invite-code': {
      get: {
        tags: ['Groups'],
        summary: 'Obtener el código compartible del grupo',
        security: bearerAuth,
        parameters: [groupIdParam],
        responses: {
          200: jsonResponse('Código de invitación (`token: null` si no hay uno generado)', {
            type: 'object',
            properties: { token: { type: 'string', nullable: true, example: 'xYBnxW9S' } },
          }),
          401: unauthorizedResponse,
          403: forbiddenGroupResponse,
        },
      },
      post: {
        tags: ['Groups'],
        summary: 'Generar o regenerar el código compartible (admin)',
        description: 'Reemplaza el código anterior, que deja de funcionar.',
        security: bearerAuth,
        parameters: [groupIdParam],
        responses: {
          201: jsonResponse('Código generado', ref('InviteCode')),
          401: unauthorizedResponse,
          403: adminOnlyResponse,
        },
      },
      delete: {
        tags: ['Groups'],
        summary: 'Revocar el código compartible (admin)',
        security: bearerAuth,
        parameters: [groupIdParam],
        responses: {
          204: { description: 'Código revocado' },
          401: unauthorizedResponse,
          403: adminOnlyResponse,
        },
      },
    },

    // ---------- Expenses ----------
    '/expenses': {
      get: {
        tags: ['Expenses'],
        summary: 'Listar gastos',
        description:
          'Sin `groupId` devuelve los gastos de todos los grupos del usuario. ' +
          'Incluye las liquidaciones (`category: "settlement"`).',
        security: bearerAuth,
        parameters: [{ name: 'groupId', in: 'query', required: false, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: jsonResponse('Gastos, del más reciente al más antiguo', { type: 'array', items: ref('Expense') }),
          401: unauthorizedResponse,
          403: forbiddenExpenseResponse,
        },
      },
      post: {
        tags: ['Expenses'],
        summary: 'Crear un gasto',
        description: 'Guarda el gasto y su división en una sola transacción.',
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
                  description: { type: 'string', example: 'Supermercado' },
                  amount: { type: 'number', minimum: 0, exclusiveMinimum: true, example: 12500.5 },
                  paidBy: { type: 'string', format: 'uuid' },
                  splitBetween: { type: 'array', minItems: 1, items: { type: 'string', format: 'uuid' } },
                  category: { type: 'string', enum: CATEGORIES },
                  date: { type: 'string', format: 'date', example: '2026-10-07' },
                },
              },
            },
          },
        },
        responses: {
          201: jsonResponse('Gasto creado', ref('Expense')),
          400: validationErrorResponse('Monto debe ser mayor a 0', 'amount'),
          401: unauthorizedResponse,
          403: forbiddenExpenseResponse,
        },
      },
    },
    '/expenses/settle': {
      post: {
        tags: ['Expenses'],
        summary: 'Registrar una liquidación de deuda',
        description:
          'Se almacena como un gasto con `category: "settlement"` y descripción "Saldo de deuda", ' +
          'pagado por el deudor (`paidBy = fromUserId`) y dividido solo con el acreedor (`splitBetween = [toUserId]`).',
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
                  amount: { type: 'number', minimum: 0, exclusiveMinimum: true, example: 1833.33 },
                },
              },
            },
          },
        },
        responses: {
          201: jsonResponse('Liquidación registrada', ref('Expense')),
          400: validationErrorResponse('ID de acreedor inválido', 'toUserId'),
          401: unauthorizedResponse,
          403: forbiddenExpenseResponse,
        },
      },
    },
    '/expenses/{id}': {
      get: {
        tags: ['Expenses'],
        summary: 'Obtener un gasto por ID',
        security: bearerAuth,
        parameters: [expenseIdParam],
        responses: {
          200: jsonResponse('Gasto', ref('Expense')),
          401: unauthorizedResponse,
          403: forbiddenExpenseResponse,
          404: expenseNotFoundResponse,
        },
      },
      delete: {
        tags: ['Expenses'],
        summary: 'Eliminar un gasto',
        security: bearerAuth,
        parameters: [expenseIdParam],
        responses: {
          204: { description: 'Gasto eliminado' },
          401: unauthorizedResponse,
          403: forbiddenExpenseResponse,
          404: expenseNotFoundResponse,
        },
      },
    },

    // ---------- Invitations ----------
    '/invitations/{token}': {
      get: {
        tags: ['Invitations'],
        summary: 'Preview público de una invitación',
        description:
          'No requiere autenticación. Devuelve el estado del enlace y datos básicos del grupo para ' +
          'mostrar antes de iniciar sesión. Siempre responde 200: un token inexistente devuelve `status: "invalid"`.',
        parameters: [tokenParam],
        responses: {
          200: jsonResponse('Preview de la invitación', ref('InvitationPreview')),
        },
      },
    },
    '/invitations/{token}/accept': {
      post: {
        tags: ['Invitations'],
        summary: 'Aceptar una invitación y unirse al grupo',
        description:
          'Requiere sesión. Las invitaciones personales solo las puede aceptar su email y son de un solo uso; ' +
          'el código compartible es reutilizable. Si el usuario ya es miembro, responde 200 sin cambios. ' +
          'Respeta el límite de 10 miembros.',
        security: bearerAuth,
        parameters: [tokenParam],
        responses: {
          200: jsonResponse('Unido al grupo', {
            type: 'object',
            properties: { groupId: { type: 'string', format: 'uuid' } },
          }),
          401: unauthorizedResponse,
          403: errorResponse('La invitación es para otro email', 'Esta invitación es para otra dirección de email'),
          404: errorResponse('Invitación inexistente', 'Invitación inválida'),
          409: errorResponse('Grupo lleno'),
          410: errorResponse('Invitación expirada o ya utilizada', 'La invitación expiró'),
        },
      },
    },
  },
}

module.exports = openapi

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SecTube API',
      version: '1.0.0',
      description: `
# SecTube - Cybersecurity Video Streaming Platform API

A comprehensive RESTful API for a video streaming platform specifically designed for cybersecurity content, including bug bounties, ethical hacking tutorials, CTF writeups, and security research.

## Features

- **Authentication**: JWT-based authentication with 2FA support, OAuth (GitHub, Google)
- **Video Management**: Upload, transcode, and stream cybersecurity videos
- **User Roles**: Viewer, Streamer, and Admin roles with different permissions
- **Social Features**: Subscriptions, comments, likes, watch history, saved videos
- **Cybersecurity Focus**: Specialized categories, difficulty levels, and tools metadata

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

Get your token by registering at \`/api/auth/register\` or logging in at \`/api/auth/login\`.

## Rate Limiting

The API implements rate limiting to prevent abuse. Password reset endpoints have stricter limits.

## Error Responses

All error responses follow this format:

\`\`\`json
{
  "success": false,
  "message": "Error description"
}
\`\`\`

## Success Responses

Success responses follow this format:

\`\`\`json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
\`\`\`
      `,
      contact: {
        name: 'API Support',
        email: 'support@sectube.com'
      },
      license: {
        name: 'MIT',
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://sectube-backend.onrender.com',
        description: 'Production server',
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token from login/register response'
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error description'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation completed successfully'
            }
          }
        },
        UserResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            token: {
              type: 'string',
              description: 'JWT authentication token'
            },
            data: {
              $ref: '#/components/schemas/User'
            }
          }
        },
        VideoList: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            count: {
              type: 'integer',
              description: 'Number of videos returned'
            },
            pagination: {
              type: 'object',
              properties: {
                page: {
                  type: 'integer'
                },
                limit: {
                  type: 'integer'
                },
                total: {
                  type: 'integer'
                }
              }
            },
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Video'
              }
            }
          }
        },
        Categories: {
          type: 'string',
          enum: [
            'Web Application Security',
            'Network Security',
            'Bug Bounty',
            'Penetration Testing',
            'Malware Analysis',
            'Reverse Engineering',
            'Mobile Security',
            'Cloud Security',
            'CTF Writeup',
            'OSINT',
            'Cryptography',
            'IoT Security',
            'Security Tools',
            'Tutorial',
            'Other'
          ]
        },
        Difficulty: {
          type: 'string',
          enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert']
        },
        Visibility: {
          type: 'string',
          enum: ['public', 'unlisted', 'private']
        },
        ProcessingStatus: {
          type: 'string',
          enum: ['uploading', 'processing', 'ready', 'failed']
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Not authorized to access this route'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Resource not found'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Validation error',
                errors: ['Field is required']
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Auth',
        description: 'Authentication and user account management endpoints'
      },
      {
        name: 'Videos',
        description: 'Video upload, management, and interaction endpoints'
      },
      {
        name: 'Users',
        description: 'User profile and social interaction endpoints'
      },
      {
        name: 'Channels',
        description: 'Channel browsing and discovery endpoints'
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/models/*.js'],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app) => {
  // Swagger JSON endpoint
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 30px 0 }
      .swagger-ui .info .title { font-size: 36px }
      .swagger-ui .scheme-container { background: #1e293b; padding: 15px; border-radius: 8px; margin: 20px 0 }
    `,
    customSiteTitle: 'SecTube API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      defaultModelsExpandDepth: 3,
      defaultModelExpandDepth: 3,
      tryItOutEnabled: true,
    },
  }));

  console.log('📝 Swagger documentation available at /api-docs (development mode only)');
  console.log('📄 Swagger JSON available at /api-docs.json');
};

export default specs;

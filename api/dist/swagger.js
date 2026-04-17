import swaggerJsdoc from 'swagger-jsdoc';
export const openApiSpecification = swaggerJsdoc({
    definition: {
        openapi: '3.0.3',
        info: {
            title: 'WebApiServer',
            version: '0.1.0',
            description: 'Shared API for the React web client and future Unity client.'
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Local development server'
            }
        ],
        paths: {
            '/health': {
                get: {
                    tags: ['System'],
                    summary: 'Get API health status',
                    responses: {
                        '200': {
                            description: 'API is reachable',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/HealthResponse' }
                                }
                            }
                        }
                    }
                }
            },
            '/api/tasks': {
                get: {
                    tags: ['Tasks'],
                    summary: 'List current tasks',
                    responses: {
                        '200': {
                            description: 'Current task collection',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/TaskListResponse' }
                                }
                            }
                        }
                    }
                },
                post: {
                    tags: ['Tasks'],
                    summary: 'Create a new task',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/CreateTaskInput' }
                            }
                        }
                    },
                    responses: {
                        '201': {
                            description: 'Created task',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/Task' }
                                }
                            }
                        },
                        '400': {
                            description: 'Validation error'
                        }
                    }
                }
            }
        },
        components: {
            schemas: {
                HealthResponse: {
                    type: 'object',
                    required: ['status', 'timestamp'],
                    properties: {
                        status: { type: 'string', example: 'ok' },
                        timestamp: { type: 'string', format: 'date-time' }
                    }
                },
                Task: {
                    type: 'object',
                    required: ['id', 'title', 'status', 'createdAt'],
                    properties: {
                        id: { type: 'integer', example: 1 },
                        title: { type: 'string', example: 'Ship first feature' },
                        status: { type: 'string', enum: ['todo', 'doing', 'done'] },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                CreateTaskInput: {
                    type: 'object',
                    required: ['title'],
                    properties: {
                        title: { type: 'string', example: 'Review Unity integration' }
                    }
                },
                TaskListResponse: {
                    type: 'object',
                    required: ['items'],
                    properties: {
                        items: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Task' }
                        }
                    }
                }
            }
        },
        tags: [
            { name: 'System', description: 'Server health checks' },
            { name: 'Tasks', description: 'Shared demo resource for web and app clients' }
        ]
    },
    apis: []
});

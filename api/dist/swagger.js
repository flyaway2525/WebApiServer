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
            },
            '/api/spaces': {
                get: {
                    tags: ['Spaces'],
                    summary: 'List point spaces',
                    responses: {
                        '200': {
                            description: 'Current point spaces',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/SpaceListResponse' }
                                }
                            }
                        }
                    }
                },
                post: {
                    tags: ['Spaces'],
                    summary: 'Create a point space',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/CreateSpaceInput' }
                            }
                        }
                    },
                    responses: {
                        '201': {
                            description: 'Created point space',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/Space' }
                                }
                            }
                        },
                        '400': {
                            description: 'Validation error'
                        }
                    }
                }
            },
            '/api/spaces/{spaceId}/members': {
                get: {
                    tags: ['Spaces'],
                    summary: 'List members within a point space',
                    parameters: [
                        {
                            in: 'path',
                            name: 'spaceId',
                            required: true,
                            schema: {
                                type: 'integer'
                            }
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'Current members in the point space',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/SpaceMemberListResponse' }
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
                },
                Space: {
                    type: 'object',
                    required: [
                        'id',
                        'code',
                        'name',
                        'kind',
                        'visibility',
                        'initialPoints',
                        'allowGuestJoin',
                        'rankingMode',
                        'bankCanMint',
                        'createdAt',
                        'memberCount',
                        'totalPoints'
                    ],
                    properties: {
                        id: { type: 'integer', example: 1 },
                        code: { type: 'string', example: 'BANK01' },
                        name: { type: 'string', example: 'Weekend Prize Bank' },
                        kind: { type: 'string', enum: ['owner', 'room'] },
                        visibility: { type: 'string', enum: ['private', 'members', 'public'] },
                        initialPoints: { type: 'integer', example: 10000 },
                        allowGuestJoin: { type: 'boolean', example: true },
                        rankingMode: { type: 'string', enum: ['manual', 'polling'] },
                        bankCanMint: { type: 'boolean', example: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        memberCount: { type: 'integer', example: 3 },
                        totalPoints: { type: 'integer', example: 11200 }
                    }
                },
                SpaceMember: {
                    type: 'object',
                    required: ['id', 'spaceId', 'displayName', 'role', 'isGuest', 'points', 'canTransfer', 'createdAt'],
                    properties: {
                        id: { type: 'integer', example: 1 },
                        spaceId: { type: 'integer', example: 1 },
                        displayName: { type: 'string', example: 'BANK' },
                        role: { type: 'string', enum: ['host', 'bank', 'member'] },
                        isGuest: { type: 'boolean', example: false },
                        points: { type: 'integer', example: 10000 },
                        canTransfer: { type: 'boolean', example: true },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                CreateSpaceInput: {
                    type: 'object',
                    required: ['name', 'kind', 'visibility', 'initialPoints', 'allowGuestJoin', 'hostDisplayName'],
                    properties: {
                        name: { type: 'string', example: 'Duel Room' },
                        kind: { type: 'string', enum: ['owner', 'room'] },
                        visibility: { type: 'string', enum: ['private', 'members', 'public'] },
                        initialPoints: { type: 'integer', example: 8000 },
                        allowGuestJoin: { type: 'boolean', example: true },
                        bankCanMint: { type: 'boolean', example: true },
                        hostDisplayName: { type: 'string', example: 'Host Player' }
                    }
                },
                SpaceListResponse: {
                    type: 'object',
                    required: ['items'],
                    properties: {
                        items: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Space' }
                        }
                    }
                },
                SpaceMemberListResponse: {
                    type: 'object',
                    required: ['items'],
                    properties: {
                        items: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/SpaceMember' }
                        }
                    }
                }
            }
        },
        tags: [
            { name: 'System', description: 'Server health checks' },
            { name: 'Tasks', description: 'Legacy demo resource retained during migration' },
            { name: 'Spaces', description: 'Point space creation and membership overview' }
        ]
    },
    apis: []
});

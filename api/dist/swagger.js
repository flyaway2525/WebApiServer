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
            '/api/spaces': {
                get: {
                    tags: ['Spaces'],
                    summary: 'List spaces',
                    responses: {
                        '200': {
                            description: 'Available spaces',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        required: ['items'],
                                        properties: {
                                            items: {
                                                type: 'array',
                                                items: { $ref: '#/components/schemas/Space' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                post: {
                    tags: ['Spaces'],
                    summary: 'Create a space without issuing a session',
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
                            description: 'Created space',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/Space' }
                                }
                            }
                        },
                        '400': { $ref: '#/components/responses/BadRequest' }
                    }
                }
            },
            '/api/spaces/session': {
                post: {
                    tags: ['Spaces'],
                    summary: 'Create a space and issue an authenticated session for the creator',
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
                            description: 'Created space with host session',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/CreateSpaceResponse' }
                                }
                            }
                        },
                        '400': { $ref: '#/components/responses/BadRequest' }
                    }
                }
            },
            '/api/spaces/join': {
                post: {
                    tags: ['Spaces'],
                    summary: 'Join a space as a guest and issue a session',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/JoinSpaceInput' }
                            }
                        }
                    },
                    responses: {
                        '201': {
                            description: 'Joined space with guest session',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/JoinResponse' }
                                }
                            }
                        },
                        '400': { $ref: '#/components/responses/BadRequest' }
                    }
                }
            },
            '/api/spaces/{spaceId}/members': {
                get: {
                    tags: ['Spaces'],
                    summary: 'List members in a space',
                    parameters: [{ $ref: '#/components/parameters/SpaceId' }],
                    responses: {
                        '200': {
                            description: 'Members in the selected space',
                            content: {
                                'application/json': {
                                    schema: {
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
                            }
                        },
                        '400': { $ref: '#/components/responses/BadRequest' }
                    }
                }
            },
            '/api/spaces/{spaceId}/transactions': {
                get: {
                    tags: ['Transactions'],
                    summary: 'List direct transactions in a space',
                    parameters: [{ $ref: '#/components/parameters/SpaceId' }],
                    responses: {
                        '200': {
                            description: 'Transactions in the selected space',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        required: ['items'],
                                        properties: {
                                            items: {
                                                type: 'array',
                                                items: { $ref: '#/components/schemas/SpaceTransaction' }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        '400': { $ref: '#/components/responses/BadRequest' }
                    }
                },
                post: {
                    tags: ['Transactions'],
                    summary: 'Create an authenticated direct transaction',
                    description: 'Requires an authenticated member session. Host can execute direct transactions broadly. Regular members can only transfer or consume from their own balance. In owner spaces, BANK may mint points only when sourceMemberId is omitted and bankCanMint is enabled.',
                    parameters: [
                        { $ref: '#/components/parameters/SpaceId' },
                        { $ref: '#/components/parameters/SpaceMemberIdHeader' },
                        { $ref: '#/components/parameters/SpaceSessionTokenHeader' }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/CreateSpaceTransactionInput' }
                            }
                        }
                    },
                    responses: {
                        '201': {
                            description: 'Direct transaction created',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/SpaceTransaction' }
                                }
                            }
                        },
                        '400': { $ref: '#/components/responses/BadRequest' }
                    }
                }
            },
            '/api/spaces/{spaceId}/state': {
                post: {
                    tags: ['Spaces'],
                    summary: 'Update the lifecycle state of a space',
                    description: 'Requires an authenticated member session. Hosts can change any space state, and BANK can also manage owner spaces according to lifecycle rules.',
                    parameters: [
                        { $ref: '#/components/parameters/SpaceId' },
                        { $ref: '#/components/parameters/SpaceMemberIdHeader' },
                        { $ref: '#/components/parameters/SpaceSessionTokenHeader' }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/UpdateSpaceStateInput' }
                            }
                        }
                    },
                    responses: {
                        '200': {
                            description: 'Updated space state',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/Space' }
                                }
                            }
                        },
                        '400': { $ref: '#/components/responses/BadRequest' }
                    }
                }
            },
            '/api/spaces/{spaceId}/transaction-requests': {
                get: {
                    tags: ['Transactions'],
                    summary: 'List transaction requests for a space',
                    parameters: [
                        { $ref: '#/components/parameters/SpaceId' }
                    ],
                    responses: {
                        '200': {
                            description: 'Transaction requests in the selected space',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        required: ['items'],
                                        properties: {
                                            items: {
                                                type: 'array',
                                                items: { $ref: '#/components/schemas/SpaceTransactionRequest' }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        '400': { $ref: '#/components/responses/BadRequest' }
                    }
                },
                post: {
                    tags: ['Transactions'],
                    summary: 'Create a pending transaction request',
                    description: 'Requires an authenticated member session. Requests are for operations that need another member or host to approve. Non-host members cannot submit a request that spends their own balance directly; they should use the direct transaction endpoint instead.',
                    parameters: [
                        { $ref: '#/components/parameters/SpaceId' },
                        { $ref: '#/components/parameters/SpaceMemberIdHeader' },
                        { $ref: '#/components/parameters/SpaceSessionTokenHeader' }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/CreateSpaceTransactionRequestInput' }
                            }
                        }
                    },
                    responses: {
                        '201': {
                            description: 'Pending request created',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/SpaceTransactionRequest' }
                                }
                            }
                        },
                        '400': { $ref: '#/components/responses/BadRequest' }
                    }
                }
            },
            '/api/spaces/{spaceId}/transaction-requests/{requestId}/approve': {
                post: {
                    tags: ['Transactions'],
                    summary: 'Approve a pending transaction request',
                    description: 'Requires an authenticated member session. Host can approve any pending request. Non-host members can approve only requests where sourceMemberId matches their own member ID.',
                    parameters: [
                        { $ref: '#/components/parameters/SpaceId' },
                        { $ref: '#/components/parameters/RequestId' },
                        { $ref: '#/components/parameters/SpaceMemberIdHeader' },
                        { $ref: '#/components/parameters/SpaceSessionTokenHeader' }
                    ],
                    responses: {
                        '200': {
                            description: 'Approved transaction request',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/SpaceTransactionRequest' }
                                }
                            }
                        },
                        '400': { $ref: '#/components/responses/BadRequest' }
                    }
                }
            },
            '/api/spaces/{spaceId}/transaction-requests/{requestId}/reject': {
                post: {
                    tags: ['Transactions'],
                    summary: 'Reject a pending transaction request',
                    description: 'Requires an authenticated member session. Host can reject any pending request. Non-host members can reject only requests where sourceMemberId matches their own member ID. rejectionReason is optional and returned in request history.',
                    parameters: [
                        { $ref: '#/components/parameters/SpaceId' },
                        { $ref: '#/components/parameters/RequestId' },
                        { $ref: '#/components/parameters/SpaceMemberIdHeader' },
                        { $ref: '#/components/parameters/SpaceSessionTokenHeader' }
                    ],
                    requestBody: {
                        required: false,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/RejectTransactionRequestInput' }
                            }
                        }
                    },
                    responses: {
                        '200': {
                            description: 'Rejected transaction request',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/SpaceTransactionRequest' }
                                }
                            }
                        },
                        '400': { $ref: '#/components/responses/BadRequest' }
                    }
                }
            }
        },
        components: {
            parameters: {
                SpaceId: {
                    name: 'spaceId',
                    in: 'path',
                    required: true,
                    schema: { type: 'integer', minimum: 1 }
                },
                RequestId: {
                    name: 'requestId',
                    in: 'path',
                    required: true,
                    schema: { type: 'integer', minimum: 1 }
                },
                SpaceMemberIdHeader: {
                    name: 'x-space-member-id',
                    in: 'header',
                    required: true,
                    description: 'Authenticated member ID for the current space session. Use together with x-space-session-token.',
                    schema: { type: 'integer', minimum: 1 }
                },
                SpaceSessionTokenHeader: {
                    name: 'x-space-session-token',
                    in: 'header',
                    required: true,
                    description: 'Opaque session token issued when a member creates or joins a space. Use together with x-space-member-id.',
                    schema: { type: 'string', minLength: 1 }
                }
            },
            responses: {
                BadRequest: {
                    description: 'Validation or business rule error',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' }
                        }
                    }
                }
            },
            schemas: {
                ErrorResponse: {
                    type: 'object',
                    required: ['message'],
                    properties: {
                        message: { type: 'string' }
                    }
                },
                Space: {
                    type: 'object',
                    required: [
                        'id', 'code', 'name', 'kind', 'visibility', 'initialPoints', 'allowGuestJoin', 'rankingMode',
                        'bankCanMint', 'state', 'closedAt', 'closedByMemberId', 'createdAt', 'memberCount', 'totalPoints'
                    ],
                    properties: {
                        id: { type: 'integer', minimum: 1 },
                        code: { type: 'string' },
                        name: { type: 'string' },
                        kind: { type: 'string', enum: ['owner', 'room'] },
                        visibility: { type: 'string', enum: ['private', 'members', 'public'] },
                        initialPoints: { type: 'integer', minimum: 0 },
                        allowGuestJoin: { type: 'boolean' },
                        rankingMode: { type: 'string', enum: ['manual', 'polling'] },
                        bankCanMint: { type: 'boolean' },
                        state: { type: 'string', enum: ['active', 'closed', 'archived'] },
                        closedAt: { type: 'string', format: 'date-time', nullable: true },
                        closedByMemberId: { type: 'integer', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        memberCount: { type: 'integer', minimum: 0 },
                        totalPoints: { type: 'integer', minimum: 0 }
                    }
                },
                SpaceMember: {
                    type: 'object',
                    required: ['id', 'spaceId', 'displayName', 'role', 'isGuest', 'points', 'canTransfer', 'createdAt'],
                    properties: {
                        id: { type: 'integer', minimum: 1 },
                        spaceId: { type: 'integer', minimum: 1 },
                        displayName: { type: 'string' },
                        role: { type: 'string', enum: ['host', 'bank', 'member'] },
                        isGuest: { type: 'boolean' },
                        points: { type: 'integer' },
                        canTransfer: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                SpaceSession: {
                    type: 'object',
                    required: ['memberId', 'spaceId', 'token', 'issuedAt'],
                    description: 'Authenticated member session returned by space creation or join endpoints and required by protected transaction endpoints.',
                    properties: {
                        memberId: { type: 'integer', minimum: 1 },
                        spaceId: { type: 'integer', minimum: 1 },
                        token: { type: 'string' },
                        issuedAt: { type: 'string', format: 'date-time' }
                    }
                },
                CreateSpaceInput: {
                    type: 'object',
                    required: ['name', 'kind', 'visibility', 'initialPoints', 'allowGuestJoin', 'bankCanMint', 'hostDisplayName'],
                    properties: {
                        name: { type: 'string' },
                        kind: { type: 'string', enum: ['owner', 'room'] },
                        visibility: { type: 'string', enum: ['private', 'members', 'public'] },
                        initialPoints: { type: 'integer', minimum: 0 },
                        allowGuestJoin: { type: 'boolean' },
                        bankCanMint: { type: 'boolean' },
                        hostDisplayName: { type: 'string' }
                    }
                },
                JoinSpaceInput: {
                    type: 'object',
                    required: ['code', 'displayName'],
                    properties: {
                        code: { type: 'string' },
                        displayName: { type: 'string' }
                    }
                },
                CreateSpaceResponse: {
                    type: 'object',
                    required: ['space', 'member', 'session'],
                    properties: {
                        space: { $ref: '#/components/schemas/Space' },
                        member: { $ref: '#/components/schemas/SpaceMember' },
                        session: { $ref: '#/components/schemas/SpaceSession' }
                    }
                },
                JoinResponse: {
                    type: 'object',
                    required: ['space', 'member', 'session'],
                    properties: {
                        space: { $ref: '#/components/schemas/Space' },
                        member: { $ref: '#/components/schemas/SpaceMember' },
                        session: { $ref: '#/components/schemas/SpaceSession' }
                    }
                },
                UpdateSpaceStateInput: {
                    type: 'object',
                    required: ['state'],
                    properties: {
                        state: {
                            type: 'string',
                            enum: ['active', 'closed', 'archived'],
                            description: 'Next lifecycle state. Archived spaces cannot be reopened, and only closed spaces can be archived.'
                        }
                    }
                },
                CreateSpaceTransactionInput: {
                    type: 'object',
                    required: ['kind', 'amount', 'actorType'],
                    properties: {
                        kind: { type: 'string', enum: ['grant', 'transfer', 'consume'] },
                        amount: { type: 'integer', minimum: 1 },
                        actorType: { type: 'string', enum: ['member', 'system', 'qr'] },
                        actorMemberId: { type: 'integer', nullable: true },
                        sourceMemberId: { type: 'integer', nullable: true },
                        targetMemberId: { type: 'integer', nullable: true },
                        note: { type: 'string', nullable: true }
                    }
                },
                SpaceTransaction: {
                    type: 'object',
                    required: [
                        'id', 'spaceId', 'kind', 'actorType', 'actorMemberId', 'actorDisplayName', 'sourceMemberId',
                        'sourceDisplayName', 'targetMemberId', 'targetDisplayName', 'amount', 'note', 'createdAt'
                    ],
                    properties: {
                        id: { type: 'integer', minimum: 1 },
                        spaceId: { type: 'integer', minimum: 1 },
                        kind: { type: 'string', enum: ['grant', 'transfer', 'consume'] },
                        actorType: { type: 'string', enum: ['member', 'system', 'qr'] },
                        actorMemberId: { type: 'integer', nullable: true },
                        actorDisplayName: { type: 'string', nullable: true },
                        sourceMemberId: { type: 'integer', nullable: true },
                        sourceDisplayName: { type: 'string', nullable: true },
                        targetMemberId: { type: 'integer', nullable: true },
                        targetDisplayName: { type: 'string', nullable: true },
                        amount: { type: 'integer', minimum: 1 },
                        note: { type: 'string', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                CreateSpaceTransactionRequestInput: {
                    type: 'object',
                    required: ['kind', 'amount'],
                    properties: {
                        kind: {
                            type: 'string',
                            enum: ['grant', 'transfer', 'consume']
                        },
                        amount: {
                            type: 'integer',
                            minimum: 1
                        },
                        sourceMemberId: {
                            type: 'integer',
                            minimum: 1,
                            nullable: true
                        },
                        targetMemberId: {
                            type: 'integer',
                            minimum: 1,
                            nullable: true
                        },
                        note: {
                            type: 'string',
                            nullable: true
                        }
                    }
                },
                RejectTransactionRequestInput: {
                    type: 'object',
                    properties: {
                        rejectionReason: {
                            type: 'string',
                            maxLength: 240,
                            description: 'Optional human-readable reason shown in request history.'
                        }
                    }
                },
                SpaceTransactionRequest: {
                    type: 'object',
                    required: [
                        'id',
                        'spaceId',
                        'kind',
                        'status',
                        'requesterMemberId',
                        'amount',
                        'approvedTransactionId',
                        'resolvedAt',
                        'resolvedByMemberId',
                        'resolvedByDisplayName',
                        'rejectionReason',
                        'createdAt'
                    ],
                    properties: {
                        id: { type: 'integer', minimum: 1 },
                        spaceId: { type: 'integer', minimum: 1 },
                        kind: { type: 'string', enum: ['grant', 'transfer', 'consume'] },
                        status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
                        requesterMemberId: { type: 'integer', minimum: 1 },
                        requesterDisplayName: { type: 'string', nullable: true },
                        sourceMemberId: { type: 'integer', nullable: true },
                        sourceDisplayName: { type: 'string', nullable: true },
                        targetMemberId: { type: 'integer', nullable: true },
                        targetDisplayName: { type: 'string', nullable: true },
                        amount: { type: 'integer', minimum: 1 },
                        note: { type: 'string', nullable: true },
                        rejectionReason: { type: 'string', nullable: true },
                        approvedTransactionId: { type: 'integer', nullable: true },
                        resolvedAt: { type: 'string', format: 'date-time', nullable: true },
                        resolvedByMemberId: { type: 'integer', nullable: true },
                        resolvedByDisplayName: { type: 'string', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                }
            }
        },
        tags: [
            { name: 'System', description: 'Server health checks' },
            { name: 'Tasks', description: 'Legacy demo resource retained during migration' },
            { name: 'Spaces', description: 'Point space creation and lifecycle management' },
            { name: 'Transactions', description: 'Ledger operations and approval requests' }
        ]
    },
    apis: []
});

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
        paths: {},
        components: {
            schemas: {}
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

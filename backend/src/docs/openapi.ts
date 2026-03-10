import type { OpenAPIV3 } from 'openapi-types'

const openapi: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'Expense API',
    version: '1.0.0',
    description: 'REST API for the Expense app. Database: PostgreSQL `expense`.',
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Local dev',
    },
  ],
  tags: [
    { name: 'Health', description: 'Health check' },
    { name: 'Expenses', description: 'Manage expenses' },
    { name: 'Categories', description: 'Expense categories' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    service: { type: 'string', example: 'expense-api' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/categories': {
      get: {
        tags: ['Categories'],
        summary: 'List categories',
        responses: {
          '200': {
            description: 'List of supported categories',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    categories: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Category',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/expenses': {
      get: {
        tags: ['Expenses'],
        summary: 'List expenses',
        description:
          'Returns expenses optionally filtered by category, date range, and note search.',
        parameters: [
          {
            in: 'query',
            name: 'category',
            schema: { $ref: '#/components/schemas/Category' },
            required: false,
          },
          {
            in: 'query',
            name: 'dateFrom',
            schema: { type: 'string', format: 'date' },
            required: false,
          },
          {
            in: 'query',
            name: 'dateTo',
            schema: { type: 'string', format: 'date' },
            required: false,
          },
          {
            in: 'query',
            name: 'search',
            schema: { type: 'string' },
            required: false,
          },
        ],
        responses: {
          '200': {
            description: 'Array of expenses',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Expense' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Expenses'],
        summary: 'Create expense',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateExpenseBody' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Expense created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Expense' },
              },
            },
          },
          '400': {
            description: 'Validation error',
          },
        },
      },
    },
    '/api/expenses/bulk-delete': {
      post: {
        tags: ['Expenses'],
        summary: 'Bulk soft-delete expenses',
        description:
          'Soft-deletes multiple expenses by ID. Sets deleted_at on each so they are excluded from list/get.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['ids'],
                properties: {
                  ids: {
                    type: 'array',
                    items: { type: 'string', format: 'uuid' },
                    minItems: 1,
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Soft-deleted count and IDs',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    deleted: { type: 'integer', description: 'Number of expenses soft-deleted' },
                    ids: {
                      type: 'array',
                      items: { type: 'string', format: 'uuid' },
                      description: 'IDs that were soft-deleted',
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'ids must be a non-empty array of UUIDs',
          },
        },
      },
    },
    '/api/expenses/trash': {
      get: {
        tags: ['Expenses'],
        summary: 'List trashed expenses',
        description:
          'Returns only soft-deleted expenses (deleted_at IS NOT NULL), ordered by deleted_at DESC.',
        responses: {
          '200': {
            description: 'Array of trashed expenses',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Expense' },
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Expenses'],
        summary: 'Empty trash (permanent delete all)',
        description:
          'Permanently deletes all soft-deleted expenses. Rows are removed from the database.',
        responses: {
          '200': {
            description: 'Count and IDs of permanently deleted expenses',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    deleted: { type: 'integer' },
                    ids: { type: 'array', items: { type: 'string', format: 'uuid' } },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/expenses/bulk-permanent-delete': {
      post: {
        tags: ['Expenses'],
        summary: 'Permanently delete multiple expenses',
        description:
          'Permanently deletes the given soft-deleted expenses by ID. Only rows with deleted_at IS NOT NULL are removed.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['ids'],
                properties: {
                  ids: {
                    type: 'array',
                    items: { type: 'string', format: 'uuid' },
                    minItems: 1,
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Count and IDs permanently deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    deleted: { type: 'integer' },
                    ids: { type: 'array', items: { type: 'string', format: 'uuid' } },
                  },
                },
              },
            },
          },
          '400': {
            description: 'ids must be a non-empty array of UUIDs',
          },
        },
      },
    },
    '/api/expenses/bulk-restore': {
      post: {
        tags: ['Expenses'],
        summary: 'Bulk restore expenses',
        description: 'Restores multiple soft-deleted expenses by setting deleted_at = NULL.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['ids'],
                properties: {
                  ids: {
                    type: 'array',
                    items: { type: 'string', format: 'uuid' },
                    minItems: 1,
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Restored count and IDs',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    restored: { type: 'integer' },
                    ids: { type: 'array', items: { type: 'string', format: 'uuid' } },
                  },
                },
              },
            },
          },
          '400': {
            description: 'ids must be a non-empty array of UUIDs',
          },
        },
      },
    },
    '/api/expenses/{id}': {
      get: {
        tags: ['Expenses'],
        summary: 'Get one expense',
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Expense found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Expense' },
              },
            },
          },
          '404': {
            description: 'Expense not found',
          },
        },
      },
      put: {
        tags: ['Expenses'],
        summary: 'Update expense',
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateExpenseBody' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Expense updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Expense' },
              },
            },
          },
          '400': {
            description: 'Validation error',
          },
          '404': {
            description: 'Expense not found',
          },
        },
      },
      delete: {
        tags: ['Expenses'],
        summary: 'Soft-delete expense',
        description:
          'Sets deleted_at on the expense so it is excluded from list/get. Row is not removed.',
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Soft-deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    deleted: { type: 'boolean', example: true },
                    id: { type: 'string', format: 'uuid' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Expense not found',
          },
        },
      },
    },
    '/api/expenses/{id}/restore': {
      post: {
        tags: ['Expenses'],
        summary: 'Restore a soft-deleted expense',
        description: 'Sets deleted_at = NULL so the expense appears in list/get again.',
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Expense restored',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Expense' },
              },
            },
          },
          '404': {
            description: 'Expense not found or not deleted',
          },
        },
      },
    },
    '/api/expenses/{id}/permanent': {
      delete: {
        tags: ['Expenses'],
        summary: 'Permanently delete one expense',
        description:
          'Removes the expense from the database. Only soft-deleted expenses (deleted_at IS NOT NULL) can be permanently deleted.',
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Expense permanently deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    deleted: { type: 'boolean', example: true },
                    id: { type: 'string', format: 'uuid' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Expense not found or not in trash',
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Category: {
        type: 'string',
        enum: ['Food', 'Transport', 'Bills', 'Shopping', 'Health', 'Entertainment', 'Other'],
      },
      Expense: {
        type: 'object',
        required: ['id', 'date', 'amount', 'category'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          date: {
            type: 'string',
            format: 'date',
            example: '2024-01-15',
          },
          amount: {
            type: 'number',
            example: 42.5,
          },
          category: {
            $ref: '#/components/schemas/Category',
          },
          note: {
            type: 'string',
            nullable: true,
          },
        },
      },
      CreateExpenseBody: {
        type: 'object',
        required: ['date', 'amount', 'category'],
        properties: {
          date: {
            type: 'string',
            format: 'date',
            example: '2024-01-15',
          },
          amount: {
            type: 'number',
            example: 19.99,
          },
          category: {
            $ref: '#/components/schemas/Category',
          },
          note: {
            type: 'string',
          },
        },
      },
      UpdateExpenseBody: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            format: 'date',
          },
          amount: {
            type: 'number',
          },
          category: {
            $ref: '#/components/schemas/Category',
          },
          note: {
            type: 'string',
          },
        },
      },
    },
  },
}

export default openapi

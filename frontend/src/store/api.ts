import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { Expense, Category } from '../data/types'

export interface ExpensesQuery {
  category?: Category | ''
  dateFrom?: string
  dateTo?: string
  search?: string
}

export interface CreateExpenseRequest {
  date: string
  amount: number
  category: Category
  note?: string
}

export interface UpdateExpenseRequest {
  id: string
  date?: string
  amount?: number
  category?: Category
  note?: string
}

type CategoriesResponse = { categories: Category[] }

const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ?? 'http://localhost:3001'

export const expenseApi = createApi({
  reducerPath: 'expenseApi',
  baseQuery: fetchBaseQuery({
    baseUrl,
  }),
  tagTypes: ['Expenses', 'Categories', 'Trash'],
  endpoints: (builder) => ({
    getExpenses: builder.query<Expense[], ExpensesQuery | void>({
      query: (args) => {
        const params = new URLSearchParams()
        if (args?.category) params.set('category', args.category)
        if (args?.dateFrom) params.set('dateFrom', args.dateFrom)
        if (args?.dateTo) params.set('dateTo', args.dateTo)
        if (args?.search) params.set('search', args.search)
        const queryString = params.toString()
        return {
          url: `/api/expenses${queryString ? `?${queryString}` : ''}`,
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((e) => ({ type: 'Expenses' as const, id: e.id })),
              { type: 'Expenses' as const, id: 'LIST' },
            ]
          : [{ type: 'Expenses' as const, id: 'LIST' }],
    }),
    getCategories: builder.query<CategoriesResponse, void>({
      query: () => ({ url: '/api/categories' }),
      providesTags: [{ type: 'Categories', id: 'LIST' }],
    }),
    createExpense: builder.mutation<Expense, CreateExpenseRequest>({
      query: (body) => ({
        url: '/api/expenses',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Expenses', id: 'LIST' }],
    }),
    updateExpense: builder.mutation<Expense, UpdateExpenseRequest>({
      query: ({ id, ...body }) => ({
        url: `/api/expenses/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'Expenses', id: 'LIST' },
        { type: 'Expenses', id: arg.id },
      ],
    }),
    deleteExpense: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/expenses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: 'Expenses', id: 'LIST' },
        { type: 'Expenses', id },
        { type: 'Trash', id: 'LIST' },
      ],
    }),
    bulkDeleteExpenses: builder.mutation<{ deleted: number; ids: string[] }, string[]>({
      query: (ids) => ({
        url: '/api/expenses/bulk-delete',
        method: 'POST',
        body: { ids },
      }),
      invalidatesTags: [
        { type: 'Expenses', id: 'LIST' },
        { type: 'Trash', id: 'LIST' },
      ],
    }),
    getTrash: builder.query<Expense[], void>({
      query: () => ({ url: '/api/expenses/trash' }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((e) => ({ type: 'Trash' as const, id: e.id })),
              { type: 'Trash', id: 'LIST' },
            ]
          : [{ type: 'Trash', id: 'LIST' }],
    }),
    restoreExpense: builder.mutation<Expense, string>({
      query: (id) => ({
        url: `/api/expenses/${id}/restore`,
        method: 'POST',
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: 'Expenses', id: 'LIST' },
        { type: 'Trash', id: 'LIST' },
        { type: 'Trash', id },
      ],
    }),
    bulkRestoreExpenses: builder.mutation<{ restored: number; ids: string[] }, string[]>({
      query: (ids) => ({
        url: '/api/expenses/bulk-restore',
        method: 'POST',
        body: { ids },
      }),
      invalidatesTags: [
        { type: 'Expenses', id: 'LIST' },
        { type: 'Trash', id: 'LIST' },
      ],
    }),
    permanentDeleteExpense: builder.mutation<{ deleted: boolean; id: string }, string>({
      query: (id) => ({
        url: `/api/expenses/${id}/permanent`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: 'Expenses', id: 'LIST' },
        { type: 'Trash', id: 'LIST' },
        { type: 'Trash', id },
      ],
    }),
    bulkPermanentDeleteExpenses: builder.mutation<{ deleted: number; ids: string[] }, string[]>({
      query: (ids) => ({
        url: '/api/expenses/bulk-permanent-delete',
        method: 'POST',
        body: { ids },
      }),
      invalidatesTags: [
        { type: 'Expenses', id: 'LIST' },
        { type: 'Trash', id: 'LIST' },
      ],
    }),
    emptyTrash: builder.mutation<{ deleted: number; ids: string[] }, void>({
      query: () => ({
        url: '/api/expenses/trash',
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'Expenses', id: 'LIST' },
        { type: 'Trash', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetExpensesQuery,
  useGetCategoriesQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
  useBulkDeleteExpensesMutation,
  useGetTrashQuery,
  useRestoreExpenseMutation,
  useBulkRestoreExpensesMutation,
  usePermanentDeleteExpenseMutation,
  useBulkPermanentDeleteExpensesMutation,
  useEmptyTrashMutation,
} = expenseApi

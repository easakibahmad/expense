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

// Monthly plan (per month: year_month YYYY-MM)
export interface PlannedExpenseItem {
  id: string
  label: string
  amount: number
}

export interface MonthlyPlanResponse {
  items: PlannedExpenseItem[]
  monthlyIncome: number | null
}

export interface PlanSummaryItem {
  year_month: string
  planned_total: number
  monthly_income: number | null
}

export interface SavePlanRequest {
  monthlyIncome?: number | null
  items: { label: string; amount: number }[]
}

type CategoriesResponse = { categories: Category[] }

const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ?? 'http://localhost:3001'

export const expenseApi = createApi({
  reducerPath: 'expenseApi',
  baseQuery: fetchBaseQuery({
    baseUrl,
  }),
  tagTypes: ['Expenses', 'Categories', 'Trash', 'Plan'],
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
    // Monthly plan (per month)
    getPlanMonths: builder.query<string[], void>({
      query: () => ({ url: '/api/plan/months' }),
      transformResponse: (response: { months?: string[] }) => response?.months ?? [],
      providesTags: [{ type: 'Plan', id: 'MONTHS' }],
    }),
    getPlanSummaries: builder.query<{ summaries: PlanSummaryItem[] }, void>({
      query: () => ({ url: '/api/plan/summaries' }),
      providesTags: [{ type: 'Plan', id: 'SUMMARIES' }],
    }),
    getPlan: builder.query<MonthlyPlanResponse, string>({
      query: (yearMonth) => ({ url: `/api/plan/${yearMonth}` }),
      providesTags: (_res, _err, yearMonth) => [
        { type: 'Plan', id: yearMonth },
        { type: 'Plan', id: 'LIST' },
      ],
    }),
    savePlan: builder.mutation<MonthlyPlanResponse, { yearMonth: string; body: SavePlanRequest }>({
      query: ({ yearMonth, body }) => ({
        url: `/api/plan/${yearMonth}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'Plan', id: arg.yearMonth },
        { type: 'Plan', id: 'LIST' },
        { type: 'Plan', id: 'MONTHS' },
        { type: 'Plan', id: 'SUMMARIES' },
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
  useGetPlanMonthsQuery,
  useGetPlanSummariesQuery,
  useGetPlanQuery,
  useSavePlanMutation,
} = expenseApi

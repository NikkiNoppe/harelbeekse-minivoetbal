
// Basic Supabase client mock for now
export const supabase = {
  from: (table: string) => ({
    select: (columns?: string) => ({
      order: (column: string) => ({
        data: [],
        error: null
      }),
      single: () => ({
        data: null,
        error: null
      }),
      eq: (column: string, value: any) => ({
        data: [],
        error: null
      }),
      gte: (column: string, value: any) => ({
        data: [],
        error: null
      }),
      data: [],
      error: null
    }),
    insert: (data: any) => ({
      select: () => ({
        single: () => ({
          data: null,
          error: null
        }),
        data: [],
        error: null
      }),
      data: [],
      error: null
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        data: [],
        error: null
      })
    }),
    delete: () => ({
      eq: (column: string, value: any) => ({
        data: [],
        error: null
      }),
      gte: (column: string, value: any) => ({
        data: [],
        error: null
      })
    })
  })
};

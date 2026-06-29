// Admin Data Proxy Edge Function
// Generic endpoint for admin dashboard data fetching
// Uses service_role key to bypass RLS (admin section has no auth)
// Supports: POST (query/counts/insert), PATCH (update)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app-version, x-app-name',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Parse body once
    let body: Record<string, any> = {}
    try { body = await req.json() } catch { /* empty body */ }
    const action = body?.action || 'query'

    // ─── POST: counts ──────────────────────────────────────────────────
    if (req.method === 'POST' && action === 'counts') {
      const tables: string[] = body.tables || []
      const results: Record<string, number> = {}

      for (const tableEntry of tables) {
        let tableName = tableEntry
        let filterCol: string | undefined
        let filterVal: string | undefined

        if (typeof tableEntry === 'string' && tableEntry.includes(':')) {
          const parts = tableEntry.split(':')
          tableName = parts[0]
          filterCol = parts[1]
          filterVal = parts[2]
        }

        try {
          let q = supabaseClient.from(tableName).select('*', { count: 'exact', head: true })
          if (filterCol && filterVal) q = q.eq(filterCol, filterVal)
          if (filterCol && filterCol === 'null') q = q.is(filterCol, null)
          const { count } = await q
          results[tableName] = count || 0
        } catch {
          results[tableName] = -1
        }
      }

      return new Response(JSON.stringify({ counts: results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ─── POST: query ──────────────────────────────────────────────────
    if (req.method === 'POST' && action === 'query') {
      const table = body.table
      const selectParam = body.select || '*'
      const orderCol = body.order
      const orderDir = body.orderDir || 'desc'
      const limitVal = body.limit ?? 100
      const offsetVal = body.offset ?? 0
      const countVal = body.count
      const headOnly = body.head === true
      const filters = body.filters || {}
      const isNull = body.isNull || {}
      const gte = body.gte || {}
      const lte = body.lte || {}
      const inFilters = body.in || {}

      if (!table) {
        return new Response(JSON.stringify({ error: 'table parameter is required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      let query = supabaseClient.from(table).select(selectParam, countVal ? { count: countVal as any, head: headOnly } : undefined)

      // Apply filters
      for (const [col, value] of Object.entries(filters)) {
        query = query.eq(col, value as string)
      }
      for (const [col, value] of Object.entries(isNull)) {
        query = query.is(col, value ? null : undefined)
      }
      for (const [col, value] of Object.entries(gte)) {
        query = query.gte(col, value as string)
      }
      for (const [col, value] of Object.entries(lte)) {
        query = query.lte(col, value as string)
      }
      for (const [col, values] of Object.entries(inFilters)) {
        query = query.in(col, values as string[])
      }

      if (orderCol) query = query.order(orderCol, { ascending: orderDir === 'asc' })
      if (!headOnly) query = query.range(offsetVal, offsetVal + limitVal - 1)

      const { data, error, count } = await query

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ data, total: count || undefined }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ─── POST: insert ──────────────────────────────────────────────────
    if (req.method === 'POST' && action === 'insert') {
      const { table, data: insertData } = body

      if (!table || !insertData) {
        return new Response(JSON.stringify({ error: 'table and data are required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data, error } = await supabaseClient
        .from(table)
        .insert(insertData)
        .select()
        .single()

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ─── PATCH: update ─────────────────────────────────────────────────
    if (req.method === 'PATCH') {
      const { table, id, id_field, data: updateData } = body

      if (!table || !id || !updateData) {
        return new Response(JSON.stringify({ error: 'table, id, and data are required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const idCol = id_field || 'id'
      const { data, error } = await supabaseClient
        .from(table)
        .update(updateData)
        .eq(idCol, id)
        .select()
        .single()

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Admin data proxy error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})

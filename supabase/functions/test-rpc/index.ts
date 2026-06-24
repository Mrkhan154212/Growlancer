// Test RPC edge function - calls create_user_profile and returns the result
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

serve(async (req) => {
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    const testId = crypto.randomUUID()
    
    // Test: Call the RPC using service_role key (should definitely work)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('create_user_profile', {
      p_id: testId,
      p_email: `test-rpc-${testId.slice(0,8)}@growlancer.test`,
      p_name: 'Test RPC Debug',
      p_role: 'freelancer',
      p_referral_code: 'GRW-FR-DEBUG',
    })
    
    // Also try to fetch the profiles table directly
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .limit(3)
    
    // Also test using anon key
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    const testId2 = crypto.randomUUID()
    const { data: anonResult, error: anonError } = await supabaseAnon.rpc('create_user_profile', {
      p_id: testId2,
      p_email: `test-anon-${testId2.slice(0,8)}@growlancer.test`,
      p_name: 'Test Anon RPC',
      p_role: 'freelancer',
      p_referral_code: 'GRW-FR-ANON',
    })
    
    return new Response(
      JSON.stringify({
        service_role: {
          success: !rpcError,
          rpcResult,
          rpcError: rpcError ? {
            message: rpcError.message,
            code: (rpcError as any).code,
            details: (rpcError as any).details,
            hint: (rpcError as any).hint,
          } : null,
        },
        profiles_query: {
          success: !profilesError,
          count: profiles?.length ?? 0,
          profilesError: profilesError ? profilesError.message : null,
        },
        anon: {
          success: !anonError,
          anonResult,
          anonError: anonError ? {
            message: anonError.message,
            code: (anonError as any).code,
            details: (anonError as any).details,
          } : null,
        },
        env_check: {
          has_supabase_url: !!SUPABASE_URL,
          has_service_role_key: !!SUPABASE_SERVICE_ROLE_KEY,
          has_anon_key: !!SUPABASE_ANON_KEY,
          url_prefix: SUPABASE_URL.slice(0, 20),
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

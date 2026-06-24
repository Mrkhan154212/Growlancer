// Internship Applications Edge Function
// Handles new internship application submissions
// Sends real email notifications via Resend:
//   1) Admin notification to growlancer.own@gmail.com
//   2) Confirmation email to applicant

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const ADMIN_EMAIL = 'growlancer.own@gmail.com'
const APP_URL = Deno.env.get('APP_URL') ?? 'https://growlancer.vercel.app'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ApplicationData {
  full_name: string
  email: string
  phone?: string
  country?: string
  university?: string
  degree?: string
  graduation_year?: string
  role_id: string
  role_name: string
  linkedin_url?: string
  github_url?: string
  portfolio_url?: string
  resume_url?: string
  resume_file_path?: string
  resume_file_name?: string
  cover_letter: string
  why_growlancer?: string
  weekly_availability?: number
}

async function sendResendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Growlancer <noreply@growlancer.vercel.app>',
        to,
        subject,
        html,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('Resend API error:', res.status, text)
      return false
    }
    return true
  } catch (err) {
    console.error('Resend send error:', err)
    return false
  }
}

function buildAdminEmailHtml(data: ApplicationData): string {const PROJECT_REF = Deno.env.get('SUPABASE_URL')?.replace('https://', '')?.replace('.supabase.co', '') || 'zttwsjehcgaicziqyxpq'
  const resumeLink = data.resume_file_path
    ? `https://${PROJECT_REF}.supabase.co/storage/v1/object/public/internship_resumes/${data.resume_file_path}`
    : data.resume_url || 'Not provided'

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; padding: 40px 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="text-align: center; margin-bottom: 30px;">
      <img src="${APP_URL}/Growlancer%20Logo%20(2).png" alt="Growlancer" style="width: 48px; height: 48px; border-radius: 10px;" />
      <h1 style="font-size: 24px; color: #0f172a; margin: 12px 0 4px;">New Internship Application</h1>
      <p style="color: #64748b; font-size: 14px;">${data.role_name}</p>
    </div>

    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <tr><td style="padding: 8px 0; color: #64748b; width: 140px;">Name</td><td style="padding: 8px 0; font-weight: 600; color: #0f172a;">${data.full_name}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b;">Email</td><td style="padding: 8px 0;"><a href="mailto:${data.email}" style="color: #059669;">${data.email}</a></td></tr>
      <tr><td style="padding: 8px 0; color: #64748b;">Phone</td><td style="padding: 8px 0;">${data.phone || 'Not provided'}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b;">Country</td><td style="padding: 8px 0;">${data.country || 'Not provided'}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b;">University</td><td style="padding: 8px 0;">${data.university || 'Not provided'}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b;">Degree</td><td style="padding: 8px 0;">${data.degree || 'Not provided'}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b;">Graduation Year</td><td style="padding: 8px 0;">${data.graduation_year || 'Not provided'}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b;">GitHub</td><td style="padding: 8px 0;">${data.github_url ? `<a href="${data.github_url}" style="color: #059669;">${data.github_url}</a>` : 'Not provided'}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b;">LinkedIn</td><td style="padding: 8px 0;">${data.linkedin_url ? `<a href="${data.linkedin_url}" style="color: #059669;">${data.linkedin_url}</a>` : 'Not provided'}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b;">Portfolio</td><td style="padding: 8px 0;">${data.portfolio_url ? `<a href="${data.portfolio_url}" style="color: #059669;">${data.portfolio_url}</a>` : 'Not provided'}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b;">Resume</td><td style="padding: 8px 0;"><a href="${resumeLink}" style="color: #059669;">View Resume</a></td></tr>
      <tr><td style="padding: 8px 0; color: #64748b;">Availability</td><td style="padding: 8px 0;">${data.weekly_availability || 'Not specified'} hrs/week</td></tr>
    </table>

    <div style="margin-top: 24px; padding: 16px; background: #f1f5f9; border-radius: 12px;">
      <h3 style="font-size: 13px; color: #64748b; margin: 0 0 8px;">COVER LETTER</h3>
      <p style="font-size: 14px; color: #0f172a; line-height: 1.6; margin: 0;">${data.cover_letter}</p>
    </div>

    ${data.why_growlancer ? `
    <div style="margin-top: 16px; padding: 16px; background: #f1f5f9; border-radius: 12px;">
      <h3 style="font-size: 13px; color: #64748b; margin: 0 0 8px;">WHY GROWLANCER?</h3>
      <p style="font-size: 14px; color: #0f172a; line-height: 1.6; margin: 0;">${data.why_growlancer}</p>
    </div>` : ''}

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
      <a href="${APP_URL}/admin/internships" style="display: inline-block; padding: 12px 32px; background: #059669; color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px;">
        View in Admin Dashboard →
      </a>
    </div>
  </div>
</body>
</html>`
}

function buildApplicantEmailHtml(data: ApplicationData): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; padding: 40px 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="text-align: center; margin-bottom: 30px;">
      <img src="${APP_URL}/Growlancer%20Logo%20(2).png" alt="Growlancer" style="width: 48px; height: 48px; border-radius: 10px;" />
      <h1 style="font-size: 24px; color: #0f172a; margin: 12px 0 4px;">Application Received!</h1>
      <p style="color: #64748b; font-size: 14px;">${data.role_name}</p>
    </div>

    <p style="font-size: 15px; color: #0f172a; line-height: 1.7;">Hi ${data.full_name},</p>
    <p style="font-size: 15px; color: #0f172a; line-height: 1.7;">
      Thank you for applying to the <strong>${data.role_name}</strong> position at Growlancer.
      Your application has been received and is now under review by our team.
    </p>

    <div style="margin: 28px 0; padding: 20px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px;">
      <h3 style="font-size: 14px; color: #166534; margin: 0 0 12px;">What happens next?</h3>
      <table style="font-size: 14px; color: #166534;">
        <tr><td style="padding: 4px 12px 4px 0;">1.</td><td>Application review (3–5 business days)</td></tr>
        <tr><td style="padding: 4px 12px 4px 0;">2.</td><td>Portfolio/GitHub assessment</td></tr>
        <tr><td style="padding: 4px 12px 4px 0;">3.</td><td>Technical interview invitation</td></tr>
        <tr><td style="padding: 4px 12px 4px 0;">4.</td><td>Onboarding & start</td></tr>
      </table>
    </div>

    <p style="font-size: 14px; color: #64748b; line-height: 1.7;">
      If you have any questions in the meantime, feel free to reach out to us at
      <a href="mailto:${ADMIN_EMAIL}" style="color: #059669;">${ADMIN_EMAIL}</a>.
    </p>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px;">
      <p>Growlancer — AI-Powered Freelancing Marketplace</p>
      <p>${APP_URL}</p>
    </div>
  </div>
</body>
</html>`
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' },
        },
      }
    )

    // Rate limiting (30 req/min per IP)
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown'
    try {
      await supabaseClient.rpc('cleanup_expired_rate_limits')
      const { count } = await supabaseClient
        .from('rate_limits')
        .select('*', { count: 'exact', head: true })
        .eq('identifier', `internship:${clientIP}`)
        .gte('window_start', new Date(Date.now() - 60000).toISOString())

      if (count !== null && count >= 30) {
        return new Response(
          JSON.stringify({ error: 'Too many requests' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      await supabaseClient
        .from('rate_limits')
        .insert({ identifier: `internship:${clientIP}`, route: 'internship-applications', count: 1, window_start: new Date().toISOString() })
    } catch {
      // Rate limiting is best-effort
    }

    const { method } = req

    if (method === 'POST') {
      const body = await req.json()
      const {
        full_name, email, phone, country, university, degree, graduation_year,
        role_id, role_name, linkedin_url, github_url, portfolio_url,
        resume_url, resume_file_path, resume_file_name,
        cover_letter, why_growlancer, weekly_availability,
        available_from, available_to,
      } = body

      // Validate required fields
      if (!full_name || !email || !role_id || !role_name || !cover_letter) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: full_name, email, role_id, role_name, cover_letter' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return new Response(
          JSON.stringify({ error: 'Invalid email format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Insert the application
      const { data: application, error: insertError } = await supabaseClient
        .from('internship_applications')
        .insert({
          full_name,
          email,
          phone: phone || null,
          country: country || null,
          university: university || null,
          degree: degree || null,
          graduation_year: graduation_year || null,
          role_id,
          role_name,
          linkedin_url: linkedin_url || null,
          github_url: github_url || null,
          portfolio_url: portfolio_url || null,
          resume_url: resume_url || null,
          resume_file_path: resume_file_path || null,
          resume_file_name: resume_file_name || null,
          cover_letter,
          why_growlancer: why_growlancer || null,
          weekly_availability: weekly_availability || null,
          available_from: available_from || null,
          available_to: available_to || null,
          status: 'applied',
        })
        .select()
        .single()

      if (insertError) {
        console.error('Insert error:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to submit application. Please try again.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // === SEND REAL EMAILS VIA RESEND ===
      const appData: ApplicationData = {
        full_name, email, phone, country, university, degree, graduation_year,
        role_id, role_name, linkedin_url, github_url, portfolio_url,
        resume_url, resume_file_path, resume_file_name,
        cover_letter, why_growlancer, weekly_availability,
      }

      // 1. Send admin notification email
      const adminEmailSent = await sendResendEmail(
        ADMIN_EMAIL,
        `[Growlancer Internship Application] ${role_name} - ${full_name}`,
        buildAdminEmailHtml(appData)
      )

      // 2. Send confirmation email to applicant
      const applicantEmailSent = await sendResendEmail(
        email,
        'Application Received – Growlancer Internship Program',
        buildApplicantEmailHtml(appData)
      )

      console.log(`Emails sent — admin: ${adminEmailSent}, applicant: ${applicantEmailSent}`)

      // Notify all admin users about the new application (in-app notification)
      const { data: admins } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .is('deleted_at', null)

      if (admins && admins.length > 0) {
        const notifications = admins.map(admin => ({
          user_id: admin.id,
          type: 'internship_application',
          title: 'New Internship Application',
          message: `${full_name} applied for ${role_name}`,
          metadata: {
            application_id: application.id,
            role_id,
            role_name,
            applicant_name: full_name,
            applicant_email: email,
          },
          action_url: `/admin/internships/${application.id}`,
        }))

        await supabaseClient
          .from('notifications')
          .insert(notifications)
      }

      return new Response(
        JSON.stringify({
          success: true,
          application_id: application.id,
          emails_sent: { admin: adminEmailSent, applicant: applicantEmailSent },
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'GET') {
      // Only authenticated users with admin role can view applications
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check admin role
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        return new Response(
          JSON.stringify({ error: 'Forbidden' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const url = new URL(req.url)
      const status = url.searchParams.get('status')
      const roleFilter = url.searchParams.get('role_id')
      const search = url.searchParams.get('search')
      const limit = parseInt(url.searchParams.get('limit') || '50')
      const offset = parseInt(url.searchParams.get('offset') || '0')

      let query = supabaseClient
        .from('internship_applications')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (status) {
        query = query.eq('status', status)
      }
      if (roleFilter) {
        query = query.eq('role_id', roleFilter)
      }
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
      }

      // Also get total count
      let countQuery = supabaseClient
        .from('internship_applications')
        .select('*', { count: 'exact', head: true })
      if (status) countQuery = countQuery.eq('status', status)
      if (roleFilter) countQuery = countQuery.eq('role_id', roleFilter)
      const { count } = await countQuery

      const { data: applications, error } = await query
      if (error) throw error

      return new Response(
        JSON.stringify({ applications, total: count || 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'PATCH') {
      // Only admins can update application status
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        return new Response(
          JSON.stringify({ error: 'Forbidden' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const body = await req.json()
      const { application_id, status, notes } = body

      if (!application_id) {
        return new Response(
          JSON.stringify({ error: 'application_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const updateData: Record<string, unknown> = {}
      if (status) updateData.status = status
      if (notes !== undefined) updateData.notes = notes

      const { data: application, error } = await supabaseClient
        .from('internship_applications')
        .update(updateData)
        .eq('id', application_id)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify(application),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Internship applications error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

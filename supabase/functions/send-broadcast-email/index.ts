// Supabase Edge Function: send-broadcast-email
//
// Emails every active team member when an admin posts a company
// announcement via NotificationCenter. Runs server-side because it needs
// the service_role key (to read everyone's email) and the RESEND_API_KEY
// (to actually send), neither of which should ever reach the browser.
//
// Deploy with the Supabase CLI:
//   supabase functions deploy send-broadcast-email
//
// Requires one secret to be set (the user must do this themselves — see
// README note below): RESEND_API_KEY
//   supabase secrets set RESEND_API_KEY=re_xxxxxxxx
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically by
// Supabase for every edge function — no setup needed for those.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Sending address on the Resend-verified subdomain. Update if the
// verified sending domain ever changes.
const FROM_ADDRESS = 'East Coast Mortgage <notifications@mail.ecomortgage.com>';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY is not configured on this project yet.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Confirm the caller is actually an admin before we email the whole company.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: callerProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single();

    if (callerProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Only admins can send company announcements' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { title, message } = await req.json();
    if (!title || !message) {
      return new Response(JSON.stringify({ error: 'title and message are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: recipients, error: recipientsError } = await adminClient
      .from('profiles')
      .select('email')
      .eq('is_active', true)
      .not('email', 'is', null);

    if (recipientsError) {
      return new Response(JSON.stringify({ error: recipientsError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const toEmails = [...new Set((recipients || []).map((r) => r.email).filter(Boolean))];
    if (toEmails.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const html = `
      <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="background: #0f1f3d; padding: 20px 24px; border-radius: 8px 8px 0 0;">
          <span style="color: #d4af37; font-weight: 700; font-size: 15px; letter-spacing: 0.5px;">EAST COAST MORTGAGE</span>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
          <h2 style="margin: 0 0 12px; color: #111827; font-size: 18px;">${escapeHtml(title)}</h2>
          <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(message)}</p>
        </div>
      </div>
    `;

    // Resend caps recipients per call; batching keeps this safe as the
    // roster grows without needing a code change later.
    const BATCH_SIZE = 50;
    let sent = 0;
    for (let i = 0; i < toEmails.length; i += BATCH_SIZE) {
      const batch = toEmails.slice(i, i + BATCH_SIZE);
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: FROM_ADDRESS,
          to: batch,
          subject: title,
          html
        })
      });

      if (!resendResponse.ok) {
        const errText = await resendResponse.text();
        return new Response(JSON.stringify({ error: `Resend error: ${errText}`, sentBeforeError: sent }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      sent += batch.length;
    }

    return new Response(JSON.stringify({ sent }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

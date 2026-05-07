import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: isAdmin } = await admin.rpc('has_role', {
      _user_id: userData.user.id, _role: 'admin',
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Solo administradores' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action, user_id, email, redirect_to } = body ?? {};

    if (action === 'list_emails') {
      const emails: Record<string, string> = {};
      let page = 1;
      while (true) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) throw error;
        for (const u of data.users) emails[u.id] = u.email ?? '';
        if (data.users.length < 1000) break;
        page++;
      }
      return new Response(JSON.stringify({ emails }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'send_recovery_by_id') {
      if (!user_id) throw new Error('user_id requerido');
      const { data: u, error: gErr } = await admin.auth.admin.getUserById(user_id);
      if (gErr || !u.user?.email) throw gErr ?? new Error('Usuario sin email');
      const { error } = await admin.auth.resetPasswordForEmail(u.user.email, { redirectTo: redirect_to });
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, email: u.user.email }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete_user') {
      if (!user_id) throw new Error('user_id requerido');
      // Best-effort cleanup of related rows
      await admin.from('user_roles').delete().eq('user_id', user_id);
      await admin.from('driver_profiles').delete().eq('user_id', user_id);
      await admin.from('mercadopago_accounts').delete().eq('user_id', user_id);
      await admin.from('profiles').delete().eq('id', user_id);
      const { error } = await admin.auth.admin.deleteUser(user_id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'send_recovery') {
      if (!email) throw new Error('email requerido');
      const { error } = await admin.auth.resetPasswordForEmail(email, {
        redirectTo: redirect_to,
      });
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Acción inválida' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const email = 'admin@rodauto.com'
    const password = 'Rodauto2026'

    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'Administrador Rodauto' },
    })

    let userId = created?.user?.id
    if (error && !userId) {
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      userId = list?.users?.find((u) => u.email === email)?.id
      if (!userId) throw error
    }

    await admin.from('user_roles').upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' })
    await admin.from('profiles').upsert(
      { user_id: userId, full_name: 'Administrador Rodauto', email },
      { onConflict: 'user_id' },
    )

    return new Response(JSON.stringify({ ok: true, userId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

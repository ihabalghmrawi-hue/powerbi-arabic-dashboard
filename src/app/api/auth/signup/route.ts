import { NextResponse } from 'next/server'

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req: Request) {
  try {
    const { email, password, company_name } = await req.json()

    if (!email || !password || !company_name) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, { status: 400 })
    }

    // Create user via Admin API — email_confirm:true skips confirmation email
    // This bypasses the rate limit entirely (no email is sent)
    const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,           // confirmed immediately — no email sent
        user_metadata: { company_name: company_name.trim() },
      }),
    })

    const user = await createRes.json()

    if (!createRes.ok) {
      const msg = user.msg ?? user.message ?? 'فشل إنشاء الحساب'
      // Translate common errors to Arabic
      if (msg.toLowerCase().includes('already registered') || msg.includes('already been registered')) {
        return NextResponse.json({ error: 'هذا البريد الإلكتروني مسجّل مسبقاً — جرّب تسجيل الدخول' }, { status: 409 })
      }
      return NextResponse.json({ error: msg }, { status: createRes.status })
    }

    // Try to create company + user_profile (only if schema has been run)
    // Failure here is non-fatal — the trigger handles it otherwise
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

      const { data: company, error: companyErr } = await admin
        .from('companies')
        .insert({ name: company_name.trim() })
        .select('id')
        .single()

      if (!companyErr && company) {
        await admin.from('user_profiles').insert({
          id:         user.id,
          email:      email.toLowerCase(),
          company_id: company.id,
        })
      }
    } catch {
      // Schema not set up yet — that's OK, user can still log in
      // (middleware will redirect them to /setup)
    }

    return NextResponse.json({ success: true, message: 'تم إنشاء الحساب بنجاح — يمكنك تسجيل الدخول الآن' })

  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// Test email notification
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const adminEmail = Deno.env.get('ADMIN_EMAIL')

    if (!resendApiKey || !adminEmail) {
      return new Response(JSON.stringify({ 
        error: 'Missing RESEND_API_KEY or ADMIN_EMAIL environment variables' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Desk Test <onboarding@resend.dev>',
        to: [adminEmail],
        subject: '🧪 Email Notification Test',
        html: `
          <h1>Email Test Successful!</h1>
          <p>Your email notification system is working correctly.</p>
          <p>Time: ${new Date().toISOString()}</p>
          <p>Admin Email: ${adminEmail}</p>
        `,
      }),
    })

    const result = await response.json()
    
    console.log('Resend API Response:', { 
      status: response.status, 
      statusText: response.statusText,
      result 
    })

    if (!response.ok) {
      throw new Error(`Resend API Error: ${result.message || JSON.stringify(result)}`)
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Test email sent successfully',
      emailId: result.id 
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Email test error:', error)
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

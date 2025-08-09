// POST /api/submit-desk - Handles new desk submissions
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Email notification function using Resend
async function sendEmailNotification(formData: any, desk: any) {
  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.log('RESEND_API_KEY not found, skipping email notification')
      return
    }

    const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'admin@yoursite.com'
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
          .detail-row { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
          .label { font-weight: bold; color: #666; }
          .value { margin-left: 10px; }
          .images { margin: 15px 0; }
          .image-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 10px; }
          .image-item img { width: 100%; max-width: 150px; height: 100px; object-fit: cover; border-radius: 4px; border: 2px solid #ddd; }
          .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 5px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🖥️ New Desk Submission</h1>
            <p>A new desk has been submitted for review</p>
          </div>
          
          <div class="content">
            <div class="detail-row">
              <span class="label">Name:</span>
              <span class="value">${formData.name}</span>
            </div>
            
            <div class="detail-row">
              <span class="label">Job Title:</span>
              <span class="value">${formData.title}</span>
            </div>
            
            <div class="detail-row">
              <span class="label">Location:</span>
              <span class="value">${formData.location}</span>
            </div>
            
            <div class="detail-row">
              <span class="label">Submitted:</span>
              <span class="value">${new Date(desk.created_at).toLocaleString()}</span>
            </div>
            
            ${formData.social?.facebook || formData.social?.twitter || formData.social?.linkedin || formData.social?.website ? `
            <div class="detail-row">
              <span class="label">Social Links:</span>
              <div class="value">
                ${formData.social?.facebook ? `<a href="${formData.social.facebook}">Facebook</a> ` : ''}
                ${formData.social?.twitter ? `<a href="${formData.social.twitter}">Twitter</a> ` : ''}
                ${formData.social?.linkedin ? `<a href="${formData.social.linkedin}">LinkedIn</a> ` : ''}
                ${formData.social?.website ? `<a href="${formData.social.website}">Website</a> ` : ''}
              </div>
            </div>
            ` : ''}
            
            <div class="images">
              <div class="label">Profile Image:</div>
              <div class="image-grid">
                <div class="image-item">
                  <img src="${formData.profileImageUrl}" alt="Profile" />
                </div>
              </div>
            </div>
            
            <div class="images">
              <div class="label">Desk Photos (${formData.photoUrls?.length || 0}):</div>
              <div class="image-grid">
                ${formData.photoUrls?.map((url: string, index: number) => `
                  <div class="image-item">
                    <img src="${url}" alt="Desk photo ${index + 1}" />
                  </div>
                `).join('') || ''}
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
              <a href="${Deno.env.get('SITE_URL') || 'http://localhost:5174'}/admin" class="button">
                Review in Admin Dashboard
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p>This is an automated notification from your Desk submission system.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Desk Submissions <onboarding@resend.dev>',
        to: [adminEmail],
        subject: `🖥️ New Desk Submission from ${formData.name}`,
        html: emailHtml,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Email sending failed:', error)
    } else {
      console.log('Email notification sent successfully')
    }
  } catch (error) {
    console.error('Error sending email notification:', error)
    // Don't throw - we don't want email failures to break the submission
  }
}

Deno.serve(async (req) => {
  // Handle CORS for browser requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    })
  }

  try {
    // Parse request body
    const formData = await req.json()

    // Validate required fields
    if (!formData.name || !formData.title || !formData.location || !formData.profileImageUrl) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: name, title, location, profileImageUrl' 
      }), {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      })
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Insert new desk submission
    const { data: desk, error: deskError } = await supabase
      .from('desks')
      .insert({
        name: formData.name,
        title: formData.title,
        location: formData.location,
        profile_image_url: formData.profileImageUrl,
        submitted_photos: formData.photoUrls || [],
        social_facebook: formData.social?.facebook || null,
        social_twitter: formData.social?.twitter || null,
        social_linkedin: formData.social?.linkedin || null,
        social_website: formData.social?.website || null,
        status: 'pending'
      })
      .select()
      .single()

    if (deskError) {
      console.error('Database error:', deskError)
      return new Response(JSON.stringify({ error: deskError.message }), {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      })
    }

    // Create notification record
    const { error: notificationError } = await supabase
      .from('desk_submissions')
      .insert({
        desk_id: desk.id,
        status: 'unread'
      })

    if (notificationError) {
      console.error('Notification error:', notificationError)
      // Don't fail the request if notification fails
    }

    // Send email notification to admin
    await sendEmailNotification(formData, desk)

    return new Response(JSON.stringify({ 
      success: true, 
      deskId: desk.id,
      message: 'Desk submitted successfully! We\'ll review it and get back to you.' 
    }), {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    })
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/submit-desk' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/

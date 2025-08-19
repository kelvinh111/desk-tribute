// GET /api/desks - Returns all approved desks in the same format as desk.json
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  // Handle CORS for browser requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  if (req.method !== 'GET') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    })
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch all approved desks
    const { data: desks, error } = await supabase
      .from('desks')
      .select('*')
      .eq('status', 'approved')
      .order('approved_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      })
    }

    // Transform to match your current desk.json structure
    const transformedDesks = desks.map(desk => ({
      id: desk.id,
      name: desk.name,
      title: desk.title,
      location: desk.location,
      profile: desk.profile_image_url,
      decor: desk.decor_svg_url || "/src/assets/decor.svg",
      monitor: desk.monitor_config || {
        width: "37.54%",
        height: "21.82%",
        x: "20.70%",
        y: "61.82%",
        img: "/src/assets/monitor.svg"
      },
      screen: desk.screen_config || {
        width: "25.26%",
        height: "16.36%",
        x: "27.02%",
        y: "63.27%",
        firstPhoto: desk.submitted_photos?.[0] || "/src/assets/800x400.jpg"
      },
      photos: desk.submitted_photos || [],
      social: {
        facebook: desk.social_facebook || null,
        twitter: desk.social_twitter || null,
        linkedin: desk.social_linkedin || null,
        website: desk.social_website || null
      },
      slug: desk.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    }))

    return new Response(JSON.stringify(transformedDesks), {
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

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/get-desks' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/

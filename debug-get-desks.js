// Temporary debug script to test desk data structure
// Run with: node debug-get-desks.js

const fetch = require('node-fetch');

const API_URL = 'https://uedlyafexdgfdqkjkygr.supabase.co/rest/v1/desks?select=*';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlZGx5YWZleGRnZmRxa2preWdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzYzNTcsImV4cCI6MjA3MDA1MjM1N30.7d0_E1JmTKt1CLKIhoPR92rP8ncx7xTsluVSljMGD5E';

async function testAPI() {
    try {
        const response = await fetch(API_URL, {
            headers: {
                'Authorization': `Bearer ${ANON_KEY}`,
                'apikey': ANON_KEY,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();
        console.log('Raw desk data:', JSON.stringify(data, null, 2));

        // Transform to match your expected format
        const transformed = data.map(desk => ({
            id: desk.id,
            name: desk.name,
            title: desk.title,
            location: desk.location,
            profile: desk.profile_image_url,
            decor: desk.decor_svg_url || '/src/assets/decor.svg',
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
                firstPhoto: desk.submitted_photos?.[0] || null
            },
            photos: desk.submitted_photos || [],
            social: {
                facebook: desk.social_facebook,
                twitter: desk.social_twitter,
                linkedin: desk.social_linkedin,
                website: desk.social_website
            },
            slug: desk.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            status: desk.status
        }));

        console.log('\nTransformed data:', JSON.stringify(transformed, null, 2));

    } catch (error) {
        console.error('Error:', error);
    }
}

testAPI();

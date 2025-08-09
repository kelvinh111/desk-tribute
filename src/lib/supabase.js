import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uedlyafexdgfdqkjkygr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlZGx5YWZleGRnZmRxa2preWdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzYzNTcsImV4cCI6MjA3MDA1MjM1N30.7d0_E1JmTKt1CLKIhoPR92rP8ncx7xTsluVSljMGD5E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

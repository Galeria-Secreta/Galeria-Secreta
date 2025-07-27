// src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mkjqmncjslygtzwmztlh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ranFtbmNqc2x5Z3R6d216dGxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NDY3NDcsImV4cCI6MjA2OTAyMjc0N30.SzrpwfP45UgydAcWOuW0cH-hLhT2v70McIDhdJNjxog'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vksssixwshzalxmlvcme.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrc3NzaXh3c2h6YWx4bWx2Y21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMzA3NzYsImV4cCI6MjA3NzgwNjc3Nn0.GE4lq49f1fR5ApvbuH9b3Ks8oMGSrUkgGSCe04hXlK8'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

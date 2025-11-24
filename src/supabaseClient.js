import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'SUPABASE_URL_HERE'
const SUPABASE_ANON_KEY = 'SUPABASE_ANON_KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

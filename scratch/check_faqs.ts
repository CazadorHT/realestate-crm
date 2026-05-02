
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkFAQs() {
  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(JSON.stringify(data, null, 2))
}

checkFAQs()

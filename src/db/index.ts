import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = 'https://jeyzgwyiukeytlpzmitk.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
if(!supabaseKey) throw new Error('No se ha especificado la variable SUPABASE_KEY');
export const supabaseInstance = createClient<Database>(supabaseUrl, supabaseKey!);

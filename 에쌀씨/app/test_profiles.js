const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
const envData = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envData.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) envVars[key.trim()] = val.join('=').trim().replace(/^"|"$/g, '');
});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('profiles').select('nickname, created_at, role').limit(5);
  console.log('Profiles:', data);
}

check();

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
for (const line of envFile.split('\n')) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
}

const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.from('profiles').select('id, nickname').eq('is_active', true);
  if (error) console.error(error);
  else {
    fs.writeFileSync('profiles.json', JSON.stringify(data, null, 2));
    console.log('Fetched profiles:', data.length);
  }
}
run();

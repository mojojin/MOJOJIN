const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://rfhbdwfmreamudgfafxc.supabase.co', 'sb_publishable_0yWY2n5ye0W5eDmrlE2eRA_Yfe7H0b1');
supabase.auth.signInWithOAuth({ provider: 'kakao', options: { redirectTo: 'https://mojojin.vercel.app/auth/callback' } })
  .then(res => console.log('Response:', res))
  .catch(err => console.error('Error:', err));

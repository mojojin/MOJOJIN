import fs from 'fs'

const files = fs.readdirSync('.').filter(f => f.endsWith('.json') || f.endsWith('.sql') || f.endsWith('.js') || f.endsWith('.mjs'))
console.log('Files:', files)
if (fs.existsSync('profiles.json')) {
  const p = JSON.parse(fs.readFileSync('profiles.json', 'utf8'))
  console.log('Profiles in profiles.json:', p.length)
}

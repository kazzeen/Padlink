const fs = require('fs')
const path = require('path')
const axios = require('axios')

function parseEnv(filePath) {
  const out = {}
  if (!fs.existsSync(filePath)) return out
  const content = fs.readFileSync(filePath, 'utf8')
  content.split('\n').forEach((line) => {
    const m = line.match(/^([^=]+)=(.*)$/)
    if (m) {
      const key = m[1].trim()
      const value = m[2].trim().replace(/^"(.*)"$/, '$1')
      out[key] = value
    }
  })
  return out
}

function mask(value) {
  return value ? '***' : 'Missing'
}

async function run() {
  const envPath = path.join(__dirname, '..', '.env')
  const env = parseEnv(envPath)

  const token = process.env.VERCEL_TOKEN || env.VERCEL_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID || env.VERCEL_PROJECT_ID

  if (!token || !projectId) {
    console.error('Missing Vercel credentials: VERCEL_TOKEN and VERCEL_PROJECT_ID')
    process.exit(1)
  }

  const toPush = [
    { key: 'NEXT_PUBLIC_PRIVY_APP_ID', value: env.NEXT_PUBLIC_PRIVY_APP_ID, type: 'plain', target: ['production', 'preview'] },
    { key: 'PRIVY_APP_SECRET', value: env.PRIVY_APP_SECRET, type: 'encrypted', target: ['production', 'preview'] },
    { key: 'NEXTAUTH_SECRET', value: env.NEXTAUTH_SECRET, type: 'encrypted', target: ['production', 'preview'] },
    { key: 'DATABASE_URL', value: env.DATABASE_URL, type: 'encrypted', target: ['production', 'preview'] },
  ].filter((v) => !!v.value)

  const api = axios.create({
    baseURL: 'https://api.vercel.com',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })

  const existing = await api.get(`/v10/projects/${projectId}/env`).then((r) => r.data)

  for (const v of toPush) {
    const found = existing.envs.find((e) => e.key === v.key)
    try {
      if (!found) {
        await api.post(`/v10/projects/${projectId}/env`, {
          key: v.key,
          value: v.value,
          type: v.type,
          target: v.target,
        })
        console.log(`Set ${v.key}: ${mask(v.value)}`)
      } else {
        await api.patch(`/v10/projects/${projectId}/env/${found.id}`, {
          value: v.value,
          target: v.target,
          type: v.type,
        })
        console.log(`Updated ${v.key}: ${mask(v.value)}`)
      }
    } catch (err) {
      console.error(`Failed to push ${v.key}:`, err.response?.data || err.message)
      process.exitCode = 1
    }
  }
}

run()

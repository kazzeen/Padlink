const { PrivyClient } = require('@privy-io/server-auth');
const fs = require('fs');
const path = require('path');

// Load .env manually
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^"(.*)"$/, '$1');
      process.env[key] = value;
    }
  });
}

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const appSecret = process.env.PRIVY_APP_SECRET;

console.log('Checking Privy Credentials...');
console.log('App ID:', appId);
console.log('App Secret:', appSecret ? '***' : 'Missing');

if (!appId || !appSecret) {
  console.error('❌ Missing credentials in environment');
  process.exit(1);
}

const privy = new PrivyClient(appId, appSecret);

async function verify() {
  try {
    console.log('Attempting to authenticate with Privy API...');
    const user = await privy.getUserByEmail('test@example.com');
    console.log('✅ API Authentication Successful');
    console.log('User lookup result:', user ? 'Found' : 'Not Found (Expected)');
    
    console.log('\n--- DIAGNOSIS ---');
    console.log('✅ App ID and Secret are valid.');
    console.log('ℹ️  If you see "Login with Google/Twitter not allowed" in the browser:');
    console.log('   1. Go to https://dashboard.privy.io/');
    console.log('   2. Select App ID: ' + appId);
    console.log('   3. Navigate to "Login Methods"');
    console.log('   4. Enable "Google" and "Twitter"');
    
  } catch (error) {
    console.error('❌ API Authentication Failed:', error.message);
    if (error.status === 401) {
      console.error('Reason: Invalid App ID or Secret.');
    }
    process.exit(1);
  }
}

verify();

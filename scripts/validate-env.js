/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

console.log('Starting Auth Configuration Verification...');

// 1. Check .env file existence
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  process.exit(1);
}
console.log('✅ .env file found');

// 2. Read .env and check variables
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^"(.*)"$/, '$1');
    envVars[key] = value;
  }
});

const requiredVars = [
  'NEXT_PUBLIC_PRIVY_APP_ID',
  'PRIVY_APP_SECRET',
  'DATABASE_URL',
  'NEXTAUTH_SECRET'
];

let missingVars = false;
requiredVars.forEach(key => {
  if (!envVars[key]) {
    console.error(`❌ Missing environment variable: ${key}`);
    missingVars = true;
  } else {
    console.log(`✅ ${key} is present`);
  }
});

if (missingVars) {
  console.error('Auth configuration verification FAILED');
  process.exit(1);
}

// 3. Check Privy App ID format
if (!envVars['NEXT_PUBLIC_PRIVY_APP_ID'].startsWith('cm')) {
    console.warn('⚠️ NEXT_PUBLIC_PRIVY_APP_ID does not start with "cm". This might be invalid.');
}

console.log('\nConfiguration verification PASSED');

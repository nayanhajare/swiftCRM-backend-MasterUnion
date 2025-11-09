#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupEnv() {
  console.log('🚀 SwiftCRM Backend Environment Setup\n');
  console.log('This script will help you create a .env file with the required configuration.\n');

  const envPath = path.join(__dirname, '.env');
  const examplePath = path.join(__dirname, '.env.example');

  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    const overwrite = await question('⚠️  .env file already exists. Overwrite? (y/n): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('❌ Setup cancelled.');
      rl.close();
      return;
    }
  }

  // Read .env.example if it exists
  let envTemplate = '';
  if (fs.existsSync(examplePath)) {
    envTemplate = fs.readFileSync(examplePath, 'utf8');
  } else {
    // Default template
    envTemplate = `# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=swiftcrm
DB_USER=postgres
DB_PASSWORD=7000

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Email Configuration (Optional)
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=

# Frontend URL
FRONTEND_URL=http://localhost:3000
`;
  }

  console.log('\n📝 Database Configuration:');
  const dbHost = await question(`Database Host [localhost]: `) || 'localhost';
  const dbPort = await question(`Database Port [5432]: `) || '5432';
  const dbName = await question(`Database Name [swiftcrm]: `) || 'swiftcrm';
  const dbUser = await question(`Database User [postgres]: `) || 'postgres';
  const dbPassword = await question(`Database Password (required): `);

  if (!dbPassword) {
    console.log('⚠️  Warning: Database password is empty. This may cause connection issues.');
    const continueEmpty = await question('Continue anyway? (y/n): ');
    if (continueEmpty.toLowerCase() !== 'y') {
      console.log('❌ Setup cancelled. Password is required.');
      rl.close();
      return;
    }
  }

  console.log('\n🔐 JWT Configuration:');
  const jwtSecret = await question(`JWT Secret [random string will be generated]: `) || 
    Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  console.log('\n📧 Email Configuration (Optional - press Enter to skip):');
  const emailHost = await question(`Email Host [smtp.gmail.com]: `) || '';
  const emailPort = await question(`Email Port [587]: `) || '';
  const emailUser = await question(`Email User: `) || '';
  const emailPass = await question(`Email Password: `) || '';

  // Replace values in template
  let envContent = envTemplate
    .replace(/DB_HOST=.*/g, `DB_HOST=${dbHost}`)
    .replace(/DB_PORT=.*/g, `DB_PORT=${dbPort}`)
    .replace(/DB_NAME=.*/g, `DB_NAME=${dbName}`)
    .replace(/DB_USER=.*/g, `DB_USER=${dbUser}`)
    .replace(/DB_PASSWORD=.*/g, `DB_PASSWORD=${dbPassword}`)
    .replace(/JWT_SECRET=.*/g, `JWT_SECRET=${jwtSecret}`);

  if (emailHost) {
    envContent = envContent
      .replace(/EMAIL_HOST=.*/g, `EMAIL_HOST=${emailHost}`)
      .replace(/EMAIL_PORT=.*/g, `EMAIL_PORT=${emailPort || '587'}`)
      .replace(/EMAIL_USER=.*/g, `EMAIL_USER=${emailUser}`)
      .replace(/EMAIL_PASS=.*/g, `EMAIL_PASS=${emailPass}`);
  }

  // Write .env file
  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ .env file created successfully!');
  console.log(`📁 Location: ${envPath}\n`);

  console.log('📋 Next steps:');
  console.log('   1. Verify your PostgreSQL database is running');
  console.log('   2. Make sure the database exists: CREATE DATABASE swiftcrm;');
  console.log('   3. Start the server: npm run dev\n');

  rl.close();
}

setupEnv().catch((error) => {
  console.error('❌ Error:', error.message);
  rl.close();
  process.exit(1);
});


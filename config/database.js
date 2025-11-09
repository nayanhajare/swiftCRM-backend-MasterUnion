const { Sequelize } = require('sequelize');
require('dotenv').config();

// Support for DATABASE_URL (used by Heroku, Railway, etc.)
let sequelize;

if (process.env.DATABASE_URL) {
  // Use DATABASE_URL if provided (for platforms like Heroku, Railway)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: process.env.DATABASE_URL.includes('sslmode=require') ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  // Use individual environment variables
  // Validate required environment variables
  const requiredEnvVars = ['DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n📝 Please create a .env file in the backend directory with the required variables.');
    console.error('   You can copy .env.example to .env and update the values.');
    process.exit(1);
  }

  // Ensure password is a string (handle empty strings)
  const dbPassword = process.env.DB_PASSWORD || '';
  if (!dbPassword) {
    console.warn('⚠️  Warning: DB_PASSWORD is empty. This might cause connection issues.');
  }

  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    String(process.env.DB_PASSWORD), // Explicitly convert to string
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      retry: {
        max: 3
      },
      dialectOptions: {
        // For older PostgreSQL versions or specific connection issues
        connectTimeout: 60000,
        // SSL for production databases
        ssl: process.env.DB_SSL === 'true' ? {
          require: true,
          rejectUnauthorized: false
        } : false
      }
    }
  );
}

// Note: Connection is tested in server.js
// This export is ready for use

module.exports = { sequelize };


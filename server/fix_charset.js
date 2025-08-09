const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixCharset() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.MYSQL_USER || 'migration_user',
      password: process.env.MYSQL_PASSWORD || 'migration_pass',
      database: process.env.MYSQL_DATABASE || 'mydatabase',
      charset: 'utf8mb4'
    });

    console.log('🔧 Starting charset fix process...\n');

    // 1. Set database default charset
    console.log('📝 Setting database default charset to utf8mb4...');
    await connection.execute(`
      ALTER DATABASE ${process.env.MYSQL_DATABASE || 'mydatabase'} 
      CHARACTER SET utf8mb4 
      COLLATE utf8mb4_unicode_ci
    `);
    console.log('✅ Database charset updated\n');

    // 2. Get all tables that need charset fix
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME, TABLE_COLLATION 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_TYPE = 'BASE TABLE'
      AND TABLE_COLLATION NOT LIKE 'utf8mb4%'
    `, [process.env.MYSQL_DATABASE || 'mydatabase']);

    console.log(`📋 Found ${tables.length} tables to fix:`);
    tables.forEach(table => {
      console.log(`  - ${table.TABLE_NAME}: ${table.TABLE_COLLATION}`);
    });
    console.log('');

    // 3. Fix each table
    for (const table of tables) {
      console.log(`🔧 Fixing table: ${table.TABLE_NAME}`);
      
      try {
        // Convert table charset
        await connection.execute(`
          ALTER TABLE ${table.TABLE_NAME} 
          CONVERT TO CHARACTER SET utf8mb4 
          COLLATE utf8mb4_unicode_ci
        `);
        console.log(`✅ ${table.TABLE_NAME} converted successfully`);
      } catch (error) {
        console.log(`❌ Error converting ${table.TABLE_NAME}: ${error.message}`);
      }
    }

    console.log('\n🔍 Checking results...');
    
    // 4. Verify the fix
    const [updatedTables] = await connection.execute(`
      SELECT TABLE_NAME, TABLE_COLLATION 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `, [process.env.MYSQL_DATABASE || 'mydatabase']);

    console.log('\n📊 Updated table charsets:');
    updatedTables.forEach(table => {
      const status = table.TABLE_COLLATION.includes('utf8mb4') ? '✅' : '❌';
      console.log(`  ${status} ${table.TABLE_NAME}: ${table.TABLE_COLLATION}`);
    });

    // 5. Test Turkish characters
    console.log('\n🧪 Testing Turkish characters...');
    const [testUsers] = await connection.execute('SELECT ID, NAME, EMAIL FROM USER LIMIT 5');
    testUsers.forEach(user => {
      console.log(`  ID: ${user.ID}, Name: ${user.NAME}, Email: ${user.EMAIL}`);
    });

    console.log('\n🎉 Charset fix completed!');

  } catch (error) {
    console.error('❌ Error during charset fix:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the fix
fixCharset();
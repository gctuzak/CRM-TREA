const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkCharset() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'crmuser',
      password: process.env.DB_PASSWORD || 'crmpassword',
      database: process.env.DB_NAME || 'mydatabase'
    });

    console.log('🔍 Checking database charset settings...\n');

    // Check server charset variables
    const [charsetVars] = await connection.execute("SHOW VARIABLES LIKE 'character_set%'");
    console.log('📊 Character Set Variables:');
    charsetVars.forEach(row => {
      console.log(`  ${row.Variable_name}: ${row.Value}`);
    });

    console.log('\n📊 Collation Variables:');
    const [collationVars] = await connection.execute("SHOW VARIABLES LIKE 'collation%'");
    collationVars.forEach(row => {
      console.log(`  ${row.Variable_name}: ${row.Value}`);
    });

    console.log('\n📋 Database Schema:');
    const [dbInfo] = await connection.execute(`
      SELECT SCHEMA_NAME, DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME 
      FROM information_schema.SCHEMATA 
      WHERE SCHEMA_NAME = ?
    `, [process.env.MYSQL_DATABASE || 'mydatabase']);
    
    if (dbInfo.length > 0) {
      console.log(`  Database: ${dbInfo[0].SCHEMA_NAME}`);
      console.log(`  Charset: ${dbInfo[0].DEFAULT_CHARACTER_SET_NAME}`);
      console.log(`  Collation: ${dbInfo[0].DEFAULT_COLLATION_NAME}`);
    }

    console.log('\n📋 Table Charsets:');
    const [tableInfo] = await connection.execute(`
      SELECT TABLE_NAME, TABLE_COLLATION 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
    `, [process.env.MYSQL_DATABASE || 'mydatabase']);
    
    tableInfo.forEach(table => {
      console.log(`  ${table.TABLE_NAME}: ${table.TABLE_COLLATION}`);
    });

    console.log('\n🔍 Sample data with Turkish characters:');
    const [users] = await connection.execute('SELECT ID, NAME, EMAIL FROM USER LIMIT 5');
    users.forEach(user => {
      console.log(`  ID: ${user.ID}, Name: ${user.NAME}, Email: ${user.EMAIL}`);
    });

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkCharset();
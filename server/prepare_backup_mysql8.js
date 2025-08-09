const fs = require('fs');
const path = require('path');

if (process.argv.length < 4) {
  console.error('Usage: node prepare_backup_mysql8.js <input_sql> <output_sql>');
  process.exit(1);
}

const inputPath = path.resolve(process.argv[2]);
const outputPath = path.resolve(process.argv[3]);

try {
  let sql = fs.readFileSync(inputPath, 'utf8');

  // Disable strict checks during import to reduce errors
  const prologue = [
    'SET FOREIGN_KEY_CHECKS=0;',
    'SET UNIQUE_CHECKS=0;',
    "SET sql_mode='';",
  ].join('\n');

  // 1) Fix composite primary keys where AUTO_INCREMENT column is not first
  // Common pattern in this dump: PRIMARY KEY (`ORID`,`ID`)
  sql = sql.replace(/PRIMARY KEY\s*\(\s*`ORID`\s*,\s*`ID`\s*\)/g, 'PRIMARY KEY (`ID`,`ORID`)');
  sql = sql.replace(/PRIMARY KEY\s*\(\s*`ORID`\s*,\s*`PKID`\s*\)/g, 'PRIMARY KEY (`PKID`,`ORID`)');

  // 2) Remove index prefix lengths that cause errors on non-string cols or excessive length
  // Example: KEY `PRODUCTID` (`PRODUCTID`(333)) -> KEY `PRODUCTID` (`PRODUCTID`)
  sql = sql.replace(/KEY\s+`([^`]+)`\s*\(\s*`([^`]+)`\s*\(\d+\)\s*\)/g, 'KEY `$1` (`$2`)');

  // 3) Ensure AUTO_INCREMENT column is a key (it is after step 1) – no-op otherwise

  // 4) Append epilogue to re-enable checks
  const epilogue = [
    'SET UNIQUE_CHECKS=1;',
    'SET FOREIGN_KEY_CHECKS=1;',
  ].join('\n');

  const finalSql = `${prologue}\n${sql}\n${epilogue}\n`;
  fs.writeFileSync(outputPath, finalSql, 'utf8');
  console.log(`Prepared SQL written to: ${outputPath}`);
} catch (err) {
  console.error('Failed to prepare SQL:', err.message);
  process.exit(1);
}



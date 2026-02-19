const fs = require('fs');
const path = require('path');

function log(msg) {
  try {
    fs.appendFileSync(path.join(__dirname, 'debug_log.txt'), msg + '\n');
    console.log(msg);
  } catch (e) {}
}

try {
  const logPath = path.join(__dirname, 'debug_log.txt');
  fs.writeFileSync(logPath, 'Starting script...\n');
  
  const pyPath = path.join(__dirname, 'generate_restore_sql.py');
  log(`Reading file from ${pyPath}...`);
  const pyContent = fs.readFileSync(pyPath, 'utf8');
  log(`File read, length: ${pyContent.length}`);
  
  const lines = pyContent.split('\n');
  if (lines.length < 5) {
    log('File too short');
    process.exit(1);
  }
  
  // Line 4 is index 3
  const jsonLine = lines[3];
  log(`JSON line length: ${jsonLine.length}`);
  
  let jsonStr = jsonLine.trim();
  
  log('Parsing JSON...');
  let data;
  try {
      data = JSON.parse(jsonStr);
  } catch (e) {
      log(`JSON Parse Error: ${e.message}`);
      process.exit(1);
  }
  
  log(`JSON Parsed. Tables: ${data.length}`);
  
  let sqlOutput = '';
  
  data.forEach(tableData => {
    const table = tableData.tbl;
    const rows = tableData.data;
    log(`Processing table ${table}, rows: ${rows.length}`);
    
    sqlOutput += `-- Table: ${table}\n`;
    sqlOutput += `INSERT INTO public.${table} (\n`;
    
    if (rows.length === 0) return;
    
    const columns = Object.keys(rows[0]);
    sqlOutput += `  ${columns.join(', ')}\n`;
    sqlOutput += `) VALUES\n`;
    
    const valuesList = rows.map(row => {
      const vals = columns.map(col => {
        const val = row[col];
        if (val === null) return 'NULL';
        if (typeof val === 'number') return val;
        // Escape single quotes
        const safeVal = String(val).replace(/'/g, "''");
        return `'${safeVal}'`;
      });
      return `  (${vals.join(', ')})`;
    });
    
    sqlOutput += valuesList.join(',\n');
    sqlOutput += `\n`;
    
    // Generate ON CONFLICT DO UPDATE
    const updateParts = columns
      .filter(col => col !== 'id')
      .map(col => `${col} = EXCLUDED.${col}`);
      
    sqlOutput += `ON CONFLICT (id) DO UPDATE SET\n`;
    sqlOutput += `  ${updateParts.join(', ')};\n\n`;
  });
  
  log(`Generated SQL length: ${sqlOutput.length}`);
  
  const outPath = path.join(__dirname, 'restore_data.sql');
  log(`Writing to ${outPath}...`);
  fs.writeFileSync(outPath, sqlOutput);
  log('Successfully generated restore_data.sql');
  
} catch (error) {
  log(`General Error: ${error.message}`);
  process.exit(1);
}

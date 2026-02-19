
const fs = require('fs');

function log(msg) {
    fs.appendFileSync('debug.log', msg + '\n');
}

try {
    log('Starting script');
    const content = fs.readFileSync('insert_reservations_safe.sql', 'utf8');
    log('Read file, length: ' + content.length);

    // Extract the DO block (everything before INSERT)
    const doBlockMatch = content.match(/([\s\S]*?)INSERT INTO/);
    const doBlock = doBlockMatch ? doBlockMatch[1] : '';
    log('Do block length: ' + doBlock.length);

    // Extract columns
    const insertMatch = content.match(/INSERT INTO public\.reservations \(([\s\S]*?)\) VALUES([\s\S]*?)ON CONFLICT/);
    if (!insertMatch) {
        log("Could not find INSERT statement");
        process.exit(1);
    }
    log('Found INSERT statement');

    const columns = insertMatch[1].trim();
    const valuesBlock = insertMatch[2];
    log('Values block length: ' + valuesBlock.length);

    // Split values into rows
    const rows = [];
    let currentRow = '';
    let openParens = 0;
    let inString = false;
    let escape = false;

    for (let i = 0; i < valuesBlock.length; i++) {
        const char = valuesBlock[i];
        
        if (escape) {
            escape = false;
            currentRow += char;
            continue;
        }
        
        if (char === '\\') {
            escape = true;
            currentRow += char;
            continue;
        }
        
        if (char === "'" && !escape) {
            inString = !inString;
        }
        
        if (!inString) {
            if (char === '(') openParens++;
            if (char === ')') openParens--;
            
            if (char === ',' && openParens === 0) {
                if (currentRow.trim()) {
                    rows.push(currentRow.trim());
                }
                currentRow = '';
                continue;
            }
        }
        
        currentRow += char;
    }
    if (currentRow.trim()) rows.push(currentRow.trim());
    log('Rows found: ' + rows.length);

    // Create output content
    let output = doBlock + '\n';

    rows.forEach(row => {
        // Clean the row (remove leading/trailing whitespace/comma if any)
        let cleanRow = row.trim();
        if (cleanRow.endsWith(',')) cleanRow = cleanRow.slice(0, -1);
        
        output += `INSERT INTO public.reservations (${columns}) VALUES ${cleanRow} ON CONFLICT (id) DO NOTHING;\n`;
    });

    fs.writeFileSync('insert_reservations_v2.sql', output);
    log(`Converted ${rows.length} rows to individual insert statements.`);
} catch (e) {
    log('Error: ' + e.message);
    log(e.stack);
}

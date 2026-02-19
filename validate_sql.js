
const fs = require('fs');
const content = fs.readFileSync('insert_reservations_safe.sql', 'utf8');

// Extract the INSERT statement
const insertMatch = content.match(/INSERT INTO public\.reservations \(([\s\S]*?)\) VALUES([\s\S]*?)ON CONFLICT/);
if (!insertMatch) {
    console.log("Could not find INSERT statement");
    process.exit(1);
}

const columnsBlock = insertMatch[1];
const valuesBlock = insertMatch[2];

// Count columns
const columns = columnsBlock.split(',').map(c => c.trim()).filter(c => c);
const columnCount = columns.length;
console.log(`Expected column count: ${columnCount}`);

// Split values into rows
// Simple split by ")," might fail if ")," is inside a string, but unlikely for this data.
// A better way is to iterate and count parens.
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
            // End of a row (if we are between rows)
            // But usually rows are separated by "),\n("
            // The structure is (val), (val)
            // So a comma with openParens==0 is a row separator
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

// Validate each row
rows.forEach((row, index) => {
    // Remove leading '(' and trailing ')' if present (due to split logic)
    // Actually my split logic keeps the parens except the comma.
    // Row might look like: " (val...)"
    
    let cleanRow = row.trim();
    if (cleanRow.startsWith('(')) cleanRow = cleanRow.substring(1);
    if (cleanRow.endsWith(')')) cleanRow = cleanRow.substring(0, cleanRow.length - 1);
    
    // Count values
    // Split by comma, respecting quotes and parens (for arrays)
    let valCount = 0;
    let p = 0;
    let s = false;
    let esc = false;
    
    for (let i = 0; i < cleanRow.length; i++) {
        const c = cleanRow[i];
        if (esc) { esc = false; continue; }
        if (c === '\\') { esc = true; continue; }
        if (c === "'") { s = !s; }
        if (!s) {
            if (c === '(' || c === '[') p++;
            if (c === ')' || c === ']') p--;
            if (c === ',' && p === 0) valCount++;
        }
    }
    valCount++; // The last value
    
    if (valCount !== columnCount) {
        fs.appendFileSync('validation_result.txt', `Row ${index + 1} has ${valCount} values (expected ${columnCount})\nRow content: ${cleanRow}\n`);
    }
});
fs.appendFileSync('validation_result.txt', 'Validation complete.\n');

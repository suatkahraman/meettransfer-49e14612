const fs = require('fs');
const path = require('path');

const files = [
    'insert_more_payments.sql',
    'insert_additional_payments.sql',
    'insert_payments_batch_2.sql',
    'insert_payments_batch_3.sql'
];

let combinedContent = '';

files.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`Adding ${file}...`);
        const content = fs.readFileSync(file, 'utf8');
        combinedContent += `-- Start of ${file}\n`;
        combinedContent += content;
        combinedContent += `\n-- End of ${file}\n\n`;
    } else {
        console.log(`Warning: ${file} not found.`);
    }
});

fs.writeFileSync('insert_all_payments.sql', combinedContent);
console.log('insert_all_payments.sql has been created successfully.');

const XLSX = require('xlsx');

console.log('Loading Excel file...');
const wb = XLSX.readFile('public/tenderned_data.xlsx', { type: 'file' });

console.log('Sheet names:', wb.SheetNames);
console.log('Number of sheets:', wb.SheetNames.length);

// Try each sheet
for (let i = 0; i < wb.SheetNames.length; i++) {
    const name = wb.SheetNames[i];
    console.log('\n--- Sheet ' + i + ': "' + name + '" ---');

    const sheet = wb.Sheets[name];
    if (!sheet) {
        console.log('  Sheet is undefined!');
        continue;
    }

    const ref = sheet['!ref'];
    console.log('  Range:', ref || 'no range');

    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    console.log('  Rows (raw):', data.length);

    if (data.length > 0 && data[0]) {
        console.log('  Header row:', data[0].slice(0, 10));
    }
    if (data.length > 1 && data[1]) {
        console.log('  First data row:', data[1].slice(0, 5));
    }
}

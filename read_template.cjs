const XLSX = require('xlsx');
const path = 'C:/Users/anton/OneDrive - 940799200 NISBET INVESTMENT CORP/Multi-Family - General/Multi-Family/Template Folder/Template Excel Costing.xlsx';

try {
  const workbook = XLSX.readFile(path);
  console.log('Sheet names:', workbook.SheetNames);

  workbook.SheetNames.forEach(name => {
    const sheet = workbook.Sheets[name];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    console.log('\n=== Sheet:', name, '===');
    // Show first 25 rows
    data.slice(0, 25).forEach((row, i) => {
      const filtered = row.filter(cell => cell !== '');
      if (filtered.length > 0) {
        console.log('Row', i+1, ':', filtered.slice(0, 8).join(' | '));
      }
    });
  });
} catch(e) {
  console.error('Error:', e.message);
}

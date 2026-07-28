const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'نتيجة ثانوية عامة نظام حديث.xlsx');
console.log('Loading Excel file:', filePath);

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
console.log('Header row:', data[0]);
console.log('Total rows:', data.length);
console.log('Sample row 1:', data[1]);
console.log('Sample row 2:', data[2]);

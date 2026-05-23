const fs = require('fs');

const file = 'src/pages/AdminDashboard.tsx';
let txt = fs.readFileSync(file, 'utf8');

const regex = /React\.useEffect\(\(\) => \{\s*const unsubNews = onSnapshot\([\s\S]*?unsubBankData\(\);\s*\};\s*\}, \[\]\);/;

if(regex.test(txt)) {
  console.log("Matched!");
} else {
  console.log("Not matched");
}

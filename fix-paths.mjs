import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if(fs.statSync(dirPath).isDirectory()) walk(dirPath, callback);
    else callback(dirPath);
  });
}

walk('src', (filePath) => {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;
    
    content = content.replace(/['"]@\/lib\/supabase-adapter['"]/g, "'@/src/lib/supabase-adapter'");
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`Updated path in ${filePath}`);
    }
  }
});

import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

const targetDir = 'src';

walk(targetDir, (filePath) => {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Replace 'firebase/firestore' imports with '@/lib/supabase-adapter'
    let originalContent = content;
    content = content.replace(/from\s+['"]firebase\/firestore['"]/g, "from '@/lib/supabase-adapter'");
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`Migrated ${filePath}`);
    }
  }
});

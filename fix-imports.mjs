import fs from 'fs';
import path from 'path';

function traverseAndReplace(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverseAndReplace(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;

      // Replace supabase-adapter imports with firebase/firestore
      content = content.replace(/from\s+['"]@\/src\/lib\/supabase-adapter['"]/g, "from 'firebase/firestore'");
      content = content.replace(/from\s+['"]\.\.\/lib\/supabase-adapter['"]/g, "from 'firebase/firestore'");
      content = content.replace(/from\s+['"]\.\.\/\.\.\/lib\/supabase-adapter['"]/g, "from 'firebase/firestore'");
      content = content.replace(/import\s*\*\s*as\s+firestoreAdapter\s+from\s+['"]\.\/supabase-adapter['"]/g, "");

      // Replace db/auth imports
      content = content.replace(/from\s+['"]\.\.\/lib\/db['"]/g, "from '../lib/firebase'");
      content = content.replace(/from\s+['"]@\/src\/lib\/db['"]/g, "from '@/src/lib/firebase'");
      content = content.replace(/from\s+['"]\.\/db['"]/g, "from './firebase'");

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

traverseAndReplace('./src');

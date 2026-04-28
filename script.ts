import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'src', 'components');

function processFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  // replace alert('...') with toast.success('...')
  // if it contains 'Erreur' or 'erreur', use toast.error
  content = content.replace(/alert\(('.*?'|".*?")\)/g, (match, p1) => {
    hasChanges = true;
    if (p1.toLowerCase().includes('erreur') || p1.toLowerCase().includes('error')) {
      return `toast.error(${p1})`;
    } else {
      return `toast.success(${p1})`;
    }
  });

  // template literal alert(`...`)
  content = content.replace(/alert\((`.*?`)\)/g, (match, p1) => {
    hasChanges = true;
    if (p1.toLowerCase().includes('erreur') || p1.toLowerCase().includes('error') || p1.toLowerCase().includes('insuffisantes')) {
      return `toast.error(${p1})`;
    } else if (p1.toLowerCase().includes('phase de test')) {
      return `toast.info(${p1})`;
    } else {
      return `toast.success(${p1})`;
    }
  });
  
  // replace custom events manually dispatched
  content = content.replace(/window\.dispatchEvent\(new CustomEvent\('toast', \{ detail: ('.*?'|".*?"|`.*?`) \}\)\);?/g, (match, p1) => {
    hasChanges = true;
    return `toast.success(${p1});`;
  });

  if (hasChanges && !content.includes('import { toast }')) {
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const newLineIndex = content.indexOf('\n', lastImportIndex);
      content = content.substring(0, newLineIndex + 1) + "import { toast } from '../../lib/toast';\n" + content.substring(newLineIndex + 1);
    } else {
      content = "import { toast } from '../../lib/toast';\n" + content;
    }
    
    // fix path if not inside components/admin
    if (!filePath.includes('/admin/')) {
        content = content.replace("from '../../lib/toast'", "from '../lib/toast'");
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + filePath);
  }
}

function walkDir(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

walkDir(srcDir);

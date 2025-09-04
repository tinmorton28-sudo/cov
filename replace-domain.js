import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const domain = process.env.VITE_PUBLIC_DOMAIN || 'localhost:5173';

const filesToProcess = [
  'dist/sitemap.xml', 
  'dist/robots.txt',
  'dist/index.html',
  'dist/privacy.html',
  'dist/about.html',
  'dist/contact.html',
];

filesToProcess.forEach(filePath => {
  const fullPath = path.resolve(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    try {
      let content = fs.readFileSync(fullPath, 'utf8');
      content = content.replace(/{{DOMAIN}}/g, domain);
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Successfully replaced {{DOMAIN}} in ${filePath} with ${domain}`);
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error.message);
    }
  } else {
    console.log(`Skipping ${filePath}: File not found.`);
  }
});

console.log('Domain replacement script finished.');
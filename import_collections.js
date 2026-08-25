const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://127.0.0.1:8765';
const COLLECTIONS_DIR = path.join(__dirname, 'Коллекции Postman');

async function importCollections() {
  // Check server
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}/collections`);
      if (res.ok) break;
    } catch (e) {
      if (attempt === 9) {
        console.error('Server not responding');
        process.exit(1);
      }
      await new Promise(r => setTimeout(r, 500));
    }
  }

  const files = fs.readdirSync(COLLECTIONS_DIR).filter(f => f.toLowerCase().endsWith('.json'));
  console.log(`Found ${files.length} JSON files`);

  for (const file of files) {
    const filepath = path.join(COLLECTIONS_DIR, file);
    console.log(`Importing: ${file} ...`);
    try {
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      const res = await fetch(`${BASE_URL}/collections/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });
      if (res.ok) {
        const result = await res.json();
        console.log(`  OK: ${result.name} (id=${result.id})`);
      } else {
        console.log(`  ERROR ${res.status}: ${await res.text()}`);
      }
    } catch (e) {
      console.log(`  ERROR: ${e.message}`);
    }
  }
  console.log('Done!');
}

importCollections();

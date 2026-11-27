// Debug the frontend Firestore connection and catalog source
import * as fs from 'fs';
import * as path from 'path';

console.log('=== FRONTEND FIRESTORE DEBUG ===\n');

// 1. Check .env values
console.log('--- 1. Environment Variables ---');
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  const env = {};
  lines.forEach(line => {
    const eqIdx = line.indexOf('=');
    if (eqIdx > 0) {
      const key = line.substring(0, eqIdx).trim();
      const value = line.substring(eqIdx + 1).trim();
      env[key] = value;
    }
  });
  
  console.log('VITE_CATALOG_SOURCE:', env.VITE_CATALOG_SOURCE || 'NOT SET');
  console.log('VITE_FIREBASE_PROJECT_ID:', env.VITE_FIREBASE_PROJECT_ID || 'NOT SET');
  console.log('VITE_FIRESTORE_COLLECTION:', env.VITE_FIRESTORE_COLLECTION || 'NOT SET');
  console.log('VITE_FIREBASE_API_KEY:', env.VITE_FIREBASE_API_KEY ? 'SET' : 'NOT SET');
} else {
  console.log('.env file NOT found');
}

// 2. Test Firebase connection via the repository
console.log('\n--- 2. Testing Firestore Connection ---');

// We'll test the actual fetch
const fetch = globalThis.fetch;
const projectId = 'store-ea555';
const apiKey = 'AIzaSyC0dyLxc8R1SsO2SAURqUgTBWnq044_JPw';
const collection = 'books';
const endpoint = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}?key=${apiKey}`;

console.log('Endpoint:', endpoint);

async function testConnection() {
  try {
    const response = await fetch(endpoint);
    console.log('HTTP Status:', response.status);
    
    if (!response.ok) {
      const text = await response.text();
      console.log('Error response:', text.substring(0, 200));
      return { success: false, error: text.substring(0, 200) };
    }
    
    const text = await response.text();
    const data = JSON.parse(text);
    const docCount = data.documents?.length || 0;
    
    console.log('Documents retrieved:', docCount);
    
    // Check if any titles match "casa"
    const casaBooks = data.documents?.filter(doc => {
      const fields = doc.fields;
      const title = fields.title?.stringValue || fields.titulo?.stringValue || fields.name?.stringValue || '';
      return title.toLowerCase().includes('casa');
    }) || [];
    
    console.log('Books with "casa" in title:', casaBooks.length);
    
    if (casaBooks.length > 0) {
      casaBooks.forEach(doc => {
        const fields = doc.fields;
        const title = fields.title?.stringValue || 'N/A';
        console.log(' -', title);
      });
    } else {
      console.log('No books with "casa" in title found');
      console.log('Showing first 3 titles:');
      (data.documents?.slice(0, 3) || []).forEach(doc => {
        const fields = doc.fields;
        const title = fields.title?.stringValue || fields.titulo?.stringValue || 'N/A';
        console.log(' -', title);
      });
    }
    
    // Check mock books
    const mockPath = path.join(process.cwd(), 'src', 'data', 'mockBooks.ts');
    if (fs.existsSync(mockPath)) {
      console.log('\n--- 3. Mock Books ---');
      const mockContent = fs.readFileSync(mockPath, 'utf8');
      // Extract just the titles from mock books
      const mockTitleRegex = /title:\s*'([^']+)'/g;
      let match;
      console.log('Mock book titles:');
      while ((match = mockTitleRegex.exec(mockContent)) !== null) {
        console.log(' -', match[1]);
      }
    }
    
    return { success: true, docCount, casaCount: casaBooks.length };
    
  } catch (error) {
    console.error('Fetch error:', error.message);
    return { success: false, error: error.message };
  }
}

testConnection().then(result => {
  console.log('\n--- SUMMARY ---');
  if (result.success) {
    console.log('Firestore connection: OK');
    console.log('Documents retrieved:', result.docCount);
    console.log('Books with "casa" in title:', result.casaCount);
    
    if (result.casaCount === 0) {
      console.log('\nISSUE: No books with "casa" in title found in Firestore');
      console.log('The frontend will not show "Casa de Hojas" etc.');
      console.log('This is because the 100 books in Firestore are from a different source.');
      console.log('Run the scraper to insert BuscaLibre books, or check the data source.');
    }
  } else {
    console.log('Firestore connection: FAILED - ' + result.error);
    console.log('The frontend will fall back to mock books');
  }
});
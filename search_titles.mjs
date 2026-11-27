// Search specifically for "Casa de Hojas" title
const fetch = globalThis.fetch;

(async () => {
  const projectId = 'store-ea555';
  const apiKey = 'AIzaSyC0dyLxc8R1SsO2SAURqUgTBWnq044_JPw';
  const collection = 'books';
  const endpoint = 'https://firestore.googleapis.com/v1/projects/' + projectId + '/databases/(default)/documents/' + collection + '?key=' + apiKey;
  
  console.log('Fetching all 100 books to search for "Casa de Hojas"...\n');
  
  try {
    const response = await fetch(endpoint);
    const text = await response.text();
    const data = JSON.parse(text);
    
    console.log('Total documents:', data.documents.length);
    console.log('\n--- Searching for "Casa de Hojas" in title field ---\n');
    
    let found = false;
    data.documents.forEach((doc, i) => {
      const fields = doc.fields;
      const title = fields.title?.stringValue || fields.titulo?.stringValue || fields.name?.stringValue || '';
      
      // Check exact match (case insensitive)
      if (title.toLowerCase() === 'casa de hojas' || title.toLowerCase().includes('casa de hojas')) {
        console.log(`FOUND at index ${i}:`);
        console.log(`  Title: "${title}"`);
        console.log(`  ID: ${doc.name.split('/').at(-1)}`);
        found = true;
      }
      
      // Also check if any field contains "Casa de Hojas"
      if (!found) {
        const fieldKeys = Object.keys(fields);
        fieldKeys.forEach(key => {
          const field = fields[key];
          const value = field.stringValue || '';
          if (value.toLowerCase().includes('casa de hojas')) {
            console.log(`Found in field "${key}" of doc ${i}: "${value.substring(0, 60)}...`);
            found = true;
          }
        });
      }
    });
    
    if (!found) {
      console.log('NO documents have "Casa de hojas" as the title');
      console.log('\n--- Looking for any book with "Casa" in title ---');
      
      // Show all titles that contain "casa" (anywhere)
      data.documents.forEach((doc, i) => {
        const fields = doc.fields;
        const title = fields.title?.stringValue || fields.titulo?.stringValue || fields.name?.stringValue || '';
        if (title.toLowerCase().includes('casa')) {
          console.log(`  Doc ${i}: "${title}"`);
        }
      });
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
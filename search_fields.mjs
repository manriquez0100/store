// Just fetch and show field structure for docs that might match
const fetch = globalThis.fetch;

(async () => {
  const projectId = 'store-ea555';
  const apiKey = 'AIzaSyC0dyLxc8R1SsO2SAURqUgTBWnq044_JPw';
  const collection = 'books';
  const endpoint = 'https://firestore.googleapis.com/v1/projects/' + projectId + '/databases/(default)/documents/' + collection + '?key=' + apiKey;
  
  console.log('Fetching all books...');
  
  try {
    const response = await fetch(endpoint);
    console.log('Status:', response.status);
    
    const text = await response.text();
    console.log('Response received, length:', text.length);
    
    try {
      const data = JSON.parse(text);
      console.log('Documents count:', data.documents?.length || 0);
      
      if (data.documents) {
        // Search through ALL docs for any that have "casa" or "hojas" in any field
        console.log('\n--- Searching ALL documents for "casa" or "hojas" ---\n');
        let foundAny = false;
        
        data.documents.forEach((doc, i) => {
          const fields = doc.fields;
          const fieldKeys = Object.keys(fields);
          
          // Check all field values for "casa" or "hojas"
          fieldKeys.forEach(key => {
            const field = fields[key];
            const value = field.stringValue ?? field.integerValue ?? field.doubleValue ?? field.booleanValue ?? '';
            const strValue = String(value).toLowerCase();
            
            if (strValue.includes('casa') || strValue.includes('hojas')) {
              if (!foundAny) {
                console.log('Found matches! Showing first few:');
                foundAny = true;
              }
              // Show doc info
              const title = fields.title?.stringValue || fields.titulo?.stringValue || 'N/A';
              console.log(`\nDoc ${i}:`);
              console.log(`  Title: "${title}"`);
              console.log(`  Field "${key}" contains: "${strValue}"`);
            }
          });
        });
        
        if (!foundAny) {
          console.log('No documents contain "casa" or "hojas" in any field string values');
        }
        
        // Also show sample docs with their full field lists
        console.log('\n--- Sample doc field structure (first 3) ---');
        data.documents.slice(0, 3).forEach((doc, i) => {
          console.log(`\nDoc ${i}:`, doc.name);
          const fieldObj = {};
          Object.keys(doc.fields).forEach(key => {
            const field = doc.fields[key];
            fieldObj[key] = field.stringValue || field.integerValue || field.doubleValue || field.booleanValue || 'null';
          });
          console.log('  Fields:', JSON.stringify(fieldObj, null, 2).substring(0, 300));
        });
      }
    } catch (e) {
      console.log('Not valid JSON');
      console.log('Raw text (first 500 chars):', text.substring(0, 500));
    }
  } catch (error) {
    console.error('Fetch error:', error.message);
  }
})();
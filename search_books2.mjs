// Search for "Casa de hojas" in Firestore - show actual field names
const fetch = globalThis.fetch;

(async () => {
  const projectId = 'store-ea555';
  const apiKey = 'AIzaSyC0dyLxc8R1SsO2SAURqUgTBWnq044_JPw';
  const collection = 'books';
  const endpoint = 'https://firestore.googleapis.com/v1/projects/' + projectId + '/databases/(default)/documents/' + collection + '?key=' + apiKey + '&limit=5';
  
  console.log('Fetching first 5 books from:', endpoint);
  
  try {
    const response = await fetch(endpoint);
    console.log('Status:', response.status);
    
    const text = await response.text();
    console.log('Response received, length:', text.length);
    
    try {
      const data = JSON.parse(text);
      console.log('Documents count:', data.documents?.length || 0);
      
      if (data.documents) {
        data.documents.forEach((doc, i) => {
          console.log('\n--- Doc ' + i + ' ---');
          console.log('Name:', doc.name);
          
          const fields = doc.fields;
          // List ALL field keys
          const fieldKeys = Object.keys(fields);
          console.log('Field keys:', fieldKeys);
          
          // Show each field value
          fieldKeys.forEach(key => {
            const field = fields[key];
            const value = field.stringValue ?? field.integerValue ?? field.doubleValue ?? field.booleanValue ?? 'N/A';
            console.log(`  ${key}:`, typeof value === 'string' ? value.substring(0, 80) : value);
          });
          
          // Try to find title
          let title = 'N/A';
          if (fields.title) title = fields.title.stringValue || 'N/A';
          else if (fields.titulo) title = fields.titulo.stringValue || 'N/A';
          else if (fields.name) title = fields.name.stringValue || 'N/A';
          
          console.log(`  Title (extracted): "${title}"`);
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
// List all 100 title values from Firestore
const fetch = globalThis.fetch;

(async () => {
  const projectId = 'store-ea555';
  const apiKey = 'AIzaSyC0dyLxc8R1SsO2SAURqUgTBWnq044_JPw';
  const collection = 'books';
  const endpoint = 'https://firestore.googleapis.com/v1/projects/' + projectId + '/databases/(default)/documents/' + collection + '?key=' + apiKey;
  
  try {
    const response = await fetch(endpoint);
    const text = await response.text();
    const data = JSON.parse(text);
    
    console.log('Total documents:', data.documents.length);
    console.log('\n--- All 100 Book Titles ---\n');
    
    data.documents.forEach((doc, i) => {
      const fields = doc.fields;
      const title = fields.title?.stringValue || fields.titulo?.stringValue || fields.name?.stringValue || 'N/A';
      const id = doc.name.split('/').at(-1).substring(0, 8) + '...';
      console.log(`${i+1}. "${title}" (ID: ${id})`);
    });
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
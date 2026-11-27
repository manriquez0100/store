// Search for "Casa de hojas" in Firestore
const fetch = globalThis.fetch;

(async () => {
  const projectId = 'store-ea555';
  const apiKey = 'AIzaSyC0dyLxc8R1SsO2SAURqUgTBWnq044_JPw';
  const collection = 'books';
  const endpoint = 'https://firestore.googleapis.com/v1/projects/' + projectId + '/databases/(default)/documents/' + collection + '?key=' + apiKey;
  
  console.log('Fetching all books from:', endpoint);
  
  try {
    const response = await fetch(endpoint);
    console.log('Status:', response.status);
    
    if (!response.ok) {
      const text = await response.text();
      console.log('Error response:', text.substring(0, 500));
      return;
    }
    
    const text = await response.text();
    console.log('Response received, length:', text.length);
    
    try {
      const data = JSON.parse(text);
      console.log('Documents count:', data.documents?.length || 0);
      
      if (data.documents) {
        // Search for "Casa de hojas"
        console.log('\n--- Searching for "Casa de hojas" ---\n');
        const searchTerm = 'casa de hojas';
        data.documents.forEach((doc, i) => {
          const fields = doc.fields;
          // Extract title - try multiple field names
          const title = fields.title?.stringValue || fields.titulo?.stringValue || fields.name?.stringValue || '';
          const author = fields.author?.stringValue || fields.autor?.stringValue || '';
          const category = fields.category?.stringValue || '';
          
          // Check if search term matches (case insensitive)
          const titleLower = (title || '').toLowerCase();
          const authorLower = (author || '').toLowerCase();
          const categoryLower = (category || '').toLowerCase();
          
          if (titleLower.includes(searchTerm) || authorLower.includes(searchTerm) || categoryLower.includes(searchTerm)) {
            console.log(`MATCH Found - Doc ${i}:`);
            console.log(`  Title: "${title}"`);
            console.log(`  Author: "${author}"`);
            console.log(`  Category: "${category}"`);
            console.log(`  ID: ${doc.name.split('/').at(-1)}`);
            console.log('---');
          }
        });
        
        if (!data.documents.some(d => {
          const f = d.fields;
          const t = f.title?.stringValue || f.titulo?.stringValue || '';
          return (t || '').toLowerCase().includes('casa de hojas');
        })) {
          console.log('No documents found matching "casa de casas"');
        }
      }
    } catch (e) {
      console.log('Response is not valid JSON');
      console.log('Raw text (first 1000 chars):', text.substring(0, 1000));
    }
  } catch (error) {
    console.error('Fetch error:', error.message);
  }
})();
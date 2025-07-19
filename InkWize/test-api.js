require('dotenv').config();

let fetchFn;
try {
  fetchFn = fetch;
} catch (e) {
  fetchFn = require('node-fetch');
}

async function testAPI() {
  try {
    const response = await fetchFn('http://localhost:3100/api/comics?limit=40');
    const data = await response.json();
    if (data && data.results && data.results.length > 0) {
      console.log('First comic object:', JSON.stringify(data.results[0], null, 2));
      for (let i = 0; i < Math.min(5, data.results.length); i++) {
        const comic = data.results[i];
        console.log(`Comic #${i + 1}: name=${comic.name}, cover_date=${comic.cover_date}, image=`, comic.image);
      }
    } else {
      console.log('No results found in API response.');
    }
  } catch (error) {
    console.error('Error fetching API:', error);
  }
}

testAPI(); 
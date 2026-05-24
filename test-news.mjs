const resp = await fetch('http://localhost:3000/api/ai/generate-news', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ report: { type: 'Kebakaran', location: { address: 'Malinau' }, description: 'test' } })
});
console.log('status', resp.status);
const data = await resp.text();
console.log(data);

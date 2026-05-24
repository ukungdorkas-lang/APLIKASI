const resp = await fetch('http://localhost:3000/api/ai/develop-narrative', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ outline: 'Kebakaran' })
});
const data = await resp.json();
console.log(data);

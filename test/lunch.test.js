import test from 'node:test';
import assert from 'node:assert/strict';
import { distance, classify, filterPlaces } from '../shared.js';
import { server } from '../server.js';
test('distance uses metres and handles identical points', () => {
  assert.equal(distance({ lat: 1, lng: 103 }, { lat: 1, lng: 103 }), 0);
  assert.ok(Math.abs(distance({ lat: 0, lng: 0 }, { lat: 0, lng: 1 }) - 111195) < 1);
});
test('filters combine category, carbs and protein', () => {
  const places = [{ category: 'Chinese', carbs: 'Rice', protein: 'Chicken' }, { category: 'Chinese', carbs: 'Noodles', protein: 'Chicken' }, { category: 'Japanese', carbs: 'Rice', protein: 'Seafood' }];
  assert.deepEqual(filterPlaces(places, { category: 'Chinese', carbs: 'Rice', protein: 'Chicken' }), [places[0]]);
  assert.equal(filterPlaces(places, {}).length, 3);
  assert.equal(filterPlaces(places, { protein: 'Beef' }).length, 0);
});
test('classification preserves unknown food ingredients', () => {
  assert.deepEqual(classify({ displayName: { text: 'Neighbourhood Café' }, types: ['cafe'] }), { category: 'Café', carbs: 'Unknown', protein: 'Unknown' });
  assert.deepEqual(classify({ displayName: { text: 'Chicken Rice' }, types: ['chinese_restaurant'] }), { category: 'Chinese', carbs: 'Rice', protein: 'Chicken' });
});
test('server delivers app and configuration; unknown paths return 404', async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const html = await fetch(base); assert.equal(html.status, 200); assert.match(await html.text(), /What’s for lunch/);
    for (const file of ['/app.js', '/shared.js', '/style.css']) assert.equal((await fetch(base + file)).status, 200);
    const config = await (await fetch(base + '/api/config')).json(); assert.equal(typeof config.live, 'boolean');
    assert.equal((await fetch(base + '/.env')).status, 404);
    if (!config.live) { const res = await fetch(base + '/api/search?q=Singapore&radius=1000'); assert.equal(res.status, 503); assert.match((await res.json()).error, /API key/); }
  } finally { await new Promise(resolve => server.close(resolve)); }
});

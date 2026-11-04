import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { classify } from './shared.js';

const key = process.env.GOOGLE_MAPS_API_KEY;
const port = Number(process.env.PORT || 3000);
async function google(url, options) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
  const body = await response.json();
  if (!response.ok || body.error || (body.status && !['OK', 'ZERO_RESULTS'].includes(body.status))) {
    throw new Error('Google Maps could not complete the search. Check API access, billing, and key restrictions.');
  }
  return body;
}
function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}
const files = { '/': ['public/index.html', 'text/html'], '/app.js': ['public/app.js', 'text/javascript'], '/style.css': ['public/style.css', 'text/css'], '/shared.js': ['shared.js', 'text/javascript'] };
export const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname === '/api/config') return json(res, 200, { live: Boolean(key) });
    if (url.pathname === '/api/search') {
      if (!key) return json(res, 503, { error: 'Live search requires a Google Maps API key. You can explore the demo instead.' });
      let lat = Number(url.searchParams.get('lat')), lng = Number(url.searchParams.get('lng'));
      let label = 'Your current location';
      const query = url.searchParams.get('q')?.trim();
      if (query) {
        if (query.length > 200) return json(res, 400, { error: 'Please use a shorter location.' });
        const geo = await google(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${encodeURIComponent(key)}`);
        if (!geo.results?.length) return json(res, 404, { error: 'Location not found. Try an address, neighbourhood, or postal code.' });
        ({ lat, lng } = geo.results[0].geometry.location);
        label = geo.results[0].formatted_address;
      } else if (!url.searchParams.has('lat') || !url.searchParams.has('lng')) {
        return json(res, 400, { error: 'Enter a location or use your current location.' });
      }
      const radius = Number(url.searchParams.get('radius'));
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180 || !Number.isFinite(radius) || radius < 100 || radius > 5000) return json(res, 400, { error: 'Choose a valid location and a radius between 100 m and 5 km.' });
      const result = await google('https://places.googleapis.com/v1/places:searchNearby', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.googleMapsUri,places.primaryType,places.types,places.businessStatus' },
        body: JSON.stringify({ includedTypes: ['restaurant', 'cafe', 'bakery', 'meal_takeaway'], maxResultCount: 20, rankPreference: 'DISTANCE', locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius } } })
      });
      return json(res, 200, { label, center: { lat, lng }, places: (result.places || []).filter(p => p.businessStatus !== 'CLOSED_PERMANENTLY').map(p => ({ id: p.id, name: p.displayName?.text || 'Food spot', address: p.formattedAddress, rating: p.rating, reviews: p.userRatingCount, lat: p.location.latitude, lng: p.location.longitude, url: p.googleMapsUri, ...classify(p) })) });
    }
    const file = files[url.pathname];
    if (!file) return json(res, 404, { error: 'Not found' });
    res.writeHead(200, { 'Content-Type': file[1] + '; charset=utf-8', 'X-Content-Type-Options': 'nosniff' });
    res.end(await readFile(fileURLToPath(new URL(file[0], import.meta.url))));
  } catch (error) { json(res, 502, { error: error.name === 'TimeoutError' ? 'Search timed out. Please try again.' : 'Search is unavailable. Check Google Maps API configuration and try again.' }); }
});
if (process.argv[1] === fileURLToPath(import.meta.url)) server.listen(port, '0.0.0.0', () => console.log(`Lunch Compass listening on port ${port}`));

import { distance, filterPlaces } from '/shared.js';
const $ = id => document.getElementById(id);
const demoCenter = { lat: 1.2764, lng: 103.8459 };
const samples = [
  ['The Daily Bowl', 'Colourful bowls, a fresh start.', 'Healthy', 'Rice', 'Plant-based', '🥗', '#e8edcf', 4.8, 180],
  ['Ah Huat Chicken Rice', 'A comforting local classic.', 'Chinese', 'Rice', 'Chicken', '🍗', '#f5e2c1', 4.6, 260],
  ['Little Tokyo Ramen', 'A warm bowl for a better afternoon.', 'Japanese', 'Noodles', 'Beef', '🍜', '#f4d8c9', 4.7, 390],
  ['Pasta & Co.', 'Twirl your way through lunch.', 'Italian', 'Noodles', 'Seafood', '🍝', '#e4e6c9', 4.5, 480],
  ['The Sandwich Club', 'Good things between two slices.', 'Café', 'Bread', 'Chicken', '🥪', '#f0e5d2', 4.8, 650],
  ['Nasi & Spice', 'Big flavours. A little kick.', 'Malay', 'Rice', 'Beef', '🍛', '#eed8bd', 4.6, 820],
  ['Prata Corner', 'Crispy, golden, made for dipping.', 'Indian', 'Bread', 'Plant-based', '🫓', '#f1dfc8', 4.4, 1300],
  ['Seoul Lunch', 'A little Seoul in your afternoon.', 'Korean', 'Rice', 'Chicken', '🍱', '#dce6d5', 4.7, 2100]
].map(([name, description, category, carbs, protein, emoji, color, rating, meters], i) => ({ id: `demo-${i}`, name, description, category, carbs, protein, emoji, color, rating, meters }));
let places = samples, center = demoCenter, demo = true, live = false, coordinates = null, active = {}, pending = false, searchedRadius = 1000;
const groups = { category: ['Healthy', 'Chinese', 'Japanese', 'Italian', 'Café', 'Malay', 'Indian', 'Korean', 'Thai', 'Other'], carbs: ['Rice', 'Noodles', 'Bread', 'Unknown'], protein: ['Chicken', 'Beef', 'Seafood', 'Plant-based', 'Unknown'] };
const titles = { category: 'Category', carbs: 'Type of carbs', protein: 'Type of protein' };
function node(tag, className, text) { const el = document.createElement(tag); if (className) el.className = className; if (text != null) el.textContent = text; return el; }
for (const [key, options] of Object.entries(groups)) {
  const group = node('fieldset', 'filter-group'); group.append(node('legend', '', titles[key]));
  const chips = node('div', 'chips');
  for (const value of ['', ...options]) {
    const button = node('button', 'chip', value || 'All'); button.type = 'button'; button.dataset.key = key; button.dataset.value = value; button.setAttribute('aria-pressed', String(!value));
    button.onclick = () => { active[key] = value; render(); }; chips.append(button);
  }
  group.append(chips); $('filters').append(group);
}
const radius = () => Number($('radius').value);
const formatDistance = n => n < 1000 ? `${Math.round(n / 10) * 10} m` : `${(n / 1000).toFixed(1)} km`;
function visible() { return filterPlaces(places.map(p => ({ ...p, meters: demo ? p.meters : distance(center, p) })).filter(p => p.meters <= (demo ? radius() : searchedRadius)), active).sort((a, b) => $('sort').value === 'rating' ? (b.rating || 0) - (a.rating || 0) : a.meters - b.meters); }
function render() {
  document.querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', String((active[b.dataset.key] || '') === b.dataset.value)));
  const list = visible(); $('count').textContent = ` ${list.length}`; $('results-summary').textContent = `${list.length} ${demo ? 'sample spots' : 'places'} to explore`; $('cards').replaceChildren();
  $('surprise').disabled = !list.length || pending;
  for (const p of list) {
    const card = node('article', 'card'); card.id = p.id;
    const art = node('div', 'card-art'); art.style.background = p.color || '#e5e9d9'; art.append(node('span', 'food-emoji', p.emoji || ({ Rice: '🍚', Noodles: '🍜', Bread: '🥪' }[p.carbs] || '🍽️')));
    art.append(node('span', 'distance-badge', `↗ ${formatDistance(p.meters)}`));
    const body = node('div', 'card-body'); const top = node('div', 'card-meta'); top.append(node('span', 'category', p.category), node('span', 'rating', p.rating ? `★ ${p.rating.toFixed(1)}` : 'No rating')); body.append(top, node('h3', '', p.name), node('p', 'description', demo ? p.description : p.address));
    const tags = node('div', 'tags'); tags.append(node('span', '', p.carbs), node('span', '', p.protein)); body.append(tags);
    if (!demo && (p.carbs !== 'Unknown' || p.protein !== 'Unknown')) body.append(node('p', 'estimate', 'Food tags are estimates — check the menu.'));
    const link = node('a', 'map-link', demo ? 'Explore area on Google Maps ↗' : 'View on Google Maps ↗');
    link.href = demo ? 'https://www.google.com/maps/search/?api=1&query=Tanjong+Pagar+food+Singapore' : p.url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name)}&query_place_id=${encodeURIComponent(p.id)}`;
    link.target = '_blank'; link.rel = 'noopener noreferrer'; body.append(link); card.append(art, body); $('cards').append(card);
  }
  if (!list.length) { const empty = node('div', 'empty'); empty.append(node('span', '', '🍽️'), node('h3', '', 'A little room for discovery'), node('p', '', 'Try fewer filters or search a wider radius.')); $('cards').append(empty); }
  $('data-note').textContent = demo ? 'Illustrative food spots, ratings, and distances. These are sample results, not real business listings.' : 'Powered by Google Maps · Up to 20 nearby places per search, not every food option. Cuisine and food tags are inferred from names and place types; unknown ingredients stay unclassified. Confirm menus and dietary needs with the venue. Distances are straight-line estimates.';
}
function notice(text, error = false) { $('notice').textContent = text; $('notice').classList.toggle('error', error); }
function busy(value) { pending = value; $('search-button').disabled = value; $('locate').disabled = value; $('radius').disabled = value; $('location').disabled = value; $('search-button').textContent = value ? 'Finding good food…' : 'Find my lunch ↗'; $('cards').setAttribute('aria-busy', String(value)); $('surprise').disabled = value || !visible().length; }
async function search() {
  if (pending) return;
  if (!live) { notice('Google Maps is not connected yet. Showing sample results; location-based search becomes available when an API key is configured.', true); return; }
  const q = $('location').value.trim(); if (!q && !coordinates) { notice('Enter a location or use your current location.', true); $('location').focus(); return; }
  busy(true);
  try {
    const params = new URLSearchParams({ radius: radius(), ...(q ? { q } : coordinates) });
    const response = await fetch(`/api/search?${params}`); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Search failed. Please try again.');
    places = data.places; center = data.center; demo = false; searchedRadius = radius(); $('mode-label').textContent = 'DISCOVERED AROUND YOU'; $('search-context').textContent = `${data.label} · within ${formatDistance(searchedRadius)}`;
    notice('Your nearby places are ready. Filter your shortlist below.'); render();
  } catch (e) { notice(`${e.message} ${demo ? 'Sample results remain below.' : 'Previous results remain below.'}`, true); }
  finally { busy(false); }
}
$('search-form').onsubmit = e => { e.preventDefault(); search(); };
$('radius').oninput = () => { $('radius-value').textContent = formatDistance(radius()); if (demo) render(); else notice('Radius changed. Select “Find my lunch” to refresh results.'); };
$('location').oninput = () => { coordinates = null; $('location').placeholder = 'Address, area, or postal code'; if (!demo) notice('Location changed. Select “Find my lunch” to refresh results.'); };
$('sort').onchange = render;
$('reset').onclick = () => { active = {}; render(); };
$('locate').onclick = () => {
  if (!navigator.geolocation) return notice('Location access is unavailable. Enter your location instead.', true);
  busy(true); notice('Finding your location…');
  navigator.geolocation.getCurrentPosition(position => { coordinates = { lat: position.coords.latitude, lng: position.coords.longitude }; $('location').value = ''; $('location').placeholder = 'Current location selected'; busy(false); notice('Current location selected.'); search(); }, () => { busy(false); notice('Could not access your location. Allow location access in your browser, or enter an address.', true); }, { timeout: 12000, maximumAge: 60000 });
};
$('surprise').onclick = () => { const list = visible(); if (!list.length) return; const p = list[Math.floor(Math.random() * list.length)]; document.querySelectorAll('.picked').forEach(c => c.classList.remove('picked')); const card = $(p.id); card.classList.add('picked'); card.scrollIntoView({ behavior: 'smooth', block: 'center' }); notice(`Today’s pick: ${p.name}. Lunch decision, made.`); };
render();
try { const response = await fetch('/api/config'); if (!response.ok) throw new Error(); live = (await response.json()).live; if (live) notice('Google Maps connected. Enter a location to find real food spots. Sample results are shown until you search.'); } catch { notice('Could not check Google Maps connection. You can still explore sample results.', true); }

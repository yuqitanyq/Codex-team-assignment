export function distance(a, b) {
  const rad = n => n * Math.PI / 180;
  const x = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(Math.max(0, 1 - x)));
}
export function classify(place) {
  const text = `${place.displayName?.text || ''} ${(place.types || []).join(' ')}`.toLowerCase();
  const category = [['Japanese', /japanese|sushi|ramen/], ['Chinese', /chinese|dim sum|dumpling/], ['Indian', /indian|biryani|prata/], ['Malay', /malay|nasi/], ['Thai', /thai/], ['Italian', /italian|pizza|pasta/], ['Korean', /korean/], ['Café', /cafe|coffee|bakery/]].find(([, re]) => re.test(text))?.[0] || 'Other';
  return { category, carbs: /rice|biryani|nasi|sushi/.test(text) ? 'Rice' : /noodle|ramen|pasta/.test(text) ? 'Noodles' : /bread|pizza|sandwich|prata|bakery/.test(text) ? 'Bread' : 'Unknown', protein: /chicken/.test(text) ? 'Chicken' : /beef/.test(text) ? 'Beef' : /fish|seafood|sushi/.test(text) ? 'Seafood' : /tofu|vegan|vegetarian/.test(text) ? 'Plant-based' : 'Unknown' };
}
export function filterPlaces(places, filters) {
  return places.filter(p => ['category', 'carbs', 'protein'].every(k => !filters[k] || filters[k] === p[k]));
}

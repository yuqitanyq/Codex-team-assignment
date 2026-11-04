# Lunch Compass

A responsive lunch finder with browser location access, address search, a 100 m–5 km radius, cuisine/carbs/protein filters, sorting, and a random lunch pick.

## Run

Requires Node.js 22 or later. No package installation is needed.

```sh
cd /workspace/Codex-team-assignment
npm start
```

The server listens on port 3000 (`PORT` overrides it). Without a key the app displays clearly labelled illustrative food spots around Tanjong Pagar. Sample names, ratings, and distances are fictional. Location searches do not fabricate results.

## Live Google Maps search

Set `GOOGLE_MAPS_API_KEY` securely in the runtime environment (or in an ignored `.env` file). Enable **Geocoding API** and **Places API (New)** in a Google Cloud project with billing. Restart the server after setting the key. The key stays on the server. Restrict it to these APIs and suitable server IPs when supported by your deployment. For a public deployment, add authentication/rate limiting to protect API quota.

Outbound HTTPS access is required to `maps.googleapis.com` and `places.googleapis.com`. Optional web fonts use `fonts.googleapis.com` and `fonts.gstatic.com`; system fonts work without them. Google Maps links open on `www.google.com`.

Enter an address, neighbourhood, or postal code, or grant location access, choose a radius, then select **Find my lunch**. Geolocation needs a secure browser context and permission. Changing location/radius requires another search; filters and sorting apply immediately. Search returns up to 20 nearby businesses, so it cannot enumerate every food option. Distances are straight-line estimates.

Google does not supply reliable dish-level carb/protein data. Live tags use explicit words in business names and Google place types; unclassified ingredients remain **Unknown**. Estimates can be incomplete or inaccurate and must be checked against menus. The app is not suitable for verifying allergens or dietary restrictions.

## Validate

```sh
npm test
```

Tests cover combined filters, distances, ingredient classification, static serving, configuration, and missing-key behavior. Real Google responses require a configured key and are not covered by these tests.

Use the existing checkout in each isolated cloud task; do not create a Git worktree unless explicitly requested. Start the server again in a new task; running processes are not retained by environment snapshots.

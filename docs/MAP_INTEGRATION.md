# Map Integration Documentation

## Overview
The application uses **Leaflet.js** via **React-Leaflet** for rendering interactive maps. This replaces the previous static image implementation to provide a richer user experience with zoom, pan, and marker capabilities.

## Dependencies
- `leaflet`: Core mapping library.
- `react-leaflet`: React components for Leaflet.
- `@types/leaflet`: TypeScript definitions.

## Component: `<Map />`
Located at `components/ui/Map.tsx`.

### Features
- **Dynamic Loading:** Imported via `next/dynamic` with `{ ssr: false }` to avoid server-side `window` reference errors.
- **Geocoding:** Automatically geocodes address strings (Address, City, State, Zip) using OpenStreetMap's Nominatim service.
- **Interactive:** Supports zoom, pan, and popups.
- **Responsive:** Adapts to container size.
- **Dark Mode Compatible:** Styled to fit the application's glassmorphism theme.

### Usage
```tsx
import dynamic from 'next/dynamic';

// Import dynamically to prevent SSR issues
const Map = dynamic(() => import('@/components/ui/Map'), { 
  ssr: false,
  loading: () => <div>Loading map...</div>
});

// Usage in JSX
<Map 
  address="123 Main St"
  city="New York"
  state="NY"
  zipCode="10001"
  className="h-[300px] w-full rounded-xl"
/>
```

### Geocoding
The component constructs a query string from the provided address props and fetches coordinates from:
`https://nominatim.openstreetmap.org/search`

**Note:** The Nominatim API is subject to rate limits. For high-traffic production environments, consider replacing this with a dedicated geocoding service (e.g., Google Maps Geocoding API, Mapbox, or a self-hosted Nominatim instance) and caching the results in the database.

### Configuration
- **Default Zoom:** 13 (can be overridden via `initialZoom` prop).
- **Tile Layer:** OpenStreetMap Standard (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`).
- **Attribution:** Required OpenStreetMap attribution is included automatically.

## Troubleshooting
- **Map not appearing:** Ensure the container has a defined height (e.g., `h-[300px]`).
- **Markers missing:** Check the console for geocoding errors. If the address is invalid, the map handles the error gracefully.
- **"window is not defined":** Ensure the component is imported dynamically with `ssr: false`.

import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

if (!key) console.error('VITE_GOOGLE_MAPS_API_KEY is missing.');

setOptions({
    key,
    v: 'weekly',
    language: 'en',
    region: 'RO'
});

export const loadPlaces = () => importLibrary('places');
export const loadMaps = () => importLibrary('maps');
export const loadMarkers = () => importLibrary('marker');
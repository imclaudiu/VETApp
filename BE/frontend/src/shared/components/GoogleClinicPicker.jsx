import { useEffect, useRef } from 'react';
import { loadPlaces } from '../services/googleMaps';

export default function GoogleClinicPicker({ onSelect }) {
    const containerRef = useRef(null);
    const onSelectRef = useRef(onSelect);

    useEffect(() => {
        onSelectRef.current = onSelect;
    }, [onSelect]);

    useEffect(() => {
        let autocomplete;
        let handler;

        const init = async () => {
            const { PlaceAutocompleteElement } = await loadPlaces();

            autocomplete = new PlaceAutocompleteElement({
                includedPrimaryTypes: ['veterinary_care'],
                includedRegionCodes: ['ro']
            });

            autocomplete.placeholder = 'Search veterinary clinic in Romania...';

            handler = async ({ placePrediction }) => {
                const place = placePrediction.toPlace();
                await place.fetchFields({
                    fields: ['displayName', 'formattedAddress', 'location', 'addressComponents', 'rating']
                });

                const city = place.addressComponents?.find(c => c.types.includes('locality'))?.longText
                    || place.addressComponents?.find(c => c.types.includes('administrative_area_level_2'))?.longText
                    || '';

                onSelectRef.current({
                    name: place.displayName || '',
                    address: place.formattedAddress || '',
                    city,
                    googlePlaceId: place.id,
                    latitude: place.location?.lat(),
                    longitude: place.location?.lng(),
                    rating: place.rating || 0
                });
            };

            autocomplete.addEventListener('gmp-select', handler);
            containerRef.current?.replaceChildren(autocomplete);
        };

        init();

        return () => {
            if (autocomplete && handler) autocomplete.removeEventListener('gmp-select', handler);
        };
    }, []);

    return <div className="google-clinic-picker" ref={containerRef} />;
}
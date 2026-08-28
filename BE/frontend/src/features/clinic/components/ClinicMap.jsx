import { useEffect, useRef } from 'react';
import { loadMaps, loadMarkers } from '../../../shared/services/googleMaps';

export default function ClinicMap({ clinic }) {
    const mapRef = useRef(null);

    useEffect(() => {
        if (!clinic?.latitude || !clinic?.longitude) return;

        const initMap = async () => {
            const [{ Map }, { AdvancedMarkerElement }] = await Promise.all([loadMaps(), loadMarkers()]);
            const position = { lat: clinic.latitude, lng: clinic.longitude };

            const map = new Map(mapRef.current, {
                center: position,
                zoom: 16,
                mapId: 'DEMO_MAP_ID',
                mapTypeControl: false,
                streetViewControl: false
            });

            new AdvancedMarkerElement({
                map,
                position,
                title: clinic.name
            });
        };

        initMap();
    }, [clinic]);

    if (!clinic?.latitude || !clinic?.longitude) return null;

    return <div ref={mapRef} className="clinic-map" />;
}
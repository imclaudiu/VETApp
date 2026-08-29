import { useEffect, useRef } from 'react';
import { loadMaps, loadMarkers } from '../../../shared/services/googleMaps';

export default function ClinicMap({ clinic }) {
    const mapRef = useRef(null);

    useEffect(() => {
        if (
            !mapRef.current ||
            clinic?.latitude == null ||
            clinic?.longitude == null
        ) return;

        let marker;

        const initMap = async () => {
            const [{ Map }, { AdvancedMarkerElement }] = await Promise.all([
                loadMaps(),
                loadMarkers()
            ]);

            const position = {
                lat: Number(clinic.latitude),
                lng: Number(clinic.longitude)
            };

            if (!Number.isFinite(position.lat) || !Number.isFinite(position.lng)) return;

            const map = new Map(mapRef.current, {
                center: position,
                zoom: 17,
                mapId: 'DEMO_MAP_ID',
                mapTypeControl: false,
                streetViewControl: true,
                fullscreenControl: true
            });

            marker = new AdvancedMarkerElement({
                map,
                position,
                title: clinic.name
            });
        };

        initMap();

        return () => {
            if (marker) marker.map = null;
        };
    }, [clinic]);

    return <div ref={mapRef} className="clinic-map" />;
}
import { useEffect, useRef, useState } from 'react';
import { loadMaps, loadMarkers } from '../../../shared/services/googleMaps';

export default function ClinicsMap({ clinics, selectedClinicId, onSelect }) {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const markersRef = useRef([]);
    const [mapReady, setMapReady] = useState(false);

    const validClinics = clinics.filter(clinic => {
        if (clinic.latitude == null || clinic.longitude == null) return false;

        const lat = Number(clinic.latitude);
        const lng = Number(clinic.longitude);

        return Number.isFinite(lat) && Number.isFinite(lng);
    });

    useEffect(() => {
        if (!containerRef.current || !validClinics.length) return;

        let cancelled = false;

        const initMap = async () => {
            setMapReady(false);

            const [
                { Map: GoogleMap, LatLngBounds },
                { AdvancedMarkerElement }
            ] = await Promise.all([
                loadMaps(),
                loadMarkers()
            ]);

            if (cancelled) return;

            markersRef.current.forEach(marker => marker.map = null);
            markersRef.current = [];

            const firstClinic = validClinics[0];

            const map = new GoogleMap(containerRef.current, {
                center: {
                    lat: Number(firstClinic.latitude),
                    lng: Number(firstClinic.longitude)
                },
                zoom: 12,
                mapId: 'DEMO_MAP_ID',
                mapTypeControl: false,
                streetViewControl: true,
                fullscreenControl: true
            });

            mapRef.current = map;

            const bounds = new LatLngBounds();

            validClinics.forEach(clinic => {
                const position = {
                    lat: Number(clinic.latitude),
                    lng: Number(clinic.longitude)
                };

                const marker = new AdvancedMarkerElement({
                    map,
                    position,
                    title: clinic.name
                });

                marker.addListener('click', () => {
                    onSelect(clinic.id);
                });

                markersRef.current.push(marker);
                bounds.extend(position);
            });

            const selectedClinic = validClinics.find(
                clinic => String(clinic.id) === String(selectedClinicId)
            );

            if (selectedClinic) {
                map.setCenter({
                    lat: Number(selectedClinic.latitude),
                    lng: Number(selectedClinic.longitude)
                });

                map.setZoom(17);
            } else if (validClinics.length === 1) {
                map.setCenter(bounds.getCenter());
                map.setZoom(17);
            } else {
                map.fitBounds(bounds, 60);
            }

            setMapReady(true);
        };

        initMap();

        return () => {
            cancelled = true;

            markersRef.current.forEach(marker => marker.map = null);
            markersRef.current = [];
        };
    }, [clinics]);

    useEffect(() => {
        if (!mapReady || !mapRef.current || !selectedClinicId) return;

        const selectedClinic = validClinics.find(
            clinic => String(clinic.id) === String(selectedClinicId)
        );

        if (!selectedClinic) {
            console.error('Selected clinic has no valid coordinates:', selectedClinicId);
            return;
        }

        const position = {
            lat: Number(selectedClinic.latitude),
            lng: Number(selectedClinic.longitude)
        };

        console.log('MOVING TO CLINIC:', {
            name: selectedClinic.name,
            address: selectedClinic.address,
            latitude: selectedClinic.latitude,
            longitude: selectedClinic.longitude
        });

        mapRef.current.setCenter(position);
        mapRef.current.setZoom(17);
    }, [selectedClinicId, mapReady]);

    if (!validClinics.length) {
        return (
            <div className="clinics-map-empty">
                <strong>Map unavailable</strong>
                <p>No location information is available for these clinics.</p>
            </div>
        );
    }

    return <div ref={containerRef} className="clinics-map" />;
}
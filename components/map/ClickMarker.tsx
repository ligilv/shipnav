import mapboxgl from 'mapbox-gl';
import { createMarkerElement } from '@/lib/mapUtils';

interface ClickMarkerProps {
    map: mapboxgl.Map;
    lngLat: mapboxgl.LngLat;
    onMarkerCreated?: (marker: mapboxgl.Marker) => void;
}

export const createClickMarker = ({
    map,
    lngLat,
    onMarkerCreated
}: ClickMarkerProps): mapboxgl.Marker => {
    try {
        const markerEl = createMarkerElement('click');
        const marker = new mapboxgl.Marker({ element: markerEl })
            .setLngLat([lngLat.lng, lngLat.lat])
            .setPopup(
                new mapboxgl.Popup({ offset: 25 })
                    .setHTML(
                        `<h3>Location</h3><p>Lat: ${lngLat.lat.toFixed(6)}<br>Lng: ${lngLat.lng.toFixed(6)}</p>`
                    )
            )
            .addTo(map);

        if (onMarkerCreated) {
            onMarkerCreated(marker);
        }

        return marker;
    } catch (error) {
        console.error('error', error);
        throw error;
    }
};


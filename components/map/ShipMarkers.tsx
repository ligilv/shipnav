import mapboxgl from 'mapbox-gl';
import { createMarkerElement } from '@/lib/mapUtils';

interface ShipMarkersProps {
    map: mapboxgl.Map;
    ship: {
        name: string;
        color: string;
        coordinates: number[][];
    };
}

export const createShipMarkers = ({ map, ship }: ShipMarkersProps): void => {
    ship.coordinates.forEach((coord, coordIndex) => {
        const isFirst = coordIndex === 0;
        const isLast = coordIndex === ship.coordinates.length - 1;

        let markerEl: HTMLDivElement;
        if (isFirst) {
            markerEl = createMarkerElement('start', ship.color);
        } else if (isLast) {
            markerEl = createMarkerElement('end');
        } else {
            markerEl = createMarkerElement('waypoint', ship.color);
        }

        const label = isFirst ? 'Start' : isLast ? 'End' : `Waypoint ${coordIndex}`;
        new mapboxgl.Marker({ element: markerEl })
            .setLngLat(coord as [number, number])
            .setPopup(
                new mapboxgl.Popup({ offset: 25 })
                    .setHTML(
                        `<h3>${ship.name} - ${label}</h3><p>${ship.color}</p>`
                    )
            )
            .addTo(map);
    });
};

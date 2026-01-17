import mapboxgl from 'mapbox-gl';
import { createMarkerElement, getPositionAtSegment } from '@/lib/mapUtils';

interface MovingShipProps {
    map: mapboxgl.Map;
    ship: {
        name: string;
        color: string;
        coordinates: number[][];
    };
    shipIndex: number;
    onProgressUpdate: (index: number, state: { segmentIndex: number; progress: number }) => void;
    onComplete: (index: number) => void;
}

export const createMovingShip = ({
    map,
    ship,
    shipIndex,
    onProgressUpdate,
    onComplete
}: MovingShipProps): NodeJS.Timeout => {
    const movingShipEl = createMarkerElement('moving', ship.color);
    const movingMarker = new mapboxgl.Marker({ element: movingShipEl })
        .setLngLat(ship.coordinates[0] as [number, number])
        .setPopup(
            new mapboxgl.Popup({ offset: 25 })
                .setHTML(
                    `<h3>${ship.name}</h3><p>In Transit</p>`
                )
        )
        .addTo(map);

    let currentState = { segmentIndex: 0, progress: 0 };
    onProgressUpdate(shipIndex, currentState);

    const interval = setInterval(() => {
        const { segmentIndex, progress } = currentState;

        if (segmentIndex >= ship.coordinates.length - 1) {
            clearInterval(interval);
            onComplete(shipIndex);
            return;
        }

        let newProgress = progress + 0.05;
        let newSegmentIndex = segmentIndex;

        if (newProgress >= 1) {
            newSegmentIndex = segmentIndex + 1;
            newProgress = 0;

            if (newSegmentIndex >= ship.coordinates.length - 1) {
                currentState = { segmentIndex: newSegmentIndex, progress: 1 };
                onProgressUpdate(shipIndex, currentState);
                const finalPos = ship.coordinates[ship.coordinates.length - 1] as [number, number];
                movingMarker.setLngLat(finalPos);
                onComplete(shipIndex);
                clearInterval(interval);
                return;
            }

        }

        currentState = { segmentIndex: newSegmentIndex, progress: newProgress };
        onProgressUpdate(shipIndex, currentState);

        const [lng, lat] = getPositionAtSegment(ship.coordinates, newSegmentIndex, newProgress);
        movingMarker.setLngLat([lng, lat]);
    }, 2000);

    return interval;
};

import mapboxgl from 'mapbox-gl';

export const createMarkerElement = (
  type: 'start' | 'waypoint' | 'end' | 'moving' | 'click',
  color?: string
): HTMLDivElement => {
  const el = document.createElement('div');
  el.style.cursor = 'pointer';
  el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'center';

  switch (type) {
    case 'start':
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = color || '#3b82f6';
      el.style.border = '2px solid white';
      el.style.opacity = '0.7';
      break;

    case 'waypoint':
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = color || '#3b82f6';
      el.style.border = '2px solid white';
      el.style.opacity = '0.6';
      break;

    case 'end':
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid white';
      el.style.fontSize = '20px';
      el.innerHTML = '❌';
      break;

    case 'moving':
      el.className = 'moving-ship-marker';
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = color || '#3b82f6';
      el.style.border = '3px solid white';
      el.style.fontSize = '16px';
      el.innerHTML = '🚢';
      break;

    case 'click':
      el.style.width = '25px';
      el.style.height = '25px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#3b82f6';
      el.style.border = '3px solid white';
      el.style.fontSize = '14px';
      el.innerHTML = '📍';
      el.onclick = (e) => {
        e.stopPropagation();
      };
      break;
  }

  return el;
};

export const getPositionAtSegment = (
  coordinates: number[][],
  segmentIndex: number,
  progress: number
): [number, number] => {
  if (segmentIndex >= coordinates.length - 1) {
    return coordinates[coordinates.length - 1] as [number, number];
  }

  const start = coordinates[segmentIndex];
  const end = coordinates[segmentIndex + 1];

  const lng = start[0] + (end[0] - start[0]) * progress;
  const lat = start[1] + (end[1] - start[1]) * progress;
  return [lng, lat];
};

export const createShipPathLayer = (shipLocation: Array<{
  name: string;
  color: string;
  coordinates: number[][];
}>) => {
  const shipPaths = shipLocation.map((ship) => ({
    type: 'Feature' as const,
    geometry: {
      type: 'LineString' as const,
      coordinates: ship.coordinates
    },
    properties: {
      name: ship.name,
      color: ship.color
    }
  }));

  return {
    source: {
      type: 'geojson' as const,
      data: {
        type: 'FeatureCollection' as const,
        features: shipPaths
      }
    },
    layer: {
      id: 'ship-paths-line',
      type: 'line' as const,
      source: 'ship-paths',
      layout: {
        'line-join': 'round' as const,
        'line-cap': 'round' as const
      },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 3,
        'line-dasharray': [2, 2]
      }
    }
  };
};

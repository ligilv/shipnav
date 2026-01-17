import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { shipLocation } from '@/constants/shipLocation';
import { createShipPathLayer } from '@/lib/mapUtils';
import { createShipMarkers } from '@/components/map/ShipMarkers';
import { createMovingShip } from '@/components/map/MovingShip';
import { createClickMarker } from '@/components/map/ClickMarker';

export const useMap = (
  containerRef: React.RefObject<HTMLDivElement | null>,
  onLocationClick?: (lngLat: { lng: number; lat: number }) => void
) => {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const shipMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const clickMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const intervalsRef = useRef<NodeJS.Timeout[]>([]);
  const shipProgressRef = useRef<Array<{ segmentIndex: number; progress: number }>>([]);
  const onLocationClickRef = useRef(onLocationClick);

  useEffect(() => {
    onLocationClickRef.current = onLocationClick;
  }, [onLocationClick]);

  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

    if (!containerRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      center: shipLocation[0].coordinates[0] as [number, number],
      zoom: 4,
      minZoom: 4,
    });

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      console.log('Map click event fired', e);

      const target = e.originalEvent?.target as HTMLElement;
      if (target) {
        const clickedMarker = target.closest('.mapboxgl-marker');
        const clickedPopup = target.closest('.mapboxgl-popup');

        if (clickedMarker || clickedPopup) {
          console.log('Click was on existing marker/popup, skipping');
          return;
        }
      }

      const lngLat = e.lngLat;
      const centerObj = { lng: lngLat.lng, lat: lngLat.lat };
      console.log('Creating marker at:', centerObj);

      if (onLocationClickRef.current) {
        onLocationClickRef.current(centerObj);
      }

      try {
        const markerNumber = clickMarkersRef.current.length + 1;
        const marker = createClickMarker({
          map: mapRef.current!,
          lngLat,
          onMarkerCreated: (m) => {
            clickMarkersRef.current.push(m);
            console.log('Marker added to refs, total markers:', clickMarkersRef.current.length);
          }
        });
        console.log('Marker created:', marker);
      } catch (error) {
        console.error('Failed to create marker:', error);
      }
    };

    mapRef.current.on('click', handleClick);

    mapRef.current.on('load', () => {
      if (mapRef.current!.getSource('ship-paths')) {
        if (mapRef.current!.getLayer('ship-paths-line')) {
          mapRef.current!.removeLayer('ship-paths-line');
        }
        mapRef.current!.removeSource('ship-paths');
      }

      const { source, layer } = createShipPathLayer(shipLocation);
      mapRef.current!.addSource('ship-paths', source);
      mapRef.current!.addLayer(layer as mapboxgl.LayerSpecification);
      shipLocation.forEach((ship, index) => {
        createShipMarkers({ map: mapRef.current!, ship });


        const interval = createMovingShip({
          map: mapRef.current!,
          ship,
          shipIndex: index,
          onProgressUpdate: (idx, state) => {
            shipProgressRef.current[idx] = state;
          },
          onComplete: (idx) => {
            console.log(`${shipLocation[idx].name} reached final destination`);
          }
        });

        intervalsRef.current.push(interval);
      });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.off('click', handleClick);
        if (mapRef.current.getLayer('ship-paths-line')) {
          mapRef.current.removeLayer('ship-paths-line');
        }
        if (mapRef.current.getSource('ship-paths')) {
          mapRef.current.removeSource('ship-paths');
        }
      }
      intervalsRef.current.forEach(interval => clearInterval(interval));
      intervalsRef.current = [];
      shipMarkersRef.current.forEach(marker => marker.remove());
      shipMarkersRef.current = [];
      clickMarkersRef.current.forEach(marker => marker.remove());
      clickMarkersRef.current = [];
    };
  }, [containerRef]);

  return { mapRef };
};

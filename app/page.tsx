'use client';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useRef, useState } from "react";
import { useMap } from '@/hooks/useMap';
import { VideoPlayers } from '@/components/VideoPlayers';

export default function Page() {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const [latlong, setLatlong] = useState<Array<{ lng: number, lat: number }>>([
    ]);

    const handleLocationClick = (centerObj: { lng: number; lat: number }) => {
        setLatlong((prev) => {
            return [...prev, centerObj];
        });
    };

    useMap(mapContainerRef, handleLocationClick);

    return (
        <div>
            <VideoPlayers />
            <div
                style={{ height: '100vh', width: '100vw' }}
                ref={mapContainerRef}
                className="map-container"
            />
        </div>
    );
}
'use client';
import { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';

interface Video {
    url: string;
    name: string;
}

interface VideoPlayerProps {
    video: Video;
}

interface VideoPlayerProps {
    video: Video;
    onDetach?: (video: Video) => void;
}

function VideoPlayer({ video, onDetach }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const hlsRef = useRef<Hls | null>(null);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        const hlsUrl = video.url;

        if (Hls.isSupported()) {
            const hls = new Hls();
            hlsRef.current = hls;
            hls.loadSource(hlsUrl);
            hls.attachMedia(videoElement);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                videoElement.play().catch(console.error);
            });

            return () => {
                hls.destroy();
            };
        } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari)
            videoElement.src = hlsUrl;
            videoElement.play().catch(console.error);
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }
        };
    }, [video.url]);

    return (
        <div
            style={{
                position: 'relative',
                display: 'inline-block',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {isHovered && onDetach && (
                <button
                    onClick={() => onDetach(video)}
                    style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        zIndex: 10,
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        border: '2px solid white',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}
                    title="Detach and drag video"
                >
                    ⛶
                </button>
            )}
            <video
                ref={videoRef}
                controls
                autoPlay
                muted
                loop
                title={video.name}
                style={{
                    width: '350px',
                    height: '150px',
                    objectFit: 'cover',
                    display: 'block',
                }}
            />
        </div>
    );
}

interface DetachedVideo {
    video: Video;
    id: string;
    position: { x: number; y: number };
}

const DetachedVideoPlayer = ({ detachedVideo, onClose }: { detachedVideo: DetachedVideo; onClose: () => void }) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const hlsRef = useRef<Hls | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [position, setPosition] = useState(detachedVideo.position);
    const [isDragging, setIsDragging] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const dragOffsetRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        const hlsUrl = detachedVideo.video.url;

        if (Hls.isSupported()) {
            const hls = new Hls();
            hlsRef.current = hls;
            hls.loadSource(hlsUrl);
            hls.attachMedia(videoElement);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                videoElement.play().catch(console.error);
            });

            return () => {
                hls.destroy();
            };
        } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            videoElement.src = hlsUrl;
            videoElement.play().catch(console.error);
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }
        };
    }, [detachedVideo.video.url]);

    const handleMouseDown = (e: React.MouseEvent) => {
        // Don't allow dragging in fullscreen mode
        if (isFullscreen) return;
        // Don't start dragging if clicking on video controls or buttons
        const target = e.target as HTMLElement;
        if (target.tagName === 'VIDEO' || target.closest('video')) {
            // Check if clicking on video controls area (bottom 50px is typically controls)
            const videoElement = videoRef.current;
            if (videoElement) {
                const rect = videoElement.getBoundingClientRect();
                const clickY = e.clientY - rect.top;
                const videoHeight = rect.height;
                // If clicking in the bottom 50px (controls area), don't drag
                if (clickY > videoHeight - 50) {
                    return;
                }
            }
        }
        if (target.tagName === 'BUTTON' || target.closest('button')) {
            return;
        }
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        dragOffsetRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
        setIsDragging(true);
    };

    const toggleFullscreen = async () => {
        if (!containerRef.current) return;

        try {
            if (!isFullscreen) {
                // Enter fullscreen
                if (containerRef.current.requestFullscreen) {
                    await containerRef.current.requestFullscreen();
                } else if ((containerRef.current as any).webkitRequestFullscreen) {
                    await (containerRef.current as any).webkitRequestFullscreen();
                } else if ((containerRef.current as any).mozRequestFullScreen) {
                    await (containerRef.current as any).mozRequestFullScreen();
                } else if ((containerRef.current as any).msRequestFullscreen) {
                    await (containerRef.current as any).msRequestFullscreen();
                }
            } else {
                // Exit fullscreen
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if ((document as any).webkitExitFullscreen) {
                    await (document as any).webkitExitFullscreen();
                } else if ((document as any).mozCancelFullScreen) {
                    await (document as any).mozCancelFullScreen();
                } else if ((document as any).msExitFullscreen) {
                    await (document as any).msExitFullscreen();
                }
            }
        } catch (error) {
            console.error('Error toggling fullscreen:', error);
        }
    };

    // useEffect(() => {
    //     const handleFullscreenChange = () => {
    //         const isCurrentlyFullscreen = !!(
    //             document.fullscreenElement ||
    //             (document as any).webkitFullscreenElement ||
    //             (document as any).mozFullScreenElement ||
    //             (document as any).msFullscreenElement
    //         );
    //         setIsFullscreen(isCurrentlyFullscreen);
    //     };

    //     document.addEventListener('fullscreenchange', handleFullscreenChange);
    //     document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    //     document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    //     document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    //     return () => {
    //         document.removeEventListener('fullscreenchange', handleFullscreenChange);
    //         document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    //         document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    //         document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    //     };
    // }, []);

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            setPosition({
                x: e.clientX - dragOffsetRef.current.x,
                y: e.clientY - dragOffsetRef.current.y,
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    return (
        <div
            ref={containerRef}
            style={{
                position: 'fixed',
                left: isFullscreen ? '0' : `${position.x}px`,
                top: isFullscreen ? '0' : `${position.y}px`,
                width: isFullscreen ? '100vw' : 'auto',
                height: isFullscreen ? '100vh' : 'auto',
                zIndex: 2000,
                cursor: isDragging && !isFullscreen ? 'grabbing' : isFullscreen ? 'default' : 'grab',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isFullscreen ? 'rgba(0, 0, 0, 1)' : 'transparent',
            }}
            onMouseDown={handleMouseDown}
        >
            <div style={{
                position: 'relative',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderRadius: isFullscreen ? '0' : '8px',
                padding: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                width: isFullscreen ? '100%' : 'auto',
                height: isFullscreen ? '100%' : 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <div style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    display: 'flex',
                    gap: '4px',
                    zIndex: 10,
                }}>

                    <button
                        onClick={onClose}
                        style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: 'red',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        title="Close"
                    >
                        X
                    </button>
                </div>
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    loop
                    controls
                    title={detachedVideo.video.name}
                    style={{
                        width: isFullscreen ? '100%' : '350px',
                        height: isFullscreen ? '100%' : '150px',
                        objectFit: isFullscreen ? 'contain' : 'cover',
                        display: 'block',
                    }}
                />
            </div>
        </div>
    );
}

export const VideoPlayers = () => {
    const [isVisible, setIsVisible] = useState(true);
    const [detachedVideos, setDetachedVideos] = useState<DetachedVideo[]>([]);
    const videos: Video[] = [
        {
            url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
            name: 'Tears of Steel'
        },
        {
            url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8',
            name: 'Bipbop'
        },
        // {
        //     url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
        //     name: 'some'
        // },
        // {
        //     url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8',
        //     name: 'Bipbop'
        // },
    ];

    const toggleVisibility = () => {
        setIsVisible(!isVisible);
    };

    const handleDetach = (video: Video) => {
        const newDetachedVideo: DetachedVideo = {
            video,
            id: `${video.url}-${Date.now()}`,
            position: { x: 100 + detachedVideos.length * 20, y: 100 + detachedVideos.length * 20 },
        };
        setIsVisible(false)
        setDetachedVideos([...detachedVideos, newDetachedVideo]);
    };

    const handleCloseDetached = (id: string) => {
        setDetachedVideos(detachedVideos.filter(dv => dv.id !== id));
    };

    return (
        <>
            <button
                onClick={toggleVisibility}
                style={{
                    position: 'absolute',
                    top: isVisible ? '20%' : '0',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1001,
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    transition: 'top 0.3s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
            >
                {isVisible ? 'Hide live streams' : 'Show live streams'}
            </button>

            <div style={{
                position: 'absolute',
                top: '0',
                left: 0,
                width: '100%',
                height: '20%',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'row',
                gap: '10px',
                padding: '10px',
                overflow: 'scroll',

                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
                pointerEvents: isVisible ? 'auto' : 'none',
                transition: 'opacity 0.3s ease, transform 0.3s ease',
            }}>
                {isVisible && videos.map((video, index) => (
                    <VideoPlayer key={index} video={video} onDetach={handleDetach} />
                ))}
            </div>

            {detachedVideos.map((detachedVideo) => (
                <DetachedVideoPlayer
                    key={detachedVideo.id}
                    detachedVideo={detachedVideo}
                    onClose={() => handleCloseDetached(detachedVideo.id)}
                />
            ))}
        </>
    );
}

import React, { useEffect, useRef } from 'react';

export default function VideoPlayer(props: any) {
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.addEventListener("loadedmetadata", handleVideoLoaded);
        }
        return () => {
            if (videoRef.current) {
                videoRef.current.removeEventListener("loadedmetadata", handleVideoLoaded);
            }
        };
    }, [videoRef.current]);

    const handleVideoLoaded = () => {
        props.onVideoLoaded(videoRef.current);
    };

    return(
        <video ref={videoRef} key={props.videoSrc} className='w-[1200px] h-auto rounded-md shadow-md overflow-hidden'>
            <source src={props.videoSrc} type="video/mp4" />
            Su navegador no soporta la etiqueta de vídeo.
        </video>
    )
}

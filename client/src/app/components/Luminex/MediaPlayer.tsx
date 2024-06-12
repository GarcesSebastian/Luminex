/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useState, useEffect } from 'react';
import Options from './MediaPlayer/Options';
import VideoPlayer from './MediaPlayer/VideoPlayer';
import { ErrorAlert } from './Alerts/Error';
import { Loader } from './Loaders/Loader';
import * as Functions from '../../ts/Functions';
import { log } from 'console';

export default function MediaPlayer() {
    const [videoSrc, setVideoSrc] = useState("");
    const [isPlaying, setPlaying] = useState(true);
    const [namePlayer, setNamePlayer] = useState("");
    const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
    const [currentTime, setCurrentTime] = useState<number>();
    const [duration, setDuration] = useState<number>();
    const [thumbnails, setThumbnails] = useState<{ image: string, value: number }[] | undefined>([]);
    const [thumbnailFather, setThumbnailFather] = useState<string>();
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [value, setValue] = useState(currentTime);
    const [volume, setVolume] = useState(1);
    const [isView, setIsView] = useState<boolean>(false);
    const [isError, setIsError] = useState<boolean>(false);
    const [qualities, setQuality] = useState<any[]>([]);
    const [qualitiesRange, setQualityRange] = useState<string[]>([]);

    function getCookieValue(cookieName: string) {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith(cookieName + '=')) {
                return cookie.substring(cookieName.length + 1);
            }
        }
        return null;
    }

    useEffect(() => {
        const contentVideo = document.querySelector("#content-video");
        const contentFrameTest = document.querySelector("#content-frame-test");

        if (!isUploading) {
            if (contentFrameTest) contentFrameTest.classList.add("hidden");
            if (contentVideo) contentVideo.classList.remove("hidden");
            handlePlayVideo(undefined);
        } else {
            if (contentFrameTest) contentFrameTest.classList.remove("hidden");
            if (contentVideo) contentVideo.classList.add("hidden");
        }
    }, [isUploading]);

    useEffect(() => {
        if (videoElement) {
            videoElement.volume = volume;
        }
    }, [volume]);

    useEffect(() => {
        const alertError = document.querySelector("#alertError") as HTMLElement;

        if(isError){
            alertError?.classList.replace("animate-deployment-invert", "animate-deployment");
            alertError?.classList.replace("hidden", "flex");
        }else{
            alertError?.classList.replace("animate-deployment", "animate-deployment-invert");
            alertError?.classList.replace("flex", "hidden");

            return;
        }

        setTimeout(() => {
            setIsError(false);
        }, 2000);
    }, [isError])
       
    const generateThumbnails = async (file: any, progressBar: any, duration: number): Promise<{ image: string, value: number }[] | undefined> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('duration', duration.toString());

        try {
            const response = await fetch('http://localhost:4000/upload', {
                method: 'POST',
                headers: {
                    'client-id': getCookieValue('clientId') || 'unknown',
                },
                body: formData,
            });

            if (response.ok) {
                const result = await response.json();
                const imagesResult: string[] = result.images;

                const lengthInterval = Math.ceil(duration / 25);
                const intervals: { image: string, value: number }[] = Array.from({ length: lengthInterval }, (_, i) => ({ image: imagesResult[i], value: duration / 25 }));
                
                return intervals;
            } else {
                console.log('Failed to upload video file');
                return undefined;
            }
        } catch (error) {
            console.log('Error uploading video file:', error);

            return undefined;
        }
    };
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isUploading) return;
    
        const file = e.target.files?.[0];
        if (file) {
            const type = file.type.split("/")[0];

            if(type != "video"){
                setIsError(true);
                return undefined;
            }
            
            setVideoSrc("");
            setNamePlayer("");
            setDuration(0);
            setThumbnails([]);
            setCurrentTime(0);
            setIsUploading(false);
            setPlaying(false);
            document.querySelector("#preview-time-generate")?.classList.replace("flex", "hidden");
            document.querySelector("#content-upload-file")?.classList.replace("grid", "hidden");

            const videoURL = URL.createObjectURL(file);
            setVideoSrc(videoURL);
            setNamePlayer(file.name);
            setIsUploading(true);
    
            const contentProgressBar = document.querySelector("#content_progressBar");
            const progressBar = document.querySelector("#progress-value") as HTMLElement;
    
            if (contentProgressBar) contentProgressBar.classList.remove("hidden");
    
            const video = document.createElement("video");
            video.src = videoURL;
            let intervals: { image: string, value: number }[] | undefined = Array.from([]);
    
            await new Promise<void>((resolve) => {
                video.addEventListener("loadedmetadata", async () => {
                    setDuration(video.duration);
                    setValue(video.currentTime);
                    setCurrentTime(video.currentTime);
                    setVolume(video.volume);

                    intervals = await generateThumbnails(file, progressBar, video.duration);
                    setThumbnails(intervals);
                    resolve();
                });
            });

            const qualities_range: any = ["360p", "480p", "720p", "1080p"]
            const qualities_range_clone: any = qualities_range.slice();
            qualities.splice(0, qualities.length);

            for (const [index, qual] of qualities_range.entries()) {
                const url_qual: any = await Functions.changeVideoResolution(file, qual, index, getCookieValue('clientId') || 'unknown');
                
                if(url_qual && url_qual.status != "File not found" && url_qual.status != "Is quality"){
                    qualities.push({ range: qual, quality: url_qual });
                }

                if(url_qual.status == "File not found"){
                    qualities.push({ range: qual, quality: "unknown" });
                    qualities_range_clone.splice(qualities_range_clone.indexOf(qual), 1);
                }

                if(url_qual.status == "Is quality"){
                    qualities.push({ range: `${url_qual.range}p`, quality: videoURL });
                }
            }

            setQualityRange(qualities_range_clone);
            
            const contentVideo = document.querySelector("#content-video");

            if (contentVideo) contentVideo.classList.remove("hidden");
            if (progressBar) progressBar.style.width = "100%";

            setIsUploading(false);
            setPlaying(false);
            document.querySelector("#preview-time-generate")?.classList.replace("hidden", "flex");
            document.querySelector("#content-upload-file")?.classList.replace("hidden", "grid");
        }

        setIsUploading(false);
        setPlaying(false);
        document.querySelector("#preview-time-generate")?.classList.replace("hidden", "flex");
        document.querySelector("#content-upload-file")?.classList.replace("hidden", "grid");
    };
    
    const handlePlayVideo = (e: React.MouseEvent<HTMLButtonElement> | undefined) => {

        const id_allowed = ["section-select", "btn-play-center", "image-player-play-center", "btn-play", "image-player-play"]

        if(e){
            const target = e.target as HTMLButtonElement;
            if(!id_allowed.includes(target.id)){
                return;
            }
        }
        
        if (!videoElement) {
            return;
        }

        if (!isPlaying) {
            videoElement.play();
            (document.querySelector("#image-player-play") as HTMLImageElement).src = "/icons/player-pause.svg";
            (document.querySelector("#btn-play-center") as HTMLImageElement).classList.replace("animate-showOpacity", "animate-hiddenOpacity");
            (document.querySelector("#btn-play-center") as HTMLImageElement).style.display = "none";
            setPlaying(true);
        } else {
            videoElement.pause();
            (document.querySelector("#image-player-play") as HTMLImageElement).src = "/icons/player-play.svg";
            (document.querySelector("#image-player-play-center") as HTMLImageElement).src = "/icons/player-play.svg";
            (document.querySelector("#btn-play-center") as HTMLImageElement).classList.replace("animate-hiddenOpacity", "animate-showOpacity");
            (document.querySelector("#btn-play-center") as HTMLImageElement).style.display = "flex"

            setPlaying(false);
        }

        if (!isPlaying) {
            videoElement.play();
            setPlaying(true);
        } else {
            videoElement.pause();
            setPlaying(false);
        }
    };

    const handleVideoLoaded = (video: HTMLVideoElement | null) => {
        if (video) {
            setVideoElement(video);
            setDuration(video.duration);
            video.addEventListener("timeupdate", handleTimeUpdate);
        }
    };

    const handleTimeUpdate = () => {
        setCurrentTime((document.querySelector("#videoPlayer") as HTMLVideoElement)?.currentTime);
    };

    return (
        <div className='flex flex-col w-full items-center gap-y-5'>
            {videoSrc && (
                <div className='bg-black w-fit h-fit relative rounded-md shadow-lg shadow-gray-900'>
                    <div id="content-video" className="group flex">
                        <VideoPlayer videoSrc={videoSrc} onVideoLoaded={handleVideoLoaded} />
                        <Options
                            videoSrc={videoSrc}
                            name={namePlayer}
                            isPlaying={isPlaying}
                            currentTime={currentTime}
                            duration={duration}
                            handlePlayVideo={handlePlayVideo}
                            onVideoLoaded={handleVideoLoaded}
                            thumbnails={thumbnails}
                            value={value}
                            setValue={setValue}
                            setVolume={setVolume}
                            volume={volume}
                            isView={isView}
                            setIsView={setIsView}
                            thumbnailFather={thumbnailFather}
                            setThumbnailFather={setThumbnailFather}
                            videoPlayer={videoElement}
                            qualities={qualities}
                            qualitiesRange={qualitiesRange}
                        />
                    </div>
                </div>
            )}

            <ErrorAlert message='El tipo de archivo no es compatible. :)' id="alertError" isError={isError} setIsError={setIsError}/>
            <Loader id='loader' isLoading={isUploading}/>

            <div id="content-upload-file" className="w-full max-w-2xl grid relative gap-5 mb-5">
                <div className="w-full py-9">
                    <div className="grid gap-3">
                        <div className="grid gap-2">
                            <div className="flex items-center justify-center">
                                <label>
                                <input id="upload-video" type="file" onChange={handleFileChange} hidden />
                                <div className="group cursor-pointer outline-none hover:rotate-90 duration-300">
                                <svg xmlns="http://www.w3.org/2000/svg" width="50px" height="50px"
                                    viewBox="0 0 24 24"
                                    className="stroke-indigo-400 fill-none group-hover:fill-indigo-800 group-active:stroke-indigo-200 group-active:fill-indigo-600 group-active:duration-0 duration-300"
                                >
                                    <path
                                    d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z"
                                    stroke-width="1.5"
                                    ></path>
                                    <path d="M8 12H16" stroke-width="1.5"></path>
                                    <path d="M12 16V8" stroke-width="1.5"></path>
                                </svg>
                                </div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

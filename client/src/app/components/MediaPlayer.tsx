"use client";

import React, { useState, useEffect } from 'react';
import Options from './MediaPlayer/Options';
import VideoPlayer from './MediaPlayer/VideoPlayer';
import * as States from '../ts/States';
import { ErrorAlert } from './Alerts/Error';
import { Loader } from './Loaders/Loader';
import * as Functions from '../ts/Functions';

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
    const [seconds, setSeconds] = useState<number>(0);
    const [isCounting, setIsCounting] = useState<boolean>(false);
    const [value, setValue] = useState(currentTime);
    const [volume, setVolume] = useState(1);
    const [isView, setIsView] = useState<boolean>(false);
    const [isError, setIsError] = useState<boolean>(false);
    const [qualities, setQuality] = useState<any[]>([]);

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
        setSeconds(States.timeCount(isCounting));
    }, [isCounting]);

    useEffect(() => {
        if (videoElement) {
            videoElement.volume = volume;
        }
    }, [volume]);

    useEffect(() => {
        const options_content = document.querySelector('#options-content') as HTMLElement;
        const header_options = options_content?.querySelector("header") as HTMLElement;
        const section_options = options_content?.querySelector("section") as HTMLElement;
        const footer_options = options_content?.querySelector("footer") as HTMLElement;

        if(!options_content || !header_options || !section_options || !footer_options) return ;

        if(!isView){
            header_options?.classList.replace("flex", "hidden");
            section_options?.classList.replace("flex", "hidden");
            footer_options?.classList.replace("flex", "hidden");
        }else{
            header_options?.classList.replace("hidden", "flex");
            section_options?.classList.replace("hidden", "flex");
            footer_options?.classList.replace("hidden", "flex");
        }

    },[isView])

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
    
        setVideoSrc("");
        setNamePlayer("");
        setDuration(0);
        setThumbnails([]);
        setCurrentTime(0);
        setIsUploading(false);
        setPlaying(false);
        document.querySelector("#preview-time-generate")?.classList.replace("flex", "hidden");
        document.querySelector("#content-upload-file")?.classList.replace("grid", "hidden");
    
        const file = e.target.files?.[0];
        if (file) {
            const type = file.type.split("/")[0];

            if(type != "video"){
                setIsError(true);
                setIsUploading(false);
                setPlaying(false);
                setIsCounting(false);
                document.querySelector("#preview-time-generate")?.classList.replace("hidden", "flex");
                document.querySelector("#content-upload-file")?.classList.replace("hidden", "grid");
                return undefined;
            }

            setIsCounting(true);
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
            qualities.splice(0, qualities.length);

            for (const [index, qual] of qualities_range.entries()) {
                const url_qual = await Functions.changeVideoResolution(file, qual, index, getCookieValue('clientId') || 'unknown');

                if(!url_qual){
                    return;
                }

                qualities.push({ range: qual, quality: url_qual });
            }
            
            const contentVideo = document.querySelector("#content-video");

            if (contentVideo) contentVideo.classList.remove("hidden");
            if (progressBar) progressBar.style.width = "100%";

            setIsUploading(false);
            setPlaying(false);
            setIsCounting(false);
            document.querySelector("#preview-time-generate")?.classList.replace("hidden", "flex");
            document.querySelector("#content-upload-file")?.classList.replace("hidden", "grid");
        }

        setIsUploading(false);
        setPlaying(false);
        setIsCounting(false);
        document.querySelector("#preview-time-generate")?.classList.replace("hidden", "flex");
        document.querySelector("#content-upload-file")?.classList.replace("hidden", "grid");
    };
    
    const handlePlayVideo = (e: React.MouseEvent<HTMLButtonElement> | undefined) => {

        if(e){
            const target = e.target as HTMLButtonElement;
            if(target.id !== "section-select" && target.id !== "btn-play-center" && target.id !== "image-player-play-center"){
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
                    <div id="content-video" className="group hidden">
                        <VideoPlayer videoSrc={videoSrc} onVideoLoaded={handleVideoLoaded} />
                        <Options
                            videoSrc={videoSrc}
                            name={namePlayer}
                            eventPlay={handlePlayVideo}
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
                                    <div className="flex w-fit h-fit p-2 bg-indigo-600 hover:bg-indigo-700 transition-all duration-200 ease-in-out rounded-full shadow text-white items-center justify-center cursor-pointer">
                                        <svg className='w-10 h-10' viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <g id="File">
                                                <path id="icon" d="M31.6497 10.6056L32.2476 10.0741L31.6497 10.6056ZM28.6559 7.23757L28.058 7.76907L28.058 7.76907L28.6559 7.23757ZM26.5356 5.29253L26.2079 6.02233L26.2079 6.02233L26.5356 5.29253ZM33.1161 12.5827L32.3683 12.867V12.867L33.1161 12.5827ZM31.8692 33.5355L32.4349 34.1012L31.8692 33.5355ZM24.231 11.4836L25.0157 11.3276L24.231 11.4836ZM26.85 14.1026L26.694 14.8872L26.85 14.1026ZM11.667 20.8667C11.2252 20.8667 10.867 21.2248 10.867 21.6667C10.867 22.1085 11.2252 22.4667 11.667 22.4667V20.8667ZM25.0003 22.4667C25.4422 22.4667 25.8003 22.1085 25.8003 21.6667C25.8003 21.2248 25.4422 20.8667 25.0003 20.8667V22.4667ZM11.667 25.8667C11.2252 25.8667 10.867 26.2248 10.867 26.6667C10.867 27.1085 11.2252 27.4667 11.667 27.4667V25.8667ZM20.0003 27.4667C20.4422 27.4667 20.8003 27.1085 20.8003 26.6667C20.8003 26.2248 20.4422 25.8667 20.0003 25.8667V27.4667ZM23.3337 34.2H16.667V35.8H23.3337V34.2ZM7.46699 25V15H5.86699V25H7.46699ZM32.5337 15.0347V25H34.1337V15.0347H32.5337ZM16.667 5.8H23.6732V4.2H16.667V5.8ZM23.6732 5.8C25.2185 5.8 25.7493 5.81639 26.2079 6.02233L26.8633 4.56274C26.0191 4.18361 25.0759 4.2 23.6732 4.2V5.8ZM29.2539 6.70608C28.322 5.65771 27.7076 4.94187 26.8633 4.56274L26.2079 6.02233C26.6665 6.22826 27.0314 6.6141 28.058 7.76907L29.2539 6.70608ZM34.1337 15.0347C34.1337 13.8411 34.1458 13.0399 33.8638 12.2984L32.3683 12.867C32.5216 13.2702 32.5337 13.7221 32.5337 15.0347H34.1337ZM31.0518 11.1371C31.9238 12.1181 32.215 12.4639 32.3683 12.867L33.8638 12.2984C33.5819 11.5569 33.0406 10.9662 32.2476 10.0741L31.0518 11.1371ZM16.667 34.2C14.2874 34.2 12.5831 34.1983 11.2872 34.0241C10.0144 33.8529 9.25596 33.5287 8.69714 32.9698L7.56577 34.1012C8.47142 35.0069 9.62375 35.4148 11.074 35.6098C12.5013 35.8017 14.3326 35.8 16.667 35.8V34.2ZM5.86699 25C5.86699 27.3344 5.86529 29.1657 6.05718 30.593C6.25217 32.0432 6.66012 33.1956 7.56577 34.1012L8.69714 32.9698C8.13833 32.411 7.81405 31.6526 7.64292 30.3798C7.46869 29.0839 7.46699 27.3796 7.46699 25H5.86699ZM23.3337 35.8C25.6681 35.8 27.4993 35.8017 28.9266 35.6098C30.3769 35.4148 31.5292 35.0069 32.4349 34.1012L31.3035 32.9698C30.7447 33.5287 29.9863 33.8529 28.7134 34.0241C27.4175 34.1983 25.7133 34.2 23.3337 34.2V35.8ZM32.5337 25C32.5337 27.3796 32.532 29.0839 32.3577 30.3798C32.1866 31.6526 31.8623 32.411 31.3035 32.9698L32.4349 34.1012C33.3405 33.1956 33.7485 32.0432 33.9435 30.593C34.1354 29.1657 34.1337 27.3344 34.1337 25H32.5337ZM7.46699 15C7.46699 12.6204 7.46869 10.9161 7.64292 9.62024C7.81405 8.34738 8.13833 7.58897 8.69714 7.03015L7.56577 5.89878C6.66012 6.80443 6.25217 7.95676 6.05718 9.40704C5.86529 10.8343 5.86699 12.6656 5.86699 15H7.46699ZM16.667 4.2C14.3326 4.2 12.5013 4.1983 11.074 4.39019C9.62375 4.58518 8.47142 4.99313 7.56577 5.89878L8.69714 7.03015C9.25596 6.47133 10.0144 6.14706 11.2872 5.97592C12.5831 5.8017 14.2874 5.8 16.667 5.8V4.2ZM23.367 5V10H24.967V5H23.367ZM28.3337 14.9667H33.3337V13.3667H28.3337V14.9667ZM23.367 10C23.367 10.7361 23.3631 11.221 23.4464 11.6397L25.0157 11.3276C24.9709 11.1023 24.967 10.8128 24.967 10H23.367ZM28.3337 13.3667C27.5209 13.3667 27.2313 13.3628 27.0061 13.318L26.694 14.8872C27.1127 14.9705 27.5976 14.9667 28.3337 14.9667V13.3667ZM23.4464 11.6397C23.7726 13.2794 25.0543 14.5611 26.694 14.8872L27.0061 13.318C26.0011 13.1181 25.2156 12.3325 25.0157 11.3276L23.4464 11.6397ZM11.667 22.4667H25.0003V20.8667H11.667V22.4667ZM11.667 27.4667H20.0003V25.8667H11.667V27.4667ZM32.2476 10.0741L29.2539 6.70608L28.058 7.76907L31.0518 11.1371L32.2476 10.0741Z" fill="#fafafa" />
                                            </g>
                                        </svg>
                                    <h2 className="text-center text-gray-0 text-xs font-light leading-4">MP4, OGG, WebM - archivos de videos permitidos</h2>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="preview-time-generate" className="w-fit hidden mb-5 text-white font-bold">
                <div className="w-fit h-fit p-1.5 bg-indigo-600 rounded-md">
                    Time generate: {(seconds / 1000)}s
                </div>
            </div>  
        </div>
    );
}

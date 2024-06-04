"use client";

import React, { useState, useEffect } from 'react';
import Options from './MediaPlayer/Options';
import VideoPlayer from './MediaPlayer/VideoPlayer';
import * as States from '../js/States';

export default function MediaPlayer() {
    const [videoSrc, setVideoSrc] = useState("");
    const [isPlaying, setPlaying] = useState(true);
    const [namePlayer, setNamePlayer] = useState("");
    const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
    const [currentTime, setCurrentTime] = useState<number>();
    const [duration, setDuration] = useState<number>();
    const [thumbnails, setThumbnails] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [progress, setProgress] = useState<any>(0);
    const [seconds, setSeconds] = useState<number>(0);
    const [isCounting, setIsCounting] = useState<boolean>(false);
    const [value, setValue] = useState(currentTime);
    const [volume, setVolume] = useState(1);
    const [isView, setIsView] = useState<boolean>(false);

    useEffect(() => {
        const contentVideo = document.querySelector("#content-video");
        const contentFrameTest = document.querySelector("#content-frame-test");

        if (!isUploading) {
            if (contentFrameTest) contentFrameTest.classList.add("hidden");
            if (contentVideo) contentVideo.classList.remove("hidden");
            handlePlayVideo();
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

    const getThumbnailForVideo: any = async (videoUrl: string, seekTime: number) => {
        const video = document.createElement("video");
        const canvas = document.createElement("canvas");
        video.style.display = "none";
        canvas.style.display = "none";
        document.body.appendChild(video);
        document.body.appendChild(canvas);

        await new Promise<void>((resolve) => {
            video.addEventListener("loadedmetadata", () => {
                video.width = video.videoWidth;
                video.height = video.videoHeight;
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                video.currentTime = seekTime;
            });
            video.addEventListener("seeked", () => resolve());
            video.src = videoUrl;
            video.load();
        });

        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
        const imageUrl = canvas.toDataURL("image/png");

        document.body.removeChild(video);
        document.body.removeChild(canvas);

        return imageUrl as string;
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {

        if(isUploading) return;

        setVideoSrc("");
        setNamePlayer("");
        setDuration(0);
        setThumbnails([]);
        setCurrentTime(0);
        setIsUploading(false);
        setPlaying(false);

        const file = e.target.files?.[0];
        if (file) {
            setIsCounting(true);
            const videoURL = URL.createObjectURL(file);
            setVideoSrc(videoURL);
            setNamePlayer(file.name);
            setIsUploading(true);

            const contentProgressBar = document.querySelector("#content_progressBar");
            const progressBar = document.querySelector("#progress-value") as HTMLElement;
            const list_files = document.querySelector("#list-files");
            if (list_files) {
                list_files.classList.remove("hidden")
                list_files.classList.add("grid");
            };

            if (contentProgressBar) contentProgressBar.classList.remove("hidden");

            const video = document.createElement("video");
            video.src = videoURL;
            let intervals: number[] = Array.from([]);

            await new Promise<void>((resolve) => {
                video.addEventListener("loadedmetadata", () => {
                    setDuration(video.duration);
                    setValue(video.currentTime);
                    setCurrentTime(video.currentTime);
                    setVolume(video.volume);
                    intervals = Array.from({ length: Math.floor(video.duration)}, (_, i) => i);
                    resolve();
                });
            });

            console.log(intervals)

            const generateThumbnails = async () => {
                for (const interval of intervals) {

                    const percentage = interval * 100;
                    setProgress(percentage / intervals.length);

                    if (progressBar){
                        progressBar.style.width = (percentage / intervals.length) + "%";
                    }

                    const seekTime = (interval / intervals.length) * (video.duration ?? 0);
                    const imageURL = await getThumbnailForVideo(videoURL, seekTime);
                    (document.querySelector("#frameTest") as HTMLImageElement).src = imageURL;
                    setThumbnails((prevThumbnails: any) => [...prevThumbnails, imageURL]);
                }

                const contentVideo = document.querySelector("#content-video");


                if (contentVideo) contentVideo.classList.remove("hidden");
                if (progressBar) progressBar.style.width = "100%";

                setIsUploading(false);
                setPlaying(false);
                setIsCounting(false);
            };

            generateThumbnails();
        }
    };
    
    const handlePlayVideo = () => {
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
    };

    const handleVideoLoaded = (video: HTMLVideoElement | null) => {
        if (video) {
            setVideoElement(video);
            setDuration(video.duration);
            video.addEventListener("timeupdate", handleTimeUpdate);
        }
    };

    const handleTimeUpdate = () => {
        setCurrentTime(document.querySelector("video")?.currentTime);
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
                        />
                    </div>
                </div>
            )}

            {videoSrc && (
                <div className='w-fit h-fit flex flex-col gap-y-4 pt-4'>
                    <div id="content-frame-test" className="flex-col relative top-0 hidden gap-y-1 justify-center w-full max-w-2xl h-fit items-center p-1 bg-indigo-600 shadow-lg shadow-indigo-600 rounded-md">
                        <img id="frameTest" src="https://placehold.co/150x100" className="w-full h-full object-cover rounded-md" />
                    </div>
                </div>
            )}

            <div className="w-full max-w-2xl grid relative gap-5 mb-10">
                <div className="w-full py-9 bg-gray-50 rounded-2xl border border-gray-300 border-dashed">
                    <div className="grid gap-3">
                        <div>
                            <svg className="mx-auto mb-1" width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g id="File">
                                <path id="icon" d="M31.6497 10.6056L32.2476 10.0741L31.6497 10.6056ZM28.6559 7.23757L28.058 7.76907L28.058 7.76907L28.6559 7.23757ZM26.5356 5.29253L26.2079 6.02233L26.2079 6.02233L26.5356 5.29253ZM33.1161 12.5827L32.3683 12.867V12.867L33.1161 12.5827ZM31.8692 33.5355L32.4349 34.1012L31.8692 33.5355ZM24.231 11.4836L25.0157 11.3276L24.231 11.4836ZM26.85 14.1026L26.694 14.8872L26.85 14.1026ZM11.667 20.8667C11.2252 20.8667 10.867 21.2248 10.867 21.6667C10.867 22.1085 11.2252 22.4667 11.667 22.4667V20.8667ZM25.0003 22.4667C25.4422 22.4667 25.8003 22.1085 25.8003 21.6667C25.8003 21.2248 25.4422 20.8667 25.0003 20.8667V22.4667ZM11.667 25.8667C11.2252 25.8667 10.867 26.2248 10.867 26.6667C10.867 27.1085 11.2252 27.4667 11.667 27.4667V25.8667ZM20.0003 27.4667C20.4422 27.4667 20.8003 27.1085 20.8003 26.6667C20.8003 26.2248 20.4422 25.8667 20.0003 25.8667V27.4667ZM23.3337 34.2H16.667V35.8H23.3337V34.2ZM7.46699 25V15H5.86699V25H7.46699ZM32.5337 15.0347V25H34.1337V15.0347H32.5337ZM16.667 5.8H23.6732V4.2H16.667V5.8ZM23.6732 5.8C25.2185 5.8 25.7493 5.81639 26.2079 6.02233L26.8633 4.56274C26.0191 4.18361 25.0759 4.2 23.6732 4.2V5.8ZM29.2539 6.70608C28.322 5.65771 27.7076 4.94187 26.8633 4.56274L26.2079 6.02233C26.6665 6.22826 27.0314 6.6141 28.058 7.76907L29.2539 6.70608ZM34.1337 15.0347C34.1337 13.8411 34.1458 13.0399 33.8638 12.2984L32.3683 12.867C32.5216 13.2702 32.5337 13.7221 32.5337 15.0347H34.1337ZM31.0518 11.1371C31.9238 12.1181 32.215 12.4639 32.3683 12.867L33.8638 12.2984C33.5819 11.5569 33.0406 10.9662 32.2476 10.0741L31.0518 11.1371ZM16.667 34.2C14.2874 34.2 12.5831 34.1983 11.2872 34.0241C10.0144 33.8529 9.25596 33.5287 8.69714 32.9698L7.56577 34.1012C8.47142 35.0069 9.62375 35.4148 11.074 35.6098C12.5013 35.8017 14.3326 35.8 16.667 35.8V34.2ZM5.86699 25C5.86699 27.3344 5.86529 29.1657 6.05718 30.593C6.25217 32.0432 6.66012 33.1956 7.56577 34.1012L8.69714 32.9698C8.13833 32.411 7.81405 31.6526 7.64292 30.3798C7.46869 29.0839 7.46699 27.3796 7.46699 25H5.86699ZM23.3337 35.8C25.6681 35.8 27.4993 35.8017 28.9266 35.6098C30.3769 35.4148 31.5292 35.0069 32.4349 34.1012L31.3035 32.9698C30.7447 33.5287 29.9863 33.8529 28.7134 34.0241C27.4175 34.1983 25.7133 34.2 23.3337 34.2V35.8ZM32.5337 25C32.5337 27.3796 32.532 29.0839 32.3577 30.3798C32.1866 31.6526 31.8623 32.411 31.3035 32.9698L32.4349 34.1012C33.3405 33.1956 33.7485 32.0432 33.9435 30.593C34.1354 29.1657 34.1337 27.3344 34.1337 25H32.5337ZM7.46699 15C7.46699 12.6204 7.46869 10.9161 7.64292 9.62024C7.81405 8.34738 8.13833 7.58897 8.69714 7.03015L7.56577 5.89878C6.66012 6.80443 6.25217 7.95676 6.05718 9.40704C5.86529 10.8343 5.86699 12.6656 5.86699 15H7.46699ZM16.667 4.2C14.3326 4.2 12.5013 4.1983 11.074 4.39019C9.62375 4.58518 8.47142 4.99313 7.56577 5.89878L8.69714 7.03015C9.25596 6.47133 10.0144 6.14706 11.2872 5.97592C12.5831 5.8017 14.2874 5.8 16.667 5.8V4.2ZM23.367 5V10H24.967V5H23.367ZM28.3337 14.9667H33.3337V13.3667H28.3337V14.9667ZM23.367 10C23.367 10.7361 23.3631 11.221 23.4464 11.6397L25.0157 11.3276C24.9709 11.1023 24.967 10.8128 24.967 10H23.367ZM28.3337 13.3667C27.5209 13.3667 27.2313 13.3628 27.0061 13.318L26.694 14.8872C27.1127 14.9705 27.5976 14.9667 28.3337 14.9667V13.3667ZM23.4464 11.6397C23.7726 13.2794 25.0543 14.5611 26.694 14.8872L27.0061 13.318C26.0011 13.1181 25.2156 12.3325 25.0157 11.3276L23.4464 11.6397ZM11.667 22.4667H25.0003V20.8667H11.667V22.4667ZM11.667 27.4667H20.0003V25.8667H11.667V27.4667ZM32.2476 10.0741L29.2539 6.70608L28.058 7.76907L31.0518 11.1371L32.2476 10.0741Z" fill="#4F46E5" />
                            </g>
                            </svg>
                            <h2 className="text-center text-gray-400 text-xs font-light leading-4">MP4, OGG, WebM - archivos de videos permitidos</h2>
                        </div>
                        <div className="grid gap-2">
                            <h4 className="text-center text-gray-900 text-sm font-medium leading-snug">Drag and Drop your file here or</h4>
                            <div className="flex items-center justify-center">
                                <label>
                                <input type="file" onChange={handleFileChange} hidden />
                                <div className="flex w-28 h-9 px-2 flex-col bg-indigo-600 rounded-full shadow text-white text-xs font-semibold leading-4 items-center justify-center cursor-pointer focus:outline-none">Choose File</div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="list-files" className="w-full hidden gap-4">
                    <div className="w-full grid gap-1">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <svg className="mx-auto" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none">
                                <g id="File">
                                    <path id="icon" d="M31.6497 10.6056L32.2476 10.0741L31.6497 10.6056ZM28.6559 7.23757L28.058 7.76907L28.058 7.76907L28.6559 7.23757ZM26.5356 5.29253L26.2079 6.02233L26.2079 6.02233L26.5356 5.29253ZM33.1161 12.5827L32.3683 12.867V12.867L33.1161 12.5827ZM31.8692 33.5355L32.4349 34.1012L31.8692 33.5355ZM24.231 11.4836L25.0157 11.3276L24.231 11.4836ZM26.85 14.1026L26.694 14.8872L26.85 14.1026ZM11.667 20.8667C11.2252 20.8667 10.867 21.2248 10.867 21.6667C10.867 22.1085 11.2252 22.4667 11.667 22.4667V20.8667ZM25.0003 22.4667C25.4422 22.4667 25.8003 22.1085 25.8003 21.6667C25.8003 21.2248 25.4422 20.8667 25.0003 20.8667V22.4667ZM11.667 25.8667C11.2252 25.8667 10.867 26.2248 10.867 26.6667C10.867 27.1085 11.2252 27.4667 11.667 27.4667V25.8667ZM20.0003 27.4667C20.4422 27.4667 20.8003 27.1085 20.8003 26.6667C20.8003 26.2248 20.4422 25.8667 20.0003 25.8667V27.4667ZM23.3337 34.2H16.667V35.8H23.3337V34.2ZM7.46699 25V15H5.86699V25H7.46699ZM32.5337 15.0347V25H34.1337V15.0347H32.5337ZM16.667 5.8H23.6732V4.2H16.667V5.8ZM23.6732 5.8C25.2185 5.8 25.7493 5.81639 26.2079 6.02233L26.8633 4.56274C26.0191 4.18361 25.0759 4.2 23.6732 4.2V5.8ZM29.2539 6.70608C28.322 5.65771 27.7076 4.94187 26.8633 4.56274L26.2079 6.02233C26.6665 6.22826 27.0314 6.6141 28.058 7.76907L29.2539 6.70608ZM34.1337 15.0347C34.1337 13.8411 34.1458 13.0399 33.8638 12.2984L32.3683 12.867C32.5216 13.2702 32.5337 13.7221 32.5337 15.0347H34.1337ZM31.0518 11.1371C31.9238 12.1181 32.215 12.4639 32.3683 12.867L33.8638 12.2984C33.5819 11.5569 33.0406 10.9662 32.2476 10.0741L31.0518 11.1371ZM16.667 34.2C14.2874 34.2 12.5831 34.1983 11.2872 34.0241C10.0144 33.8529 9.25596 33.5287 8.69714 32.9698L7.56577 34.1012C8.47142 35.0069 9.62375 35.4148 11.074 35.6098C12.5013 35.8017 14.3326 35.8 16.667 35.8V34.2ZM5.86699 25C5.86699 27.3344 5.86529 29.1657 6.05718 30.593C6.25217 32.0432 6.66012 33.1956 7.56577 34.1012L8.69714 32.9698C8.13833 32.411 7.81405 31.6526 7.64292 30.3798C7.46869 29.0839 7.46699 27.3796 7.46699 25H5.86699ZM23.3337 35.8C25.6681 35.8 27.4993 35.8017 28.9266 35.6098C30.3769 35.4148 31.5292 35.0069 32.4349 34.1012L31.3035 32.9698C30.7447 33.5287 29.9863 33.8529 28.7134 34.0241C27.4175 34.1983 25.7133 34.2 23.3337 34.2V35.8ZM32.5337 25C32.5337 27.3796 32.532 29.0839 32.3577 30.3798C32.1866 31.6526 31.8623 32.411 31.3035 32.9698L32.4349 34.1012C33.3405 33.1956 33.7485 32.0432 33.9435 30.593C34.1354 29.1657 34.1337 27.3344 34.1337 25H32.5337ZM7.46699 15C7.46699 12.6204 7.46869 10.9161 7.64292 9.62024C7.81405 8.34738 8.13833 7.58897 8.69714 7.03015L7.56577 5.89878C6.66012 6.80443 6.25217 7.95676 6.05718 9.40704C5.86529 10.8343 5.86699 12.6656 5.86699 15H7.46699ZM16.667 4.2C14.3326 4.2 12.5013 4.1983 11.074 4.39019C9.62375 4.58518 8.47142 4.99313 7.56577 5.89878L8.69714 7.03015C9.25596 6.47133 10.0144 6.14706 11.2872 5.97592C12.5831 5.8017 14.2874 5.8 16.667 5.8V4.2ZM23.367 5V10H24.967V5H23.367ZM28.3337 14.9667H33.3337V13.3667H28.3337V14.9667ZM23.367 10C23.367 10.7361 23.3631 11.221 23.4464 11.6397L25.0157 11.3276C24.9709 11.1023 24.967 10.8128 24.967 10H23.367ZM28.3337 13.3667C27.5209 13.3667 27.2313 13.3628 27.0061 13.318L26.694 14.8872C27.1127 14.9705 27.5976 14.9667 28.3337 14.9667V13.3667ZM23.4464 11.6397C23.7726 13.2794 25.0543 14.5611 26.694 14.8872L27.0061 13.318C26.0011 13.1181 25.2156 12.3325 25.0157 11.3276L23.4464 11.6397ZM11.667 22.4667H25.0003V20.8667H11.667V22.4667ZM11.667 27.4667H20.0003V25.8667H11.667V27.4667ZM32.2476 10.0741L29.2539 6.70608L28.058 7.76907L31.0518 11.1371L32.2476 10.0741Z" fill="#4F46E5" />
                                </g>
                                </svg>
                                <div className="grid gap-1">
                                    <h4 className="text-gray-900 text-sm font-normal font-['Inter'] leading-snug">{namePlayer}</h4>
                                    <h5 className="text-gray-400   text-xs font-normal font-['Inter'] leading-[18px]">{isUploading ? "Upload Process" : "Upload Complete"}</h5>
                                </div>
                            </div>
                            <span className='text-black text-sm'>
                                {seconds} Seg
                            </span>
                        </div>
                        <div className="relative flex items-center gap-2.5 py-1.5">
                            <div className="relative  w-full h-2.5  overflow-hidden rounded-3xl bg-gray-100">
                                <div id="progress-value" role="progressbar" className="flex w-0 h-full items-center justify-center bg-indigo-600 text-white rounded-3xl"></div>
                            </div>
                            <span className="ml-2 bg-white  rounded-full  text-gray-800 text-xs font-medium flex justify-center items-center ">{isUploading ? Math.floor(progress) : 100}%</span>
                        </div>
                    </div>
                </div>
            </div>   
        </div>
    );
}

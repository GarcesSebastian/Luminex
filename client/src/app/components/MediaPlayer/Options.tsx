"use client";

import React, { useState, useEffect } from 'react';
import Range from "./Range";
import { Settings } from './Settings';
import { QualityPopup } from '../Popups/QualityPopup';
import { SpeedPopup } from '../Popups/SpeedPopup';

export default function Options(props: any) {

    const [quality_selected, setQuality_selected] = useState<string>("1080p");
    const [speed_selected, setSpeed_selected] = useState<string>("Normal");
    let intervalMouseEnter: NodeJS.Timeout;

    function formattedSeconds(seconds: number){
        const minutes = Math.floor(seconds / 60);
        const secondsValue = Math.floor(seconds % 60);
        const formattedMinutes = minutes.toString().padStart(2, "0");
        const formattedSeconds = secondsValue.toString().padStart(2, "0");

        return `${formattedMinutes}:${formattedSeconds}`;
    }
    
    const handleForward = () => {
        const newValue = (props.currentTime ?? 0) + 10 > props.duration ? props.duration : (props.currentTime ?? 0) + 10;
        (props.videoPlayer as HTMLVideoElement).currentTime = newValue;
        props.setValue(newValue);
    }
    
    const handleBackward = () => {
        const newValue = (props.currentTime ?? 0) - 10 < 0 ? 0 : (props.currentTime ?? 0) - 10;
        (props.videoPlayer as HTMLVideoElement).currentTime = newValue;
        props.setValue(newValue);
    }

    const range = document.querySelector('#range-sound') as HTMLInputElement;

    const doc = document.documentElement;
    function updateRange() {
        doc.style.setProperty('--RANGE-VALUE', `${range.value}%`);
        props.setVolume(parseFloat(range.value) / 100);
    }

    const handleSoundEnter = () => {
        const range = document.querySelector('#range-sound') as HTMLInputElement;
        range.classList.replace("w-0", "w-32");
    }

    const handleSoundLeave = () => {
        const range = document.querySelector('#range-sound') as HTMLInputElement;
        range.classList.replace("w-32", "w-0");
    }

    const handleFullScreen = () => {
        const videoElement = props.videoPlayer;
        if (videoElement) {
            const videoContainer = document.querySelector('#content-video') as any;
            if (document.fullscreenElement) {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                    videoElement.style.width = '1200px';
                    videoElement.style.height = "780px"
                }
            } else {
                if (videoContainer.requestFullscreen) {
                    videoContainer.requestFullscreen();
                    videoElement.style.width = '100%';
                    videoElement.style.height = "100%"
                    console.log("Full screen");
                    
                }
            }
        }
    }

    const [isMouseMoving, setIsMouseMoving] = useState(false);

    const optionsMouseLeave = () => {
        props.setIsView(false);
    }

    const optionsMouseEnter = () => {
        if (props.isView) return;
        props.setIsView(true);
    }

    const optionsMouseMove = () => {
        setIsMouseMoving(true);
        if (!props.isView) {
            props.setIsView(true);
        }
    }

    // useEffect(() => {
    //     let timeoutMouseStop: NodeJS.Timeout | undefined;
        
    //     if (isMouseMoving) {
    //         clearTimeout(timeoutMouseStop);
    //         timeoutMouseStop = setTimeout(() => {
    //             setIsMouseMoving(false);
    //             if (props.isView) {
    //                 props.setIsView(false);
    //             }
    //         }, 3000);
    //     }
    //     return () => {
    //         clearTimeout(timeoutMouseStop);
    //     };
    // }, [isMouseMoving, props.isView]);

    const handleShowSettings = () => {
        const settings = document.querySelector("#settings-video") as HTMLElement;
        const q_settings = document.querySelector("#q-settings-video") as HTMLElement;
        const s_settings = document.querySelector("#s-settings-video") as HTMLElement;

        if (settings.classList.contains("hidden")) {
            settings.classList.replace("hidden", "flex");
        } else {
            settings.classList.replace("flex", "hidden");
        }

        if (!q_settings.classList.contains("hidden")) {
            q_settings.classList.replace("flex", "hidden");
            settings.classList.replace("flex", "hidden");
        }

        if (!s_settings.classList.contains("hidden")) {
            s_settings.classList.replace("flex", "hidden");
            settings.classList.replace("flex", "hidden");
        }
    }

    return(
        <div id="options-content" onMouseEnter={optionsMouseEnter} onMouseMove={optionsMouseMove} onMouseLeave={optionsMouseLeave} className="absolute flex flex-col top-0 left-0 w-full h-full rounded-md">
            <header className='text-white text-lg bg-black/50 px-3 w-full h-fit py-2 flex justify-between items-center'>
                <h2>
                    {props.name}
                </h2>

                <img src="/luminex/logo-best.jpeg" className="w-10 h-10 rounded-md"/>
            </header>

            <section id="section-select" onClick={props.handlePlayVideo} className="w-full h-full relative flex justify-center items-center z-10">
                <button onClick={props.handlePlayVideo} id="btn-play-center" className='text-white px-3 py-2 hidden animate-showOpacity rounded-md cursor-pointer bg-indigo-600/70 transition-all duration-300 ease-out'>
                    <img id="image-player-play-center" src="/icons/player-pause.svg" className="w-14 h-14"/>
                </button>

                <Settings 
                    quality_selected={quality_selected} 
                    setQuality_selected={setQuality_selected} 
                    speed_selected={speed_selected}
                    setSpeed_selected={setSpeed_selected}
                    />
                <QualityPopup qualities={props.qualities} quality_selected={quality_selected} setQuality_selected={setQuality_selected} isPlaying={props.isPlaying}/>
                <SpeedPopup speed_selected={speed_selected} setSpeed_selected={setSpeed_selected}/>
            </section>

            <footer className='w-full h-fit py-2 bg-black/50 bottom-0 px-2 gap-y-2 flex flex-col'>

                <div className="w-full h-fit px-2">
                    <Range 
                        videoPlayer={props.videoPlayer}
                        currentTime={props.currentTime}
                        duration={props.duration}
                        handleVideoLoaded={props.handleVideoLoaded}
                        thumbnails={props.thumbnails}
                        isPlaying={props.isPlaying}
                        handlePlayVideo={props.handlePlayVideo}
                        value={props.value}
                        setValue={props.setValue}
                        thumbnailFather={props.thumbnailFather}
                        setThumbnailFather={props.setThumbnailFather}
                    />
                </div>

                <div className="w-full h-fit flex justify-between items-center">
                    <div className="w-full h-fit flex gap-x-3 px-2 items-center">
                        <button onClick={handleBackward} className='text-white px-3 py-2 rounded-md cursor-pointer hover:bg-indigo-600/70 transition-all duration-300 ease-out'>
                            <svg className="icon icon-tabler icons-tabler-outline icon-tabler-rewind-backward-10 w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"  fill="none"  stroke="white"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                <path d="M7 9l-3 -3l3 -3" />
                                <path d="M15.997 17.918a6.002 6.002 0 0 0 -.997 -11.918h-11" />
                                <path d="M6 14v6" />
                                <path d="M9 15.5v3a1.5 1.5 0 0 0 3 0v-3a1.5 1.5 0 0 0 -3 0z" />
                            </svg>
                        </button>

                        <button onClick={props.eventPlay} id="btn-play" className='text-white px-3 py-2 rounded-md cursor-pointer hover:bg-indigo-600/70 transition-all duration-300 ease-out'>
                            <img id="image-player-play" src="/icons/player-pause.svg" className="w-5 h-5"/>
                        </button>

                        <button onClick={handleForward} className='text-white px-3 py-2 rounded-md cursor-pointer hover:bg-indigo-600/70 transition-all duration-300 ease-out'>
                            <svg className="icon icon-tabler icons-tabler-outline icon-tabler-rewind-forward-10 w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"  fill="none"  stroke="white"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                <path d="M17 9l3 -3l-3 -3" />
                                <path d="M8 17.918a5.997 5.997 0 0 1 -5 -5.918a6 6 0 0 1 6 -6h11" />
                                <path d="M12 14v6" />
                                <path d="M15 15.5v3a1.5 1.5 0 0 0 3 0v-3a1.5 1.5 0 0 0 -3 0z" />
                            </svg>
                        </button>

                        <button id="sound-icon" onMouseEnter={handleSoundEnter} onMouseLeave={handleSoundLeave} onClick={handleSoundEnter} className='text-white px-3 py-2 w-fit h-fit flex justify-center items-center gap-x-3 rounded-md cursor-pointer'>
                            <svg className="icon icon-tabler icons-tabler-outline icon-tabler-volume-2 w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"  fill="none"  stroke="white"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                <path d="M15 8a5 5 0 0 1 0 8" />
                                <path d="M17.7 5a9 9 0 0 1 0 14" />
                                <path d="M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a.8 .8 0 0 1 1.5 .5v14a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5" />
                            </svg>

                            <input type="range" id="range-sound" value={props.volume} onChange={updateRange} className="w-0 h-2.5 transition-all duration-300 ease-in-out cursor-pointer relative left-0 bg-indigo-600 "/>
                        </button>

                        <span className='text-white'>
                            {formattedSeconds(props.currentTime)} / {formattedSeconds(props.duration)}
                        </span>
                    </div>

                    <div className="w-fit h-fit flex gap-x-3 px-2">
                        <button onClick={handleShowSettings} className='text-white p-1.5 rounded-md cursor-pointer hover:bg-indigo-600/70 transition-all duration-300 ease-out'>
                            <svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"  fill="none"  stroke="white"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  className="icon icon-tabler icons-tabler-outline icon-tabler-settings w-6 h-6">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                <path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" />
                                <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
                            </svg>
                        </button>

                        <button onClick={handleFullScreen} className='text-white p-1.5 rounded-md cursor-pointer hover:bg-indigo-600/70 transition-all duration-300 ease-out'>
                            <svg className="icon icon-tabler icons-tabler-outline icon-tabler-maximize w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"  fill="none"  stroke="white"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                <path d="M4 8v-2a2 2 0 0 1 2 -2h2" />
                                <path d="M4 16v2a2 2 0 0 0 2 2h2" />
                                <path d="M16 4h2a2 2 0 0 1 2 2v2" />
                                <path d="M16 20h2a2 2 0 0 0 2 -2v-2" />
                            </svg>
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    )
}
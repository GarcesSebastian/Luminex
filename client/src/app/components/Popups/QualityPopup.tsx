import { useEffect, useState } from "react";

interface SettingsProps{
    qualities: string[]
    quality_selected: string,
    setQuality_selected: (value: string) => void,
    isPlaying: boolean,
    qualitiesRange: string[]
}

export function QualityPopup({isPlaying, qualities, qualitiesRange, quality_selected, setQuality_selected}: SettingsProps) {
    useEffect(() => {
        const src: any = qualities.find((qual: any) => qual.range === quality_selected);
        const video = document.querySelector("#videoPlayer") as HTMLVideoElement;
        const current_time = video.currentTime;

        if(!src) return;

        video.src = src.quality;
        video.load();
        if(isPlaying) {
            video.play();
        }else{
            video.pause();
        }
        video.currentTime = current_time;
    },[quality_selected])

    useEffect(() => {
        const buttons_q = document.querySelectorAll(".q");

        buttons_q.forEach((q: any) => {
            const q_text = q.querySelector("p")?.textContent;
            if(qualitiesRange.includes(q_text as string)){
                q.classList.remove("hidden");
            }else{
                q.classList.add("hidden");
            }
        });

        setQuality_selected(qualitiesRange[qualitiesRange.length - 1]);
        let isIterable = true;
        buttons_q.forEach((q: any) => {
            if(!q.classList.contains("hidden") && isIterable){
                q.querySelector("svg")?.classList.remove("opacity-0");
                isIterable = false;
            }
            
        });
    },[qualitiesRange])

    const handleBackQuality = () => {
        document.querySelector("#q-settings-video")?.classList.replace("flex", "hidden");
        document.querySelector("#settings-video")?.classList.replace("hidden", "flex");
    }

    const handleChangeQuality = async (e: React.MouseEvent<HTMLButtonElement>) => {
        const buttonClosest = (e.target as HTMLElement).closest('button');
        
        if (buttonClosest) {
            (document.querySelectorAll(".q") as NodeListOf<HTMLButtonElement>).forEach((q: HTMLButtonElement) => {
                q.querySelector("svg")?.classList.add("opacity-0");
            });

            buttonClosest.querySelector("svg")?.classList.remove("opacity-0");
            const quality_select = buttonClosest.querySelector("p")?.textContent;

            if(quality_select != quality_selected){
                setQuality_selected(quality_select as string);
            }
        }
    };
    
    return(
        <div id="q-settings-video" className='w-[20rem] absolute bottom-2 right-4 h-fit bg-indigo-700 rounded-[3px] hidden flex-col justify-center items-center text-indigo-100 z-[90]'>
            <div className='w-full h-fit flex justify-start px-5 py-3 items-center bg-indigo-800 border-b-[0.125rem] border-indigo-700'>
                <button onClick={handleBackQuality} type="button" id="back-quality" name="back-quality">
                    <svg className="icon icon-tabler icons-tabler-outline icon-tabler-chevron-left w-6 h-6 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"  fill="none"  stroke="white"  stroke-width="1.5"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 6l-6 6l6 6" /></svg>
                </button>
                <label htmlFor="back-quality" className='text-base font-normal cursor-pointer'>Quality</label>
            </div>

            <button id="q-1080" type="button" onClick={handleChangeQuality} className='q w-full h-fit flex justify-start px-5 py-3 items-center bg-indigo-800 hover:bg-indigo-500/30 cursor-pointer'>
                <svg className="icon icon-tabler icons-tabler-outline icon-tabler-check w-6 h-6 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"  fill="none"  stroke="white"  stroke-width="1.5"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>
                <p className='text-sm'>1080p</p>
            </button>  

            <button id="q-720" type="button" onClick={handleChangeQuality} className='q w-full h-fit flex justify-start px-5 py-3 items-center bg-indigo-800 hover:bg-indigo-500/30 cursor-pointer'>
                <svg className="icon icon-tabler icons-tabler-outline icon-tabler-check w-6 h-6 opacity-0 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"  fill="none"  stroke="white"  stroke-width="1.5"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>
                <p className='text-sm'>720p</p>
            </button>

            <button id="q-480" type="button" onClick={handleChangeQuality} className='q w-full h-fit flex justify-start px-5 py-3 items-center bg-indigo-800 hover:bg-indigo-500/30 cursor-pointer'>
                <svg className="icon icon-tabler icons-tabler-outline icon-tabler-check w-6 h-6 opacity-0 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"  fill="none"  stroke="white"  stroke-width="1.5"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>
                <p className='text-sm'>480p</p>
            </button>

            <button id="q-360" type="button" onClick={handleChangeQuality} className='q w-full h-fit flex justify-start px-5 py-3 items-center bg-indigo-800 hover:bg-indigo-500/30 cursor-pointer'>
                <svg className="icon icon-tabler icons-tabler-outline icon-tabler-check w-6 h-6 opacity-0 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"  fill="none"  stroke="white"  stroke-width="1.5"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>
                <p className='text-sm'>360p</p>
            </button>
        </div>
    )
}
import { useEffect, useState } from "react";

interface SettingsProps{
    speed_selected: string,
    setSpeed_selected: (value: string) => void
}

export function SpeedPopup({speed_selected, setSpeed_selected}: SettingsProps) {
    useEffect(() => {
        const video = document.querySelector("#videoPlayer") as any;

        if(video){
            const formattedSpeedSelect = speed_selected.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            
            if (formattedSpeedSelect === "normal") {
                video.playbackRate = 1;
                return;
            }

            video.playbackRate = parseFloat(speed_selected.split("x")[0]);
        }
        
    },[speed_selected])

    const handelBlackSpeed = () => {
        document.querySelector("#s-settings-video")?.classList.replace("flex", "hidden");
        document.querySelector("#settings-video")?.classList.replace("hidden", "flex");
    }

    const handleChangeSpeed = async (e: React.MouseEvent<HTMLButtonElement>) => {
        const buttonClosest = (e.target as HTMLElement).closest('button');
        
        if (buttonClosest) {
            (document.querySelectorAll(".s") as NodeListOf<HTMLButtonElement>).forEach((s: HTMLButtonElement) => {
                s.querySelector("svg")?.classList.add("opacity-0");
            });

            buttonClosest.querySelector("svg")?.classList.remove("opacity-0");
            const speed_select = buttonClosest.querySelector("p")?.textContent;

            if(speed_select){
                setSpeed_selected(speed_select);
            }
        }
    };

    return(
        <div id="s-settings-video" className='w-[20rem] absolute bottom-2 right-4 h-fit bg-indigo-700 rounded-[3px] hidden flex-col justify-center items-center text-indigo-100 z-[90]'>
            <div className='w-full h-fit flex justify-start px-5 py-3 items-center bg-indigo-800 border-b-[0.125rem] border-indigo-700'>
                <button onClick={handelBlackSpeed} type="button" id="back-speed" name="back-speed">
                    <svg className="icon icon-tabler icons-tabler-outline icon-tabler-chevron-left w-6 h-6 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"  fill="none"  stroke="white"  stroke-width="1.5"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 6l-6 6l6 6" /></svg>
                </button>
                <label htmlFor="back-speed" className='text-base font-normal cursor-pointer'>Speed</label>
            </div>

            <button id="s-2" type="button" onClick={handleChangeSpeed} className='s w-full h-fit flex justify-start px-5 py-3 items-center bg-indigo-800 hover:bg-indigo-500/30 cursor-pointer'>
                <svg className="icon icon-tabler icons-tabler-outline icon-tabler-check w-6 h-6 opacity-0 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"  fill="none"  stroke="white"  stroke-width="1.5"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>
                <p className='text-sm'>2x</p>
            </button>

            <button id="s-1.5" type="button" onClick={handleChangeSpeed} className='s w-full h-fit flex justify-start px-5 py-3 items-center bg-indigo-800 hover:bg-indigo-500/30 cursor-pointer'>
                <svg className="icon icon-tabler icons-tabler-outline icon-tabler-check w-6 h-6 opacity-0 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"  fill="none"  stroke="white"  stroke-width="1.5"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>
                <p className='text-sm'>1.5x</p>
            </button>
            
            <button id="s-normal" type="button" onClick={handleChangeSpeed} className='s w-full h-fit flex justify-start px-5 py-3 items-center bg-indigo-800 hover:bg-indigo-500/30 cursor-pointer'>
                <svg className="icon icon-tabler icons-tabler-outline icon-tabler-check w-6 h-6 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"  fill="none"  stroke="white"  stroke-width="1.5"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>
                <p className='text-sm'>Normal</p>
            </button>  

            <button id="s-0.75" type="button" onClick={handleChangeSpeed} className='s w-full h-fit flex justify-start px-5 py-3 items-center bg-indigo-800 hover:bg-indigo-500/30 cursor-pointer'>
                <svg className="icon icon-tabler icons-tabler-outline icon-tabler-check w-6 h-6 opacity-0 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"  fill="none"  stroke="white"  stroke-width="1.5"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>
                <p className='text-sm'>0.75x</p>
            </button>

            <button id="s-0.5" type="button" onClick={handleChangeSpeed} className='s w-full h-fit flex justify-start px-5 py-3 items-center bg-indigo-800 hover:bg-indigo-500/30 cursor-pointer'>
                <svg className="icon icon-tabler icons-tabler-outline icon-tabler-check w-6 h-6 opacity-0 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"  fill="none"  stroke="white"  stroke-width="1.5"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>
                <p className='text-sm'>0.5x</p>
            </button>
        </div>
    )
}
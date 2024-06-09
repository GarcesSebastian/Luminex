import { useState } from "react";

interface Props{
    qualities: string[]
}

export function QualityPopup(data: Props) {

    const [quality_selected, setQuality_selected] = useState<string>("720p");

    const handleBackQuality = () => {
        document.querySelector("#q-settings-video")?.classList.replace("flex", "hidden");
        document.querySelector("#settings-video")?.classList.replace("hidden", "flex");
    }

    const handleChangeQuality = async () => {
        const qualitys = document.querySelectorAll(".q") as NodeListOf<HTMLButtonElement>;

        qualitys.forEach((quality: HTMLButtonElement) => {
            if (quality) {
                quality.addEventListener("click", () => {
                    qualitys.forEach((q: HTMLButtonElement) => {
                        q.querySelector("svg")?.classList.add("opacity-0");
                    });
                    quality.querySelector("svg")?.classList.remove("opacity-0");
                    const quality_select = quality.querySelector("p")?.textContent;

                    if (quality_select && data.qualities) {

                        console.log(quality_select, quality_selected, quality_select == quality_selected);
                        
                        if (quality_select == quality_selected){
                            return;
                        }

                        const src: any = data.qualities.find((qual: any) => qual.range === quality_select);
                        const video = document.querySelector("#videoPlayer") as HTMLVideoElement;
                        const current_time = video.currentTime;

                        video.src = src.quality;
                        video.load();
                        video.play();
                        video.currentTime = current_time;
                        setQuality_selected(quality_select);
                    }
                });
            }
        });

    }

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
            
            <button id="q-auto" type="button" onClick={handleChangeQuality} className='q w-full h-fit flex justify-start px-5 py-3 items-center bg-indigo-800 hover:bg-indigo-500/30 cursor-pointer'>
                <svg className="icon icon-tabler icons-tabler-outline icon-tabler-check w-6 h-6 opacity-0 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"  fill="none"  stroke="white"  stroke-width="1.5"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>
                <p className='text-sm'>Automatico</p>
            </button>
        </div>
    )
}
import { Quality } from '../Settings/Quality';
import { Speed } from '../Settings/Speed';

export function Settings(){

    const handleQuality = (e: any) => {
        document.querySelector("#q-settings-video")?.classList.replace("hidden", "flex");
        document.querySelector("#settings-video")?.classList.replace("flex", "hidden");
    }

    return(
    <div id="settings-video" className='w-[20rem] absolute bottom-2 right-4 h-fit bg-indigo-700 rounded-[3px] flex flex-col justify-center items-center gap-y-1 text-indigo-100 z-[90]'>
        <Quality id='quality-settings' quality='1080p' handleQuality={handleQuality}/>
        <Speed/>
    </div>
    )
}
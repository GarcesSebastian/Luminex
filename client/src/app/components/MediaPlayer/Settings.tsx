interface SettingsProps {
    quality_selected: string,
    setQuality_selected: (value: string) => void
    speed_selected: string,
    setSpeed_selected: (value: string) => void
}
import { Quality } from '../Settings/Quality';
import { Speed } from '../Settings/Speed';

export function Settings({quality_selected, setQuality_selected, speed_selected}: SettingsProps){
    const handleQuality = () => {
        document.querySelector("#q-settings-video")?.classList.replace("hidden", "flex");
        document.querySelector("#settings-video")?.classList.replace("flex", "hidden");
    }

    const handleSpeed = () => {
        document.querySelector("#s-settings-video")?.classList.replace("hidden", "flex");
        document.querySelector("#settings-video")?.classList.replace("flex", "hidden");
    }

    return(
    <div id="settings-video" className='w-[20rem] absolute bottom-2 right-4 h-fit bg-indigo-700 rounded-[3px] hidden flex-col justify-center items-center gap-y-1 text-indigo-100 z-[90]'>
        <Quality id='quality-settings' quality={quality_selected} handleQuality={handleQuality} />
        <Speed id='speed-settings' speed={speed_selected} handleSpeed={handleSpeed}/>
    </div>
    )
}
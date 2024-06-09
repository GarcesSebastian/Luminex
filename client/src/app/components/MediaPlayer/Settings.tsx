import { Quality } from '../Settings/Quality';
import { Speed } from '../Settings/Speed';

interface Props{

}

export function Settings(data: Props){
    return(
    <div className='w-[20rem] absolute bottom-2 right-4 h-fit bg-slate-700 rounded-[3px] flex flex-col justify-center items-center gap-y-1 text-slate-100 z-[90]'>
        <Quality/>
        <Speed/>
    </div>
    )
}
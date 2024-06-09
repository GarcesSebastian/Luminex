import { Quality } from '../Settings/Quality';
import { Speed } from '../Settings/Speed';

interface Props{

}

export function Settings(data: Props){
    return(
    <div className='w-[20rem] absolute bottom-0 right-4 h-fit bg-gray-600 rounded-[3px] flex flex-col justify-center items-center gap-y-1 text-gray-300'>
        <Quality/>
        <Speed/>
    </div>
    )
}
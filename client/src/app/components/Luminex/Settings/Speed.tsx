interface Props{
    id: string,
    speed: string,
    handleSpeed: (e: any) => void,
}

export function Speed(data: Props){
    return(
        <div onClick={data.handleSpeed} id={data.id} className='w-full h-full p-2 flex flex-row justify-between items-center hover:bg-indigo-500/40 transition-all duration-150 ease-in-out cursor-pointer'>
            <span className='w-fit h-full flex gap-x-2 text-sm font-semibold justify-center items-center'>
                <svg className="icon icon-tabler icons-tabler-outline icon-tabler-brand-speedtest w-6 h-6" xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="white"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5.636 19.364a9 9 0 1 1 12.728 0" /><path d="M16 9l-4 4" /></svg>                
                Speed
            </span>

            <span className='w-fit h-full flex gap-x-2 text-sm font-semibold justify-center items-center'>
                {data.speed}
                <svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"  fill="none"  stroke="white"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  className="icon icon-tabler icons-tabler-outline icon-tabler-chevron-right w-6 h-6"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 6l6 6l-6 6" /></svg>
            </span>
        </div>
    )
}
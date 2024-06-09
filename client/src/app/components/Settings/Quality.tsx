interface Props{
    id: string,
    quality: string,
    handleQuality: (e: any) => void
}

export function Quality(data: Props){
    return(
        <button onClick={data.handleQuality} id={data.id} className='w-full h-full p-2 flex flex-row justify-between items-center hover:bg-indigo-500/40 transition-all duration-150 ease-in-out cursor-pointer'>
            <span className='w-fit h-full flex gap-x-2 text-sm font-semibold justify-center items-center'>
                <svg  xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24"  fill="none"  stroke="white"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  className="icon icon-tabler icons-tabler-outline icon-tabler-adjustments-horizontal w-6 h-6"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M4 6l8 0" /><path d="M16 6l4 0" /><path d="M8 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M4 12l2 0" /><path d="M10 12l10 0" /><path d="M17 18m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M4 18l11 0" /><path d="M19 18l1 0" /></svg>
                Calidad
            </span>

            <span className='w-fit h-full flex gap-x-2 text-sm font-semibold justify-center items-center'>
                {data.quality} HD
                <svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"  fill="none"  stroke="white"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  className="icon icon-tabler icons-tabler-outline icon-tabler-chevron-right w-6 h-6"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 6l6 6l-6 6" /></svg>
            </span>
        </button>
    )
}
import { useEffect } from "react"

interface Props{
    id: string,
    isLoading: boolean
}

export function Loader(data: Props){

    useEffect(() => {
        if(!data.isLoading){
            document.querySelector("#content-loader")?.classList.replace("flex", "hidden");
            return;
        }

        document.querySelector("#content-loader")?.classList.replace("hidden", "flex");
    },[data.isLoading])

    return(
        <div id="content-loader" className="absolute hidden w-full h-full justify-center items-center">
            <div id="wifi-loader" className="flex">
                <svg className="circle-outer" viewBox="0 0 86 86">
                    <circle className="back" cx="43" cy="43" r="40"></circle>
                    <circle className="front" cx="43" cy="43" r="40"></circle>
                    <circle className="new" cx="43" cy="43" r="40"></circle>
                </svg>
                <svg className="circle-middle" viewBox="0 0 60 60">
                    <circle className="back" cx="30" cy="30" r="27"></circle>
                    <circle className="front" cx="30" cy="30" r="27"></circle>
                </svg>
                <svg className="circle-inner" viewBox="0 0 34 34">
                    <circle className="back" cx="17" cy="17" r="14"></circle>
                    <circle className="front" cx="17" cy="17" r="14"></circle>
                </svg>

                <div className="text mt-4" data-text="Generate.."></div>
            </div>
        </div>
    )
}
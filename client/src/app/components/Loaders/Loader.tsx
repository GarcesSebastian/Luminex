import { useEffect, useState } from "react"

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

    const [stateLoader, setStateLoader] = useState<string>("Generate..");
    const [estimatedTime, setEstimatedTime] = useState<string>();
    const [progress, setProgress] = useState<number>(0);

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:4000');

        const clientId = generateUniqueId();

        document.cookie = `clientId=${clientId}`;

        socket.onopen = async function(event) {
            socket.send(JSON.stringify({ type: 'clientId', id: clientId }));
            console.log('Conexión establecida con el servidor WebSocket');
        };
        
        socket.onmessage = function(event: MessageEvent) {
            let message: any;
            try{
                message = JSON.parse(event.data);
            }catch(error){
                console.error('Error al parsear el mensaje');
            }

            if(message){
                setStateLoader(message.message);
                setEstimatedTime(message.estimatedTime);
                setProgress(message.progress);
            }
        };
          
        socket.onclose = function(event) {
          console.log('Conexión cerrada con el servidor WebSocket');
        };
        
        socket.onerror = function(error) {
          console.error('Error en la conexión WebSocket:', error);
        };
    }, []);

    function generateUniqueId() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    return(
        <div id="content-loader" className="absolute top-0 left-0 hidden flex-col w-full h-full justify-center items-center">
            <div className="cssload-container">
                <ul className="cssload-flex-container">
                    <li>
                        <span className="cssload-loading cssload-one"></span>
                        <span className="cssload-loading cssload-two"></span>
                        <span className="cssload-loading-center bg-indigo-700"></span>
                    </li>
                </ul>
            </div>

            <div className="prose w-full max-w-md text-gray-500 prose-sm prose-headings:font-normal prose-headings:text-xl">
                <div>
                    <h1 className="text-indigo-500 -mt-5 text-lg font-semibold">{stateLoader}</h1>
                    <p className="text-balance">
                        Estimated total conversion time: <span className="text-balance font-bold ">{estimatedTime}</span>
                    </p>
                </div>
            </div>
            <div className="mt-4 border-t w-full max-w-md">
                <div className="w-full">
                    <div className="text-sm text-gray-500" x-text="progress + '%'">{progress}%</div>
                    <div className="relative h-1 mt-2 bg-gray-400/70 rounded-full">
                        <div style={{width: ` ${progress}%`}} className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full w-full"></div>
                    </div>
                </div>
            </div>


        </div>
    )
}
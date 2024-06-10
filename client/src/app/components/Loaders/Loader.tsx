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

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:4000');

        const clientId = generateUniqueId();

        document.cookie = `clientId=${clientId}`;

        socket.onopen = async function(event) {
            socket.send(JSON.stringify({ type: 'clientId', id: clientId }));
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
            <p className="text-indigo-500 -mt-5 text-lg font-semibold">{stateLoader}</p>
        </div>
    )
}
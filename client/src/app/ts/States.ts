let contInterval: NodeJS.Timeout;
let milliseconds = 0;

export function timeCount(state: boolean): number{    
    if(state){
        contInterval = setInterval(() => {
            milliseconds += 100;
            console.log('time: ', milliseconds / 1000);
            return milliseconds / 1000; 
        }, 100)
    }else{
        clearInterval(contInterval);
        const seconds = milliseconds / 1000;
        console.log('time: ', milliseconds / 1000);
        return seconds;
    }

    milliseconds = 0;
    return milliseconds / 1000;
}


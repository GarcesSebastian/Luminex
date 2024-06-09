let contInterval: NodeJS.Timeout;
let milliseconds = 0;

export function timeCount(state: boolean): number {
    if (state) {
        contInterval = setInterval(() => {
            milliseconds += 100;
            return milliseconds;
        }, 100);
    } else {
        clearInterval(contInterval);
        return milliseconds;
    }

    milliseconds = 0;
    return milliseconds; 
}

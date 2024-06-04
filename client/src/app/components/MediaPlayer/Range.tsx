import React, { useEffect, useState, useRef } from "react";

export default function Range(props: any) {
    const [valuePreview, setValuePreview] = useState("00:00");
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const rangeRef = useRef<HTMLInputElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const previewFrameRef = useRef<HTMLImageElement>(null);
    const previewCurrentRef = useRef<HTMLLegendElement>(null);

    useEffect(() => {
        props.setValue(props.currentTime);

        const rangeProgress = document.getElementById("range-progress");
        if (rangeProgress) {
            const progress = ((props.currentTime ?? 0) * 100) / props.duration;
            rangeProgress.style.width = `${progress}%`;
        }

        if (props.currentTime === props.duration) {
            props.handlePlayVideo();
        }

    }, [props.currentTime, props.duration]);

    const handleChangeValue = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseFloat(e.target.value);
        (document.querySelector("video") as HTMLVideoElement).currentTime = newValue;
        props.setValue(newValue);
    };

    const handleMouseDown = () => {
        (document.querySelector("video") as HTMLVideoElement).pause();
    };

    const handleMouseUp = () => {
        if (!props.isPlaying) return;
        (document.querySelector("video") as HTMLVideoElement).play();
    };

    const handleMouseEnter = () => {
        if (previewCurrentRef.current) {
            previewCurrentRef.current.style.display = "flex";
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLInputElement>) => {
        if (!(e.nativeEvent.offsetX > 0)) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const offsetX = e.clientX - rect.left - (previewCurrentRef.current?.offsetWidth ?? 0) / 2;
        const offsetY = e.currentTarget.offsetTop - (document.querySelector("#preview-current")?.clientHeight ?? 0) - 10;
        const rangeWidth = rect.width;
        const ratio = e.nativeEvent.offsetX / rangeWidth;
        const umbral = rangeWidth - (document.querySelector("#preview-current")?.clientWidth ?? 0);
        let newValuePreview: any = ratio * props.duration;

        const minutes = Math.floor(newValuePreview / 60);
        const seconds = Math.floor(newValuePreview % 60);
        const formattedMinutes = minutes.toString().padStart(2, "0");
        const formattedSeconds = seconds.toString().padStart(2, "0");
        const formattedTime = `${formattedMinutes}:${formattedSeconds}`;

        setMousePosition({ x: offsetX > umbral ? umbral + 5 : offsetX < 0 ? -5 : offsetX , y: offsetY });
        setValuePreview(formattedTime);

        if (previewFrameRef.current) {
            const index = Math.floor((newValuePreview * props.thumbnails.length) / props.duration);
            previewFrameRef.current.src = props.thumbnails[index];
        }
    };

    const handleMouseOut = () => {
        if (previewCurrentRef.current) {
            previewCurrentRef.current.style.display = "none";
        }
    };

    return (
        <div className="w-full h-2 relative bg-red-500">
            <span id="range-duration" className="w-full bg-gray-300 h-full absolute  cursor-pointer"></span>
            <span id="range-progress" className="bg-indigo-600 h-full absolute  cursor-pointer transition-all duration-0"></span>

            <input
                ref={rangeRef}
                type="range"
                id="range-video"
                className="h-full w-full absolute cursor-pointer"
                value={props.value}
                min={0}
                max={props.duration}
                onChange={handleChangeValue}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseOut={handleMouseOut}
            />
            <div
                ref={previewCurrentRef}
                id="preview-current"
                className="flex-col relative top-0 hidden gap-y-0.5 justify-center w-[200px] h-[150px] items-center"
                style={{ top: mousePosition.y, left: mousePosition.x }}
            >
                <span id="preview-frame" className="w-full h-full p-[3px] bg-indigo-600 rounded-md">
                    <img
                        ref={previewFrameRef}
                        id="frame"
                        src={previewFrameRef?.current?.src}
                        className="w-full h-full object-cover rounded-[4px]"
                    />
                </span>
                <span className="bg-indigo-600 text-white text-xs px-1 py-0.5 rounded-md w-fit">
                    {valuePreview}
                </span>
            </div>
        </div>
    );
}

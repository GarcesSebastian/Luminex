import React, { useEffect, useState, useRef } from "react";
import * as Globals from '../../ts/globals'

export default function Range(props: any) {
    const [valuePreview, setValuePreview] = useState("00:00");
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
    const rangeRef = useRef<HTMLInputElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const previewFrameRef = useRef<HTMLImageElement>(null);
    const previewCurrentRef = useRef<HTMLLegendElement>(null);
    const imageCurrentRef = useRef<HTMLDivElement>(null);

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
            previewCurrentRef.current.style.display = "initial";
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLInputElement>) => {
        if (!(e.nativeEvent.offsetX > 0)) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const offsetX = e.clientX - rect.left - 75;
        const offsetY = e.currentTarget.offsetTop - (document.querySelector("#preview-auto")?.clientHeight ?? 0) - 10;
        const rangeWidth = rect.width;
        const ratio = e.nativeEvent.offsetX / rangeWidth;
        const umbral = rangeWidth - (document.querySelector("#preview-auto")?.clientWidth ?? 0);
        let newValuePreview: any = ratio * props.duration;

        const minutes = Math.floor(newValuePreview / 60);
        const seconds = Math.floor(newValuePreview % 60);
        const formattedMinutes = minutes.toString().padStart(2, "0");
        const formattedSeconds = seconds.toString().padStart(2, "0");
        const formattedTime = `${formattedMinutes}:${formattedSeconds}`;

        setMousePosition({ x: offsetX > umbral ? umbral + 5 : offsetX < 0 ? -5 : offsetX , y: offsetY });
        setValuePreview(formattedTime);

        const positionInterval = Math.ceil(newValuePreview / 25)
        
        if(props.thumbnailFather != props.thumbnails[positionInterval - 1].image){
            props.setThumbnailFather(props.thumbnails[positionInterval - 1].image);
        }

        const valueThumbnailFather = Math.ceil(newValuePreview);
        
        const umbralY = 5 * (positionInterval - 1);
        let rows = Math.ceil(valueThumbnailFather / 5 - umbralY) == 0 ? 1 : Math.ceil(valueThumbnailFather / 5 - umbralY);
        rows -= 1;

        const Cl = Globals.DEFAULT_CEILING_THUMBNAIL;
        const Cl_R = Cl * rows;
        const Cl_R_Cl = Cl_R - Cl
        const umbralX = (umbralY != 0 ? Math.pow(umbralY, 2) : 0) * (positionInterval - 1);
        const columns = Math.ceil(((valueThumbnailFather - umbralX) - Cl_R_Cl)) - 6;

        console.log("rows: " + rows);
        console.log("columns: " + columns);
        console.log("umbralX: " + umbralX);
        console.log("Cl: " + Cl);
        console.log("Cl_R: " + Cl_R);
        console.log("Cl_R_Cl: " + Cl_R_Cl);
        console.log("valueThumbnailFather: " + valueThumbnailFather);

        const imagePositionX = columns * (Globals.DEFAULT_WIDTH_THUMBNAIL / Globals.DEFAULT_CEILING_THUMBNAIL);
        const imagePositionY = rows * (Globals.DEFAULT_HEIGHT_THUMBNAIL / Globals.DEFAULT_CEILING_THUMBNAIL);

        setImagePosition({ x: -imagePositionX, y: -imagePositionY });
        if (imageCurrentRef.current) {
            imageCurrentRef.current.style.top = -imagePositionY + 'px';
            imageCurrentRef.current.style.left = -imagePositionX + 'px';
        }
    };

    const handleMouseOut = () => {
        if (previewCurrentRef.current) {
            previewCurrentRef.current.style.display = "none";
        }
    };

    return (
        <div className="w-full h-2 relative bg-red-500">
            <span id="range-duration" className="w-full bg-gray-300 h-full absolute  cursor-pointer z-50"></span>
            <span id="range-progress" className="bg-indigo-600 h-full absolute  cursor-pointer transition-all duration-0 z-50"></span>

            <input
                ref={rangeRef}
                type="range"
                id="range-video"
                className="h-full w-full absolute cursor-pointer z-50"
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


            <div ref={previewCurrentRef} id="preview-auto" style={{width: Globals.DEFAULT_WIDTH_THUMBNAIL / Globals.DEFAULT_CEILING_THUMBNAIL, height: Globals.DEFAULT_HEIGHT_THUMBNAIL / Globals.DEFAULT_CEILING_THUMBNAIL, top: mousePosition.y, left: mousePosition.x}} className='overflow-hidden absolute bg-indigo-600 shadow-lg shadow-indigo-600 rounded-md'>
                <div ref={imageCurrentRef} id="content-frame-testt" style={{top: 0, left: 0, width: Globals.DEFAULT_WIDTH_THUMBNAIL, height: Globals.DEFAULT_HEIGHT_THUMBNAIL, backgroundImage: `url('http://localhost:4000/${props.thumbnailFather}')`, backgroundSize: "cover"}} className="relative bg-blue-500">
                </div>
            </div>

                <span className="bg-indigo-600 text-white text-xs px-1 py-0.5 rounded-md w-fit">
                    {valuePreview}
                </span>

        </div>
    );
}

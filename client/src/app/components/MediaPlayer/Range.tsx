import React, { useEffect, useState, useRef } from "react";
import * as Globals from '../../ts/globals'

export default function Range(props: any) {
    const [valuePreview, setValuePreview] = useState("00:00");
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [mouseClickPosition, setMouseClickPosition] = useState({ x: 0, y: 0 });
    const [isChangingMousePosition, setIsChangingMousePosition] = useState(false);
    const rangeRef = useRef<HTMLInputElement>(null);
    const previewCurrentRef = useRef<HTMLLegendElement>(null);
    const imageCurrentRef = useRef<HTMLDivElement>(null);
    const previewCurrentTIme = useRef<HTMLDivElement>(null);

    useEffect(() => {
        props.setValue(props.currentTime);

        const rangeProgress = document.getElementById("range-progress");
        if (rangeProgress) {
            const progress = ((props.currentTime ?? 0) * 100) / props.duration;
            rangeProgress.style.width = `${progress}%`;
        }

        if (props.currentTime >= props.duration) {
            props.handlePlayVideo();
        }
    }, [props.currentTime]);

    const handleChangeValue = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rect = e.target.getBoundingClientRect();
        const rectWidth = rect.width;
        const offsetX = mouseClickPosition.x;
        const ratio = Number((offsetX / rectWidth).toFixed(2));
        const newValue = ratio * props.duration;

        (document.querySelector("video") as HTMLVideoElement).currentTime = newValue;
        props.setValue(newValue);
        props.setValue(props.currentTime);
        
        const rangeProgress = document.getElementById("range-progress");
        if (rangeProgress) {
            const progress = ((props.currentTime ?? 0) * 100) / props.duration;
            rangeProgress.style.width = `${progress}%`;
        }

    };

    const handleMouseDown = (e: React.MouseEvent<HTMLInputElement>) => {
        (document.querySelector("video") as HTMLVideoElement).pause();
        setMouseClickPosition({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
        setIsChangingMousePosition(true);
    };

    const handleMouseUp = () => {
        setIsChangingMousePosition(false);
        if (!props.isPlaying) return;
        (document.querySelector("video") as HTMLVideoElement).play();
    };

    const handleMouseEnter = () => {
        if (previewCurrentRef.current && previewCurrentTIme.current) {
            previewCurrentRef.current.style.display = "initial";
            previewCurrentTIme.current.style.display = "initial";
        }
    };
    
    const handleMouseOut = () => {
        if (previewCurrentRef.current && previewCurrentTIme.current) {
            previewCurrentRef.current.style.display = "none";
            previewCurrentTIme.current.style.display = "none";
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLInputElement>) => {
        if (!(e.nativeEvent.offsetX > 0)) return;        

        if (isChangingMousePosition){
            const rect = e.currentTarget.getBoundingClientRect();
            const rectWidth = rect.width;
            const offsetX = mouseClickPosition.x;
            const ratio = Number((offsetX / rectWidth).toFixed(2));
            const newValue = ratio * props.duration;
    
            (document.querySelector("video") as HTMLVideoElement).currentTime = newValue;
            props.setValue(newValue);
            props.setValue(props.currentTime);
            
            const rangeProgress = document.getElementById("range-progress");
            if (rangeProgress) {
                const progress = ((props.currentTime ?? 0) * 100) / props.duration;
                rangeProgress.style.width = `${progress}%`;
            }
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const offsetX = e.clientX - rect.left - ((Globals.DEFAULT_WIDTH_THUMBNAIL / Globals.DEFAULT_CEILING_THUMBNAIL) / 2 ?? 0) ;
        const offsetY = e.currentTarget.offsetTop - ((Globals.DEFAULT_HEIGHT_THUMBNAIL / Globals.DEFAULT_CEILING_THUMBNAIL) ?? 0) - 10;
        const rangeWidth = rect.width;
        const ratio = e.nativeEvent.offsetX / rangeWidth;
        const umbral = rangeWidth - ((Globals.DEFAULT_WIDTH_THUMBNAIL / Globals.DEFAULT_CEILING_THUMBNAIL) ?? 0);
        let newValuePreview = ratio * props.duration;

        const minutes = Math.floor(newValuePreview / 60);
        const seconds = Math.floor(newValuePreview % 60);
        const formattedMinutes = minutes.toString().padStart(2, "0");
        const formattedSeconds = seconds.toString().padStart(2, "0");
        const formattedTime = `${formattedMinutes}:${formattedSeconds}`;

        setMousePosition({ x: offsetX > umbral ? umbral + 5 : offsetX < 0 ? -5 : offsetX , y: offsetY });
        setMouseClickPosition({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
        setValuePreview(formattedTime);

        const positionInterval = Math.ceil(newValuePreview / 25)
        
        if(props.thumbnailFather != props.thumbnails[positionInterval - 1].image){
            props.setThumbnailFather(props.thumbnails[positionInterval - 1].image);
        }

        const valueThumbnailFather = Math.ceil(newValuePreview);

        const umbralY = 5 * (positionInterval - 1);
        let rows = Math.ceil(valueThumbnailFather / 5 - umbralY) == 0 ? 1 : Math.ceil(valueThumbnailFather / 5 - umbralY);

        const Cl = Globals.DEFAULT_CEILING_THUMBNAIL;
        const Cl_R = Cl * rows;
        const Cl_R_Cl = Cl_R - Cl
        const umbralX = 25 * (positionInterval - 1);
        const columns = Math.ceil(((valueThumbnailFather - umbralX) - Cl_R_Cl)) - 1;

        console.log("PositionInterval: " + positionInterval);
        console.log("ValueThumbnailFather: " + valueThumbnailFather);
        console.log("test: " + (Math.ceil(valueThumbnailFather - umbralX) - 1));
        
        console.log("umbralY: " + umbralY);
        console.log("Cl: " + Cl);
        console.log("Cl_R: " + Cl_R);
        console.log("Cl_R_Cl: " + Cl_R_Cl);
        console.log("UmbralX: " + umbralX);

        const imagePositionX = columns * (Globals.DEFAULT_WIDTH_THUMBNAIL / Globals.DEFAULT_CEILING_THUMBNAIL);
        const imagePositionY = (rows - 1) * (Globals.DEFAULT_HEIGHT_THUMBNAIL / Globals.DEFAULT_CEILING_THUMBNAIL);

        if (imageCurrentRef.current) {
            imageCurrentRef.current.style.top = -imagePositionY + 'px';
            imageCurrentRef.current.style.left = -imagePositionX + 'px';
        }

        console.log("Columns: " + columns, "Rows: " + rows);
        
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


            <div ref={previewCurrentRef} id="preview-auto" style={{width: Globals.DEFAULT_WIDTH_THUMBNAIL / Globals.DEFAULT_CEILING_THUMBNAIL, height: Globals.DEFAULT_HEIGHT_THUMBNAIL / Globals.DEFAULT_CEILING_THUMBNAIL, top: mousePosition.y - 25, left: mousePosition.x}} className='overflow-hidden hidden absolute bg-indigo-600 shadow-lg shadow-indigo-600 rounded-md'>
                <div ref={imageCurrentRef} id="content-frame-testt" style={{top: 0, left: 0, width: Globals.DEFAULT_WIDTH_THUMBNAIL, height: Globals.DEFAULT_HEIGHT_THUMBNAIL, backgroundImage: `url('https://luminex-fullstack.vercel.app${props.thumbnailFather}')`, backgroundSize: "cover"}} className="relative bg-blue-500">
                </div>
            </div>

            <span ref={previewCurrentTIme} style={{top: mousePosition.y + Globals.DEFAULT_HEIGHT_THUMBNAIL / Globals.DEFAULT_CEILING_THUMBNAIL - 20, left: mousePosition.x - (previewCurrentTIme.current?.clientWidth ?? 0 ) / 2 + (Globals.DEFAULT_WIDTH_THUMBNAIL / Globals.DEFAULT_CEILING_THUMBNAIL / 2 )}} className="bg-indigo-600 absolute hidden text-white text-xs px-1 py-0.5 rounded-md w-fit">
                {valuePreview}
            </span>

        </div>
    );
}

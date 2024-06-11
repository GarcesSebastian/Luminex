import React, { useEffect, useState, useRef } from "react";
import * as Globals from '../../ts/globals'

export default function Range(props: any) {
    const [valuePreview, setValuePreview] = useState("00:00");
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [mouseClickPosition, setMouseClickPosition] = useState({ x: 0, y: 0 });
    const [isChangingMousePosition, setIsChangingMousePosition] = useState(false);
    const [progressTime, setProgress] = useState(0);
    const rangeRef = useRef<HTMLInputElement>(null);
    const previewCurrentRef = useRef<HTMLLegendElement>(null);
    const previewCurrentRefBg = useRef<HTMLDivElement>(null);
    const imageCurrentRef = useRef<HTMLDivElement>(null);
    const previewCurrentTIme = useRef<HTMLDivElement>(null);

    const changeMousePosition = () => {
        const rect = rangeRef.current?.getBoundingClientRect();
        const offsetX = mouseClickPosition.x;
        const rectWidth = rect?.width ?? 0;
        const ratio = Number((offsetX / rectWidth).toFixed(2));
        const newValue = ratio * props.duration;
        const progress = ((newValue ?? 0) * 100) / props.duration;
        setProgress(progress);

        if (newValue < 0) {
            props.videoPlayer.currentTime = 0;
            return;
        }

        if (newValue > props.duration) {
            props.videoPlayer.currentTime = props.duration;
            return;
        }

        props.videoPlayer.currentTime = newValue;
    }

    useEffect(() => {
        props.setValue(props.currentTime);
        const progress = ((props.currentTime ?? 0) * 100) / props.duration;
        setProgress(progress);

        if (props.currentTime >= props.duration) {
            props.handlePlayVideo();
        }
    }, [props.currentTime]);

    useEffect(() => {
        if (isChangingMousePosition) {
            changeMousePosition();
        }
    }, [isChangingMousePosition]);

    const handleMouseDown = (e: React.MouseEvent<HTMLInputElement>) => {
        (props.videoPlayer as HTMLVideoElement).pause();
        setMouseClickPosition({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
        setIsChangingMousePosition(true);
        changeMousePosition();
    };

    const handleMouseUp = () => {
        setIsChangingMousePosition(false);
        if (!props.isPlaying) return;
        (props.videoPlayer as HTMLVideoElement).play();
    };

    const handleMouseEnter = () => {
        if (previewCurrentRef.current && previewCurrentTIme.current && previewCurrentRefBg.current) {
            previewCurrentRef.current.style.display = "initial";
            previewCurrentTIme.current.style.display = "initial";
            previewCurrentRefBg.current.style.display = "initial";
        }
    };
    
    const handleMouseOut = () => {
        if (previewCurrentRef.current && previewCurrentTIme.current && previewCurrentRefBg.current) {
            previewCurrentRef.current.style.display = "none";
            previewCurrentTIme.current.style.display = "none";
            previewCurrentRefBg.current.style.display = "none";
        }
    };

    const handleMousePressed = (e: React.MouseEvent<HTMLInputElement>) => {
        if (!isChangingMousePosition) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const rangeWidth = rect.width;
        const ratio = e.nativeEvent.offsetX / rangeWidth;
        const newValuePreview = ratio * props.duration;
        const progress = ((newValuePreview ?? 0) * 100) / props.duration;

        if(progress < 0) {
            setProgress(0);
            props.videoPlayer.currentTime = 0;
            return;
        };
        if(progress > 100) {
            setProgress(100);
            props.videoPlayer.currentTime = props.duration;
            return;
        };

        setProgress(progress);
        props.videoPlayer.currentTime = newValuePreview;
    }

    const handleMouseMove = (e: React.MouseEvent<HTMLInputElement>) => {
        if (!(e.nativeEvent.offsetX > 0)) return;        
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
        console.log(newValuePreview, props.duration);
        
        if(newValuePreview > 0 && newValuePreview < props.duration){
            setValuePreview(formattedTime);
        }else if(newValuePreview >= props.duration){
            setValuePreview(() => {
                const minutes = Math.floor(props.duration / 60);
                const seconds = Math.floor(props.duration % 60);
                const formattedMinutes = minutes.toString().padStart(2, "0");
                const formattedSeconds = seconds.toString().padStart(2, "0");
                const formattedTime = `${formattedMinutes}:${formattedSeconds}`;

                return formattedTime;
            });
            return;
        }else if(newValuePreview <= 0){
            setValuePreview("00:00");
            return;
        }

        const positionInterval = Math.ceil(newValuePreview / (Globals.DEFAULT_CEILING_THUMBNAIL * Globals.DEFAULT_CEILING_THUMBNAIL))
        
        if(props.thumbnailFather != props.thumbnails[positionInterval - 1].image){
            props.setThumbnailFather(props.thumbnails[positionInterval - 1].image);
        }

        const valueThumbnailFather = Math.ceil(newValuePreview);

        const umbralY = (Globals.DEFAULT_CEILING_THUMBNAIL) * (positionInterval - 1);
        let rows = Math.ceil(valueThumbnailFather / (Globals.DEFAULT_CEILING_THUMBNAIL) - umbralY) == 0 ? 1 : Math.ceil(valueThumbnailFather / (Globals.DEFAULT_CEILING_THUMBNAIL) - umbralY);

        const Cl = Globals.DEFAULT_CEILING_THUMBNAIL;
        const Cl_R = Cl * rows;
        const Cl_R_Cl = Cl_R - Cl
        const umbralX = (Globals.DEFAULT_CEILING_THUMBNAIL * Globals.DEFAULT_CEILING_THUMBNAIL) * (positionInterval - 1);
        const columns = Math.ceil(((valueThumbnailFather - umbralX) - Cl_R_Cl)) - 1;

        const imagePositionX = columns * (Globals.DEFAULT_WIDTH_THUMBNAIL / Globals.DEFAULT_CEILING_THUMBNAIL);
        const imagePositionY = (rows - 1) * (Globals.DEFAULT_HEIGHT_THUMBNAIL / Globals.DEFAULT_CEILING_THUMBNAIL);

        if (imageCurrentRef.current) {
            imageCurrentRef.current.style.top = -imagePositionY + 'px';
            imageCurrentRef.current.style.left = -imagePositionX + 'px';
        }
    };

    const handleMouseMoveGeneral = (e: React.MouseEvent<HTMLInputElement>) => {
        handleMousePressed(e);
        handleMouseMove(e);
    }

    return (
        <div className="content-range w-full h-1 relative bg-red-500 flex justify-start items-center transition-all duration-200 ease-out">
            <span id="range-duration" className="w-full bg-gray-300 h-full absolute  cursor-pointer z-50"></span>
            <span id="range-progress" style={{width: progressTime + "%"}} className=" bg-indigo-600 h-full absolute cursor-pointer transition-all duration-0 z-50"></span>
            <span id="range-circle-inner" style={{left: progressTime + "%"}} className="bg-indigo-600 w-0 h-0 -translate-x-1 duration-200 ease-out rounded-full absolute z-50"></span>

            <input
                ref={rangeRef}
                type="range"
                id="range-video"
                className="h-full w-full absolute cursor-pointer z-50"
                value={props.value}
                min={0}
                max={props.duration}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMoveGeneral}
                onMouseEnter={handleMouseEnter}
                onMouseOut={handleMouseOut}
            />


            <div ref={previewCurrentRefBg} id="bg-preview-auto" className="z-10 bg-indigo-600 shadow-lg shadow-indigo-600 rounded-md absolute hidden" style={{width: Globals.DEFAULT_WIDTH_THUMBNAIL / Globals.DEFAULT_CEILING_THUMBNAIL + 8, height: Globals.DEFAULT_HEIGHT_THUMBNAIL / Globals.DEFAULT_CEILING_THUMBNAIL + 8, top: mousePosition.y - 29, left: mousePosition.x - 4}}>

            </div>

            <div ref={previewCurrentRef} id="preview-auto" style={{width: Globals.DEFAULT_WIDTH_THUMBNAIL / Globals.DEFAULT_CEILING_THUMBNAIL, height: Globals.DEFAULT_HEIGHT_THUMBNAIL / Globals.DEFAULT_CEILING_THUMBNAIL, top: mousePosition.y - 25, left: mousePosition.x}} className='overflow-hidden hidden absolute z-10'>
                <div ref={imageCurrentRef} id="content-frame-testt" style={{top: 0, left: 0, width: Globals.DEFAULT_WIDTH_THUMBNAIL, height: Globals.DEFAULT_HEIGHT_THUMBNAIL, backgroundImage: `url('http://192.168.1.10:4000${props.thumbnailFather}')`, backgroundSize: "cover"}} className="relative bg-blue-500">
                </div>
            </div>

            <span ref={previewCurrentTIme} style={{top: mousePosition.y + Globals.DEFAULT_HEIGHT_THUMBNAIL / Globals.DEFAULT_CEILING_THUMBNAIL - 20, left: mousePosition.x - (previewCurrentTIme.current?.clientWidth ?? 0 ) / 2 + (Globals.DEFAULT_WIDTH_THUMBNAIL / Globals.DEFAULT_CEILING_THUMBNAIL / 2 )}} className="bg-indigo-600 absolute hidden text-white text-xs px-1 py-0.5 rounded-md w-fit z-10">
                {valuePreview}
            </span>

        </div>
    );
}

export async function changeVideoResolution(videoFile: any, resolution: any, index: number, clientId: string){
    if (videoFile) {
        const formData = new FormData();
        formData.append('file', videoFile);
        formData.append('resolution', resolution);
        formData.append('index', index.toString());

        try {
            const response = await fetch('http://localhost:4000/convert', {
                method: 'POST',
                headers: {
                    'client-id': clientId,
                },
                body: formData
            });
    
            if (!response.ok) {

                const response_data = await response.json();

                if(response_data.message == "Is quality"){
                    return {status: response_data.message , range: response_data.range};
                }

                if(response_data.message == "File not found"){
                    return {status: response_data.message , range: response_data.range};
                }

                throw new Error(`Error: ${response.statusText}`);
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            return url;
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to convert video.');
            return null;
        }
    }else{
        alert('Please select a video file.');
    }
}

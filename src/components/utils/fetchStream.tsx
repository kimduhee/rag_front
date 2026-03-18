const fetchStreamData = async (streamUrl: any, question: any, controller: any, onChunk: any) => {
    
    try {
        const res = await fetch(streamUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "text/event-stream"
            },
            body: JSON.stringify({ question: question }),
            signal: controller.signal,
        });

        //결과가 200이 아닐경우
        if(!res.ok) {
            throw new Error("데이터 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
        }

        //응답값 없을 경우
        if(!res.body) {
            throw new Error("데이터 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");

        let streamData = '';

        while(true) {
            const { done, value } = await reader.read();
            if(done) break;
            const streamData = decoder.decode(value, {stream: true});
            onChunk(streamData);
        }

        return;
    } catch(err: any) {
        throw new Error(err.message);
    }
}

export default fetchStreamData;
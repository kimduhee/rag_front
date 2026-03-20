export const fetchData = async (streamUrl: any, params: any, controller: any) => {
    
    try {
        const res = await fetch(streamUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify(params)
        });

        //결과가 200이 아닐경우
        if(!res.ok) {
            throw new Error("데이터 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
        }

        //응답값 없을 경우
        if(!res.body) {
            throw new Error("데이터 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
        }

        const result = res.json()
        console.log(result);
        return result;
        
    } catch(err: any) {
        console.log(err);
    }
}
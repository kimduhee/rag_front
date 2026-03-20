import { fetchData } from '@/api/requestHttp'
import { mapToChatHistoryList, mapToMessageHistoryList } from '@/mapper/historyMapper'

export const getChatHistoryList = async (params: any) => {

    const backEndUrl = import.meta.env.VITE_BACK_END_URL as string;
    const chatUrl = import.meta.env.VITE_CHAT_HISTORY_URL as string;
    const serviceUrl = (backEndUrl + chatUrl) as string;

    const res: any = await fetchData(serviceUrl, params, null);
    return mapToChatHistoryList(res.chatHistoryList);
}

export const getMessageHistoryList = async (params: any) => {

    const backEndUrl = import.meta.env.VITE_BACK_END_URL as string;
    const messageUrl = import.meta.env.VITE_MESSAGE_HISTORY_URL as string;
    const serviceUrl = (backEndUrl + messageUrl) as string;

    const res: any = await fetchData(serviceUrl, params, null);
    return mapToMessageHistoryList(res.messageHistoryList);
}
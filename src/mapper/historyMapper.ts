import { ChatHistory } from '@/model/history'
import { Message } from '@/types/chat'

// 채팅 단건
export const mapToChatHistory = (item: any): ChatHistory => ({
    chatId: item.chatId,
    title: item.title,
    date: item.date
})

// 채팅 목록
export const mapToChatHistoryList = (items: any[]): ChatHistory[] =>
    items.map(mapToChatHistory);

// 메시지 단건을 2개로 쪼갬
export const mapToMessageHistory = (item: any): Message[] => {
    
    const base = {
        chatId: item.chatId,
        msgId: item.msgId
    };
    
    return [
        {
            id: item.msgId + "-user",
            ...base,
            role: "user",
            content: item.question,
            references: []
        },
        {
            id: item.msgId + "-assistant",
            ...base,
            role: "assistant",
            content: item.answer,
            references: item.references?.map((ref: any) => ({
                file_name: ref.fileName,
                page: ref.page,
                uid: ref.uid
            })) ?? [],
        },
    ];
};

export const mapToMessageHistoryList = (items?: any[]): Message[] =>
    items?.flatMap(mapToMessageHistory) ?? [];

export const mapToChatDelete = (item: any) => ({
    success: item.success,
})

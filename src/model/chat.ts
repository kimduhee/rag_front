type MessageRole = "user" | "assistant";

export interface Message {
    id: string;
    chatId: string;
    msgId: string;
    role: MessageRole;
    content: string;
    references?: ReferenceDoc[];
}

export interface ReferenceDoc {
    file_name: string;
    page?: number;
    uid?: string;
}
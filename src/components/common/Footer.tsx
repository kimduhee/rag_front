import React, { useState, useRef } from 'react';
import {fetchStreamData} from'@/components/utils/fetchStream'
import {Message, ReferenceDoc} from '@/types/chat'

const Footer = ({
  setMessages,
  isStreaming,
  setIsStreaming,
  chatId,
  setChatId
} : {
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isStreaming: boolean;
  setIsStreaming: React.Dispatch<React.SetStateAction<boolean>>;
  chatId: string;
  setChatId: React.Dispatch<React.SetStateAction<string>>;
}) => {

  // 채팅 입력창
  const [input, setInput] = useState("");
  // 채팅 진행중 여부
  //const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // 채팅 입력창 키보드 입력시(엔터키 OR shift+엔터키 처리)
  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    console.log(e.key);
    if(e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // chat API 호출
      handleSend();
    }
  }

  const appendMessageContent = (id: string, streamData: string) => {
    setMessages((prev: any) => 
      prev.map((m: any) => (m.id === id ? { ...m, content: m.content + streamData } : m))
    );
  };

  const updateMessageId = (id: string, chatId: string, msgId: string) => {
    setMessages((prev: any) => 
      prev.map((m: any) => (m.id === id ? { ...m, chatId: chatId, msgId: msgId } : m))
    );
  }

  // 답변에 출처문서 목록 추가
  const addReference = ((id: string, ref: ReferenceDoc) => {
    const file_name = (ref.file_name ?? "파일명이 없습니다.").trim();
    
    setMessages((prev: any) => prev.map((m: any) => {
      if (m.id !== id) return m;
      const existing  = m.references ?? [];
      return {...m, references: [...existing, {...ref, file_name}]}
    }));
  });

  const stopStreaming = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  };

  // 질문 요청
  const handleSend = async () => {

    console.log("질문값: " + input);

    const question = input.trim();
    if(!question) return;
    // 이전 채팅 처리 중일 경우 현재 요청 중지
    if(isStreaming) return;

    const backEndUrl = import.meta.env.VITE_BACK_END_URL as string;
    const chatUrl = import.meta.env.VITE_CHAT_URL as string;
    const serviceUrl = (backEndUrl + chatUrl) as string;

    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const uuid = crypto.randomUUID(); 
    const assistantId = `${dateStr}_${uuid}_assistant`;
    const userId = `${dateStr}_${uuid}_user`;

    console.log("assistantId: " + assistantId);

    const now = Date.now();
    const userMsg: Message = {
      id: userId,
      chatId: chatId,
      msgId: "",
      role: "user",
      content: question,
    };

    // 어시스턴트 메시지는 빈 content로 먼저 추가 후 스트리밍으로 채움
    const assistantMsg: Message = {
      id: assistantId,
      chatId: chatId,
      msgId: "",
      role: "assistant",
      content: "",
      references: [],
    };

    // 이전 스트림이 있으면 취소
    abortRef.current?.abort();

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");

    const controller = new AbortController();
    abortRef.current = controller;

    // 채팅 진행 여부 true로 처리
    setIsStreaming(true);

    try {
      await fetchStreamData(serviceUrl, question, abortRef, (streamData: any) => {

        const lines = streamData.split("\n");
        const dataLines = lines
          .map((l: any) => l.replace(/\r$/, ""))  // 윈도우 개행 처리: \r\n → \n
          .filter((l: any) => l.startsWith("data:"))  // data:로 시작하는 줄만 남김
          .map((l: any) => l.slice(5).trimStart()); // (5글자) 잘라내고 앞 공백 제거

        // 데이터 없음
        if(dataLines.length === 0) {
          return;
        }

        const data = dataLines.join("\n");
        let delta = data;
        let referencesJson: any | undefined;

        if(delta === "[DONE]") {
          // 종료 flag
          return;
        } else if(delta.startsWith("[TOKEN]")) {
          // 답변 stream 문자
          delta = delta.replace("[TOKEN]", "");
        } else if(delta.startsWith("[ERROR]")) {
          // 에러 메시지 문자
          delta = delta.replace("[ERROR]", "");
        } else if(delta.startsWith("[REFERENCE]")) {
          // 출처 문서 json 문자자
          const payload = delta.replace("[REFERENCE]", "").trim();
          if (!payload) return;

          const refObj = JSON.parse(payload) as any;

          addReference(assistantId, {
            file_name: refObj.file_name, 
            page: refObj.page,
            uid: refObj.uid
          });
          return;
        } else if(delta.startsWith("[INFO]")) {
          const payload = delta.replace("[INFO]", "").trim();
          if (!payload) return;

          const refObj = JSON.parse(payload) as any;

          setChatId(refObj.chatId);

          console.log("chatId: " + chatId);

          updateMessageId(assistantId, refObj.chatId, refObj.msgId);
          return;
        }

        if(delta) {
          appendMessageContent(assistantId, delta);
        }
      });
    } catch(e: any) {
      if(e?.name === "AbortError") {
        console.log("중지!!!!");
      }
    } finally {
      abortRef.current = null;
      // 채팅 진행 여부 false로 처리
      setIsStreaming(false);
    }
  }

  return (
    <footer className="chat-input-area">
      <div className="input-wrapper">
        <textarea
          rows={1}
          placeholder="메시지를 입력하세요. (Enter: 전송, Shift+Enter: 줄바꿈)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {isStreaming ? (
          <button 
            className="send-btn" 
            onClick={stopStreaming}
          >
            중지
          </button>
        ) : (
          <button 
            className="send-btn" 
            onClick={handleSend}
          >
            보내기
          </button>
        )}
      </div>
      <div className="input-hint">RAG LLM 챗봇 v.0.0.1</div>
    </footer>
  );
}

export default Footer;
import React, { useState, useRef } from 'react';
import fetchStreamData from'@/components/utils/fetchStream'

const Footer = () => {

  // 채팅 입력창
  const [input, setInput] = useState("");
  // 채팅 진행중 여부
  const [isStreaming, setIsStreaming] = useState(false);
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

  // 질문 요청
  const handleSend = async () => {

    console.log("질문값: " + input);

    const question = input.trim();
    if(!question) return;
    // 이전 채팅 처리 중일 경우 현재 요청 중지
    if(isStreaming) return;

    // 이전 스트림이 있으면 취소
    abortRef.current?.abort();

    // 채팅 진행 여부 true로 처리
    setIsStreaming(true);

    const streamUrl = import.meta.env.VITE_SSE_URL as string;

    try {
      const streamData = fetchStreamData(streamUrl, question, abortRef, (streamData: any) => {
        const lines = streamData.split("\n");
        const dataLines = lines
          .map((l: any) => l.replace(/\r$/, ""))  // 윈도우 개행 처리: \r\n → \n
          .filter((l: any) => l.startsWith("data:"))  // data:로 시작하는 줄만 남김
          .map((l: any) => l.slice(5).trimStart()); // (5글자) 잘라내고 앞 공백 제거
        console.log(dataLines);
      });
    } catch(e: any) {

    } finally {
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
        <button className="send-btn" onClick={handleSend}>
          보내기
        </button>
      </div>
      <div className="input-hint">RAG LLM 챗봇 v.0.0.1</div>
    </footer>
  );
}

export default Footer;
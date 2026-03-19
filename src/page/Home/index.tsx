import React, {useEffect, useRef } from 'react'
import ReactMarkdown from "react-markdown";
import { useOutletContext } from "react-router-dom";
import remarkGfm from "remark-gfm";
import {Message} from '@/types/chat'

const Home = () => {

    const { messages, isStreaming } = useOutletContext<{
        messages: Message[];
        isStreaming: boolean;
    }>();

    // 질문시 스크롤 맨 하단으로 이동
    const bottomRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <section className="chat-messages">
            { messages.map((msg, idx) => (
            <div 
                key={msg.id}
                className={`message-row
                ${ msg.role ==="user" ? "from-user" : "from-assistant" }`
                }
            >
              <div className="bubble-wrapper">
                <div className="bubble">
                    { msg.role === "assistant" ? (
                    <div className="md">
                        {/* streaming 중이고 마지막 메세지 일 경우 처리 */}
                        { isStreaming && idx === messages.length - 1 ? (
                        msg.content
                        ) : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        { msg.content }
                        </ReactMarkdown>
                        )}
                        { msg.references && msg.references.length > 0 ? (
                        <div className="refs">
                          <div className="refs-title">출처문서</div>
                          <div className="refs-list">
                            { msg.references.map((r, idx) => (
                            <div className="ref-item" key={`${r.uid}-${idx}`}>
                                <div className="ref-main">
                                    <span className="ref-name">{ r.file_name }</span>
                                    <span className="ref-page">p.{ r.page }</span>
                                </div>
                                <a 
                                    className="ref-download" 
                                    href="" 
                                    rel="noreferrer" 
                                    aria-label="다운로드" 
                                    title="다운로드"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        alert("준비중중");
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 3v10m0 0 4-4m-4 4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M4 17v3h16v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </a>
                            </div>
                            )) }
                          </div>
                        </div>
                        ) : null }
                    </div>
                    ) : (
                        msg.content
                    )}
                </div>
              </div>
            </div>
            ))}
            <div ref={ bottomRef }/>
        </section>
    );
}

export default Home;
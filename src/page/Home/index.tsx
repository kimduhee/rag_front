import React from 'react'
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function Home() {
    return (
        <section className="chat-messages">
            <div className="message-row from-assistant">
              <div className="bubble-wrapper">
                <div className="bubble">
                    <div className="md">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        # 삼성전자의 AI는 가우디 입니다.
                      </ReactMarkdown>
                        <div className="refs">
                          <div className="refs-title">출처문서</div>
                          <div className="refs-list">
                            <div className="ref-item">
                                <div className="ref-main">
                                    <span className="ref-name">삼성전자.PDF</span>
                                    <span className="ref-page">p.6</span>
                                </div>
                                <a className="ref-download" href="" target="_blank" rel="noreferrer" aria-label="다운로드" title="다운로드">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 3v10m0 0 4-4m-4 4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M4 17v3h16v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </a>
                            </div>
                          </div>
                        </div>
                    </div>
                    {/* 여기에 질문 값 */}
                </div>
              </div>
            </div>
        </section>
    );
}

export default Home;
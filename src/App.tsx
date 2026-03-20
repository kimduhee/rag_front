/**
 * RAG(Retrieval-Augmented Generation) 챗봇 UI 메인 앱 컴포넌트
 * - SSE(Server-Sent Events) 스트리밍으로 AI 응답 수신
 * - 마크다운 렌더링 및 출처 문서(참조) 표시/다운로드 지원
 */

import React, { useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Sidebar from "@/components/common/Sidebar";
import Header from '@/components/common/Header'

/** 메시지 발신자: 사용자 또는 어시스턴트(AI) */
type MessageRole = "user" | "assistant";

/**
 * 참조 문서 하나의 정보
 * - file_name: 문서명
 * - page: 페이지 번호(선택)
 * - uid: 서버 식별자, 다운로드 URL 생성에 사용
 * - url: 다운로드/보기 링크(직접 지정 시 사용)
 */
interface ReferenceDoc {
  file_name: string;
  page?: number;
  uid?: string;
  url?: string;
}

/**
 * 채팅 메시지 한 건
 * - references: RAG 응답 시 참조한 문서 목록(어시스턴트 메시지에만 사용)
 */
interface Message {
  id: number;
  role: MessageRole;
  content: string;
  time: string;
  references?: ReferenceDoc[];
}

/** 사이드바에 표시되는 대화 목록 항목 */
interface Conversation {
  id: number;
  title: string;
  updatedAt: string;
}

/** 앱 최초 로드 시 표시할 환영 메시지 */
const initialMessages: Message[] = [
  {
    id: 1,
    role: "assistant",
    content: "안녕하세요! 무엇을 도와드릴까요?",
    time: "오전 10:00",
    references: [],
  },
];

/** 사이드바 대화 목록 초기값 (현재는 단일 대화만 사용) */
const initialConversations: Conversation[] = [
  {
    id: 1,
    title: "새 채팅",
    updatedAt: "지금",
  },
];

const App: React.FC = () => {
  // ---- 상태 ----
  /** 현재 대화의 메시지 목록 */
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  /** 사이드바 대화 목록 (추후 다중 대화 전환 시 사용) */
  const [conversations] = useState<Conversation[]>(initialConversations);
  /** 입력창 텍스트 */
  const [input, setInput] = useState("");
  /** 스트리밍 진행 중 여부 (전송 버튼 비활성화, 중지 버튼 표시용) */
  const [isStreaming, setIsStreaming] = useState(false);
  
  /** 스트리밍 fetch 취소용 AbortController (중지/재전송 시 사용) */
  const abortRef = useRef<AbortController | null>(null);

  /** SSE 스트리밍 API URL. .env의 VITE_SSE_URL이 있으면 사용, 없으면 동일 오리진 /api/chat/stream */
  const streamUrl = useMemo(() => {
    const envUrl = import.meta.env.VITE_SSE_URL as string | undefined;
    return envUrl && envUrl.trim().length > 0 ? envUrl : "/api/chat/stream";
  }, []);

  /**
   * 참조 문서 다운로드 URL 접두사.
   * 서버가 uid만 줄 때 클라이언트에서 "접두사 + uid" 로 다운로드 링크 생성.
   * 예: VITE_REFERENCE_DOWNLOAD_PREFIX="http://127.0.0.1:8000/api/files/download?uid="
   */
  const referenceDownloadPrefix = useMemo(() => {
    const envPrefix = import.meta.env.VITE_REFERENCE_DOWNLOAD_PREFIX as string | undefined;
    //return envPrefix && envPrefix.trim().length > 0? envPrefix : "/api/references/download?uid=";
    return envPrefix?.trim() ? envPrefix : "/api/references/download?uid=";
  }, []);

  /** 지정 id 메시지의 content를 통째로 교체 (에러 메시지·중지 시 사용) */
  const updateMessageContent = (id: number, content: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content } : m))
    );
  };

  /** 지정 id(어시스턴트) 메시지 내용 끝에 delta 문자열 추가 (스트리밍 토큰 누적) */
  const appendMessageContent = (id: number, delta: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content: m.content + delta } : m))
    );
  };

  /**
   * 지정 id 메시지에 참조 문서 한 건 추가.
   * file_name이 비어 있으면 무시. 동일한 file_name+page+uid+url 조합은 중복 추가하지 않음.
   */
  const addReference = (id: number, ref: ReferenceDoc) => {
    const file_name = (ref.file_name ?? "").trim();
    if (!file_name) return;

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const existing = m.references ?? [];
        return { ...m, references: [...existing, { ...ref, file_name }] };
      })
    );
  };

  /** 스트리밍 중단: fetch 취소 후 상태 초기화 */
  const stopStreaming = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  };

  /**
   * 전송 버튼/Enter 시 호출.
   * 1) 사용자 메시지 + 빈 어시스턴트 메시지 추가
   * 2) POST /api/chat/stream 으로 SSE 요청
   * 3) 이벤트 스트림 파싱하여 토큰 누적 및 참조 문서 수집
   */
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (isStreaming) return;

    // 이전 스트림이 있으면 취소 (연속 전송 시 안전)
    abortRef.current?.abort();

    const time = new Date().toLocaleTimeString("ko-KR", {
      hour: "numeric",
      minute: "2-digit",
    });

    const now = Date.now();
    const userMsg: Message = {
      id: now,
      role: "user",
      content: trimmed,
      time,
    };

    // 어시스턴트 메시지는 빈 content로 먼저 추가 후 스트리밍으로 채움
    const assistantId = now + 1;
    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      time,
      references: [],
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");

    const controller = new AbortController();
    abortRef.current = controller;
    setIsStreaming(true);

    try {
      const res = await fetch(streamUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ question: trimmed }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        updateMessageContent(
          assistantId,
          `요청 실패: ${res.status} ${res.statusText}${
            text ? `\n\n${text}` : ""
          }`
        );
        return;
      }

      if (!res.body) {
        updateMessageContent(assistantId, "스트림 응답이 없습니다. (res.body 없음)");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      /**
       * SSE 이벤트 블록(빈 줄로 구분된 덩어리) 한 개 처리.
       * - "data:" 로 시작하는 줄만 추출해 payload로 사용
       * - [DONE] 이면 종료
       * - [TOKEN]/[ERROR] 접두사 제거 후 delta로 사용
       * - JSON이면 references 추출 후 delta(content) 추출
       * - [REFERENCE] 로 시작하면 참조 문서 파싱 후 addReference 호출
       */
      const flushEventBlock = (block: string) => {
        const lines = block.split("\n");
        const dataLines = lines
          .map((l) => l.replace(/\r$/, ""))
          .filter((l) => l.startsWith("data:"))
          .map((l) => l.slice(5).trimStart());

        if (dataLines.length === 0) return;

        const data = dataLines.join("\n");

        if (data === "[DONE]") return;

        let delta = data;
        if (delta.startsWith("[TOKEN]")) {
          delta = delta.replace("[TOKEN]", "");
        }
        if (delta.startsWith("[ERROR]")) {
          delta = delta.replace("[ERROR]", "");
        }

        let parsedJson: any | undefined;
        try {
          parsedJson = JSON.parse(data);
        } catch {
          parsedJson = undefined;
        }

        if (parsedJson) {
          // 서버가 references / referenceDocuments 배열로 보낸 경우
          const refs = parsedJson?.references ?? parsedJson?.referenceDocuments;
          if (Array.isArray(refs)) {
            for (const r of refs) {
              const file_name =
                (typeof r?.name === "string" && r.name) ||
                (typeof r?.documentName === "string" && r.documentName) ||
                (typeof r?.title === "string" && r.title) ||
                "";
              const pageRaw = r?.page ?? r?.pageNumber ?? r?.p;
              const page = typeof pageRaw === "number"? pageRaw : typeof pageRaw === "string" ? Number(pageRaw) : undefined;
              const uid =
                (typeof r?.uid === "string" && r.uid) ||
                (typeof r?.id === "string" && r.id) ||
                undefined;
              const url =
                (typeof r?.url === "string" && r.url) ||
                (typeof r?.downloadUrl === "string" && r.downloadUrl) ||
                (typeof r?.href === "string" && r.href) ||
                (uid ? `${referenceDownloadPrefix}${encodeURIComponent(uid)}` : undefined);
              addReference(assistantId, {
                file_name,
                page: Number.isFinite(page as number) ? (page as number) : undefined,
                uid,
                url,
              });
            }
          }

          // JSON 내 텍스트 필드: delta > content > text > message 순으로 사용
          delta =
            parsedJson?.delta ??
            parsedJson?.content ??
            parsedJson?.text ??
            parsedJson?.message ??
            "";
          if (typeof delta !== "string") delta = "";
        }

        // 텍스트 모드 참조: 서버가 "[REFERENCE]" 접두사로 보내는 경우
        // 지원 형식: "[REFERENCE]{...json...}" / "[REFERENCE]이름|페이지|url" / "[REFERENCE]{'page':'14',...}"
        if (delta.startsWith("[REFERENCE]")) {
          const payload = delta.replace("[REFERENCE]", "").trim();
          if (!payload) return;

          const addFromObj = (obj: any) => {
            const file_name =
              (typeof obj?.file_name === "string" && obj.file_name) ||
              (typeof obj?.name === "string" && obj.name) ||
              (typeof obj?.title === "string" && obj.title) ||
              "";
            const pageRaw = obj?.page ?? obj?.pageNumber;
            const page =
              typeof pageRaw === "number"
                ? pageRaw
                : typeof pageRaw === "string"
                  ? Number(pageRaw)
                  : undefined;
            const uid = typeof obj?.uid === "string" ? obj.uid : undefined;
            const url =
              (typeof obj?.url === "string" && obj.url) ||
              (uid ? `${referenceDownloadPrefix}${encodeURIComponent(uid)}` : undefined);

            addReference(assistantId, {
              file_name: file_name || uid || payload,
              page: Number.isFinite(page as number) ? (page as number) : undefined,
              uid,
              url,
            });
          };

          // 1) 표준 JSON 객체
          try {
            const refObj = JSON.parse(payload) as any;
            addFromObj(refObj);
            return;
          } catch {
            // JSON 아님 → 다음 형식 시도
          }

          // 2) Python 스타일 dict 문자열 (작은따옴표)
          if (payload.startsWith("{") && payload.includes("'")) {
            const getPyStr = (key: string) => {
              const re = new RegExp(
                `'${key}'\\s*:\\s*('([^']*)'|([^,}]*))`
              );
              const m = payload.match(re);
              const v = (m?.[2] ?? m?.[3] ?? "").trim();
              return v;
            };

            const obj = {
              page: getPyStr("page"),
              file_name: getPyStr("file_name"),
              uid: getPyStr("uid"),
              content: getPyStr("content"),
            };
            if (obj.page || obj.file_name || obj.uid) {
              addFromObj(obj);
              return;
            }
          }

          // 3) 파이프 구분: "파일명|페이지|url"
          const parts = payload.split("|").map((s) => s.trim());
          addReference(assistantId, {
            file_name: parts[0] ?? payload,
            page: parts[1] ? Number(parts[1]) : undefined,
            url: parts[2] || undefined,
          });
          return;
        }

        if (delta) appendMessageContent(assistantId, delta);
      };

      // ReadableStream 읽기: SSE는 빈 줄("\n\n")로 이벤트 구분
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const eventBlock = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          flushEventBlock(eventBlock);
        }
      }

      // 남은 버퍼가 있으면 마지막 이벤트로 처리
      if (buffer.trim().length > 0) flushEventBlock(buffer);
    } catch (e: any) {
      if (e?.name === "AbortError") {
        // 사용자가 중지한 경우: 이미 받은 내용은 유지, 비어 있으면 "(중지됨)" 표시
        if (messages.find((m) => m.id === assistantId)?.content?.trim().length === 0) {
          updateMessageContent(assistantId, "(중지됨)");
        }
      } else {
        updateMessageContent(assistantId, `스트리밍 중 오류: ${e?.message ?? String(e)}`);
      }
    } finally {
      abortRef.current = null;
      setIsStreaming(false);
    }
  };

  /** 입력창 키다운: Enter만 누르면 전송, Shift+Enter는 줄바꿈 유지 */
  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="app-root">
      {/* 왼쪽: 대화 목록 사이드바 */}
      {/*<Sidebar/>*/}

      {/* 오른쪽: 채팅 영역 */}
      <main className="chat-layout">
        <Header />

        {/* 메시지 목록: 사용자/어시스턴트 구분, 어시스턴트는 마크다운+출처 표시 */}
        <section className="chat-messages">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`message-row ${
                msg.role === "user" ? "from-user" : "from-assistant"
              }`}
            >

              <div className="bubble-wrapper">
                <div className="bubble">
                  {msg.role === "assistant" ? (
                    <div className="md">
                      {/* GFM(테이블, 취소선 등) 지원 마크다운 렌더링 */}
                      {isStreaming ? (
                        msg.content
                      ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                      )}

                      {/* RAG 참조 문서: 파일명, 페이지, 다운로드 링크 */}
                      {msg.references && msg.references.length > 0 ? (
                        <div className="refs">
                          <div className="refs-title">출처문서</div>
                          <div className="refs-list">
                            {msg.references.map((r, idx) => (
                              <div className="ref-item" key={`${r.file_name}-${idx}`}>
                                <div className="ref-main">
                                  <span className="ref-name">{r.file_name}</span>
                                  {typeof r.page === "number" ? (
                                    <span className="ref-page">p.{r.page}</span>
                                  ) : null}
                                </div>
                                {r.url ? (
                                  <a
                                    className="ref-download"
                                    href={r.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label="다운로드"
                                    title="다운로드"
                                  >
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        d="M12 3v10m0 0 4-4m-4 4-4-4"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                      <path
                                        d="M4 17v3h16v-3"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </a>
                                ) : (
                                  <button
                                    className="ref-download disabled"
                                    type="button"
                                    aria-label="다운로드 링크 없음"
                                    title="다운로드 링크 없음"
                                    disabled
                                  >
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        d="M12 3v10m0 0 4-4m-4 4-4-4"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                      <path
                                        d="M4 17v3h16v-3"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* 하단: 입력창 + 전송/중지 버튼 */}
        <footer className="chat-input-area">
          <div className="input-wrapper">
            <textarea
              rows={1}
              placeholder="메시지를 입력하세요. (Enter: 전송, Shift+Enter: 줄바꿈)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className="send-btn"
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
            >
              {isStreaming ? "받는 중..." : "보내기"}
            </button>
            {isStreaming ? (
              <button className="send-btn" onClick={stopStreaming}>
                중지
              </button>
            ) : null}
          </div>
          <div className="input-hint">
            RAG LLM 챗봇 v.1
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;


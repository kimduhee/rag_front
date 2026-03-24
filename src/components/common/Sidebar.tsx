import React,{ useState, useRef, useEffect } from 'react';
import { fetchData } from'@/api/requestHttp'
import { Message, ReferenceDoc } from '@/types/chat'
import { ChatHistory } from '@/model/history'
import { getChatHistoryList, getMessageHistoryList, deleteChatHistory } from '@/service/historyService' 

const Sidebar = ({
  setMessages
}:{
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}) => {
  // 빈 영역 클릭시 채팅목록의 메뉴 팝업 닫기를 위함
  const menuRef = useRef<HTMLDivElement | null>(null);
  //채팅목록의 메뉴팝업
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  //채팅목록의 메뉴팝업 위치
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [historyList, setHistoryList] = useState<ChatHistory[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  // 최초 기본 실행
  useEffect(() => {
    getChatHistory("");

    //채팅 메뉴 팝업 열린상태에서 빈 영역 클릭시 닫기
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node)
      ) {
        setOpenMenuId(null);
      }
    };
  
    document.addEventListener("mousedown", handleClickOutside);
  
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 채팅에 대한 메시지 조회
  const getMessageList = async (chatId: string) => {
    const params = {
      chatId: chatId
    }
    const messageHistory = await getMessageHistoryList(params);
    setMessages(messageHistory);
  }

  // 채팅 내역 조회
  const getChatHistory = async (searchText: any) => {

    const params = {
      searchText: searchText
    }
    const chatHistory = await getChatHistoryList(params);
    setHistoryList(chatHistory);
  }

  // 채팅 삭제
  const deleteChat = async(chatId: string) => {
    console.log("삭제할 채팅ID: " + chatId);
    const params = {
      chatId: chatId
    }
    const chatHistory = await deleteChatHistory(params);

    if(chatHistory) {
      alert("삭제 성공");
    } else {
      alert("삭제 실패");
    }

  }

  // 채팅 제목 수정
  const updataChattitle = async(chatId: string) => {
    console.log("제목 수정할 채팅ID: " + chatId);
  }

  // 새 채팅
  const initChat = () => {
    setMessages([]);
  }

  return (
      <aside className="sidebar">
      <div className="sidebar-header">
        <button 
          className="new-chat-btn"
          onClick={() => initChat()}
        >+ 새 채팅</button>
      </div>
      <div className="sidebar-list">
        {historyList.map((r, idx) => (
          <div key={r.chatId} className="conversation-wrapper">
            <button 
              className="conversation-item active"
              onClick={() => getMessageList(r.chatId)}
            >
              <div className="conversation-title">{r.title}</div>
              {/*<div className="conversation-meta">{r.date}</div>*/}
            </button>

            {/* ⋮ 버튼 */}
            <button
              className="menu-btn"
              onClick={(e) => {
                e.stopPropagation();
              
                const rect = e.currentTarget.getBoundingClientRect();
              
                setMenuPosition({
                  top: rect.top,
                  left: rect.right + 5
                });
              
                setOpenMenuId(r.chatId);
              }}
            >
              ⋮
            </button>

            {/* 팝업 메뉴 */}
              {openMenuId === r.chatId && (
              <div
                className="menu-popup"
                ref={menuRef}
                style={{
                  top: menuPosition.top,
                  left: menuPosition.left
                }}
              >
                <button className="menu-item" onClick={() => alert("이름 변경")}>
                  <span className="menu-icon">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path
                        fill="currentColor"
                        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 
                          2.33H5v-.92l9.06-9.06.92.92L5.92 
                          19.58zM20.71 7.04a1.003 1.003 0 000-1.42l-2.34-2.34a1.003 
                          1.003 0 00-1.42 0l-1.83 1.83 3.75 
                          3.75 1.84-1.82z"
                      />
                    </svg>
                  </span>
                  <span>제목 수정</span>
                </button>

                <button className="menu-item" onClick={() => deleteChat(r.chatId)}>
                  <span className="menu-icon">
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path
                      fill="currentColor"
                      d="M6 7h12v2H6V7zm2 3h8v10H8V10zm3-6h2v2h-2V4zm-5 
                        2h14l-1 14H5L4 6z"
                    />
                  </svg>
                  </span>
                  <span>삭제</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="sidebar-footer">
        <button 
          className="sidebar-icon-btn"
          onClick={(e) => {
            e.preventDefault();
            alert("준비중");
          }}
        >
          설정
        </button>
        <button 
          className="sidebar-icon-btn"
          onClick={(e)=> {
            e.preventDefault();
            alert("준비중");
          }}
        >
          프로필
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
import React,{ useState, useRef, useEffect } from 'react';
import { fetchData } from'@/api/requestHttp'
import { Message, ReferenceDoc } from '@/types/chat'
import { ChatHistory } from '@/model/history'
import { getChatHistoryList, getMessageHistoryList } from '@/service/historyService' 

const Sidebar = ({
  setMessages
}:{
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}) => {

  const [historyList, setHistoryList] = useState<ChatHistory[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  // 최초 기본 실행
  useEffect(() => {
    getChatHistory("");
  }, []);

  // 채팅에 대한 메시지 조회
  const getMessageList = async (chatId: any) => {
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
        { historyList.map((r, idx) => (
        <button 
          className="conversation-item active"
          onClick={() => getMessageList(r.chatId)}
        >
          <div className="conversation-title">{ r.title }</div>
          <div className="conversation-meta">{ r.date }</div>
        </button>
        )) }
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
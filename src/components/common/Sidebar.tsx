import React from 'react';

function Sidebar() {
    return (
        <aside className="sidebar">
        <div className="sidebar-header">
          <button className="new-chat-btn">+ 새 채팅</button>
        </div>
        <div className="sidebar-list">
            <button className="conversation-item active">
              <div className="conversation-title">삼성전자의 AI 이름은 뭐야????</div>
              <div className="conversation-meta">2002.07.01</div>
            </button>
        </div>
        <div className="sidebar-footer">
          <button className="sidebar-icon-btn">설정</button>
          <button className="sidebar-icon-btn">프로필</button>
        </div>
      </aside>
    );
}

export default Sidebar;
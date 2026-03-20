import React, { ReactNode, useState } from "react";
import { Outlet } from 'react-router-dom';
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'
import Sidebar from "@/components/common/Sidebar";
import {Message} from '@/types/chat'

const MainLayout = () => {

    const [messages, setMessages] = useState<Message[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [chatId, setChatId] = useState("");

    return (
        <div className="app-root">
            <Sidebar
                setMessages={setMessages}
            />
            <main className="chat-layout">
                <Header />
                <Outlet context={{ 
                    messages, 
                    setMessages,
                    isStreaming,
                    setIsStreaming,
                    chatId,
                    setChatId
                }}/>
                <Footer 
                    setMessages={setMessages}
                    isStreaming={isStreaming}
                    setIsStreaming={setIsStreaming}
                    chatId={chatId}
                    setChatId={setChatId}
                />
            </main>
        </div>
    );
}

export default MainLayout;
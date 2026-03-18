import React, { ReactNode } from "react";
import { Outlet } from 'react-router-dom';
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'
import Sidebar from "@/components/common/Sidebar";

function MainLayout() {
    return (
        <div className="app-root">
            <Sidebar/>
            <main className="chat-layout">
                <Header />
                <Outlet />
                <Footer />
            </main>
        </div>
    );
}

export default MainLayout;
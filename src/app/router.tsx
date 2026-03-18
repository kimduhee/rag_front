import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import Home from '@/page/Home';

function Router() {
    return(
        <BrowserRouter>
            <Routes>
                <Route element={<MainLayout />}>
                    <Route path="/chat" element={<Home />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default Router;
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PublicView from './pages/PublicView';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import GameZone from './pages/GameZone';
import { UIProvider } from './context/UIContext';

function App() {
    return (
        <BrowserRouter>
            <UIProvider>
                <Routes>
                    <Route path="/" element={<PublicView />} />
                    <Route path="/admin" element={<AdminLogin />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/game" element={<GameZone />} />
                </Routes>
            </UIProvider>
        </BrowserRouter>
    )
}

export default App

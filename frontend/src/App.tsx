import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { WelcomePage } from './WelcomePage';
import { Register } from './Register';
import { MainPage } from './MainPage';
import AllUser from './AllUser';
import Admin from './Admin';
import Boosters from './Boosters';
import CardStore from './CardStore';
import BoosterStore from './BoosterStore';

export const App = () => {
    return (
        <Router>
            <Routes>
                {/* 默认重定向到 /welcome */}
                <Route path="/" element={<Navigate to="/welcome" />} />

                {/* 欢迎页面 */}
                <Route path="/welcome" element={<WelcomePage />} />

                {/* 注册页面 */}
                <Route path="/register" element={<Register />} />

                {/* 主页面 */}
                <Route path="/main" element={<MainPage />} />

                {/* 各个子页面 */}
                <Route path="/collection" element={<AllUser />} />
                <Route path="/boosters" element={<Boosters />} />
                <Route path="/cardStore" element={<CardStore />} />
                <Route path="/boosterStore" element={<BoosterStore />} />
                <Route path="/admin" element={<Admin />} />
            </Routes>
        </Router>
    );
};

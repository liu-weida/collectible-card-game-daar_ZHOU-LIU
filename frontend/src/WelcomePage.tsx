import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './WelcomePage.module.css'; // 自定义样式
import startPage from './photo/startPage.png'; // 欢迎页面的图片

export const WelcomePage = () => {
    const navigate = useNavigate();

    // 点击图片跳转到注册页面
    const handleImageClick = () => {
        navigate('/register');
    };

    return (
        <div className={styles.container}>
            <img
                src={startPage}
                alt="Welcome"
                className={styles.image}
                onClick={handleImageClick}
                style={{ cursor: 'pointer' }}
            />
        </div>
    );
};

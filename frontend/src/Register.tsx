import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Register.module.css'; // 自定义样式
import startPage from './photo/register.png'; // 注册页面的图片
import pkData from './photo/PK.json'; // 导入 JSON 文件

export const Register = () => {
    const [privateKey, setPrivateKey] = useState<string>('');
    const navigate = useNavigate();

    // 随机选择 JSON 文件中的一个私钥
    const getRandomPrivateKey = () => {
        const keys = pkData.PRIVATE_KEYS;
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        setPrivateKey(randomKey);
    };

    useEffect(() => {
        getRandomPrivateKey(); // 页面加载时随机获取一个私钥
    }, []);

    // 点击图片时，显示私钥并跳转到主页面
    const handleImageClick = () => {
        alert(`Your Private Key: ${privateKey}`);
        navigate('/main'); // 完成注册后进入主页面
    };

    return (
        <div className={styles.container}>
            <img
                src={startPage}
                alt="Register"
                className={styles.image}
                onClick={handleImageClick}
                style={{ cursor: 'pointer' }}
            />
        </div>
    );
};

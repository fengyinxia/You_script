// ==UserScript==
// @name         番茄小说免VIP解锁
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  修改novel_web_id的值以实现
// @author       junzia
// @match        https://fanqienovel.com/*
// @run-at       document-start
// ==/UserScript==

(() => {
    'use strict';

    const targetId = '0141661321110715542';

    const updateCookie = () => {
        const cookies = document.cookie.split(';');
        console.log('当前所有cookie:', cookies);
        
        const found = cookies.find(c => c.trim().startsWith('novel_web_id='));
        const currentValue = found ? found.split('=')[1] : null;
        console.log('找到的novel_web_id:', currentValue);
        
        if(currentValue !== targetId) {
            document.cookie = `novel_web_id=${targetId};path=/;secure=true`;
            console.log('已更新cookie为:', targetId);
        }
    };

    updateCookie();
    setInterval(updateCookie, 3000);

})();

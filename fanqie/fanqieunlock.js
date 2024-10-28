// ==UserScript==
// @name         番茄小说免VIP解锁
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  修改novel_web_id的值以实现
// @author       junzia
// @match        https://fanqienovel.com/*
// @grant        GM_cookie
// @run-at       document-start
// ==/UserScript==

(() => {
    'use strict';

    const targetId = '0141661321110715542';

    const updateCookie = async () => {
        const cookies = await new Promise(r => GM_cookie.list({}, r));
        const found = cookies.find(c => c.name === 'novel_web_id');
        if(found?.value !== targetId) {
            await new Promise(r => GM_cookie.delete({name: 'novel_web_id'}, r));
            GM_cookie.set({
                name: 'novel_web_id',
                value: targetId,
                path: '/',
                secure: true
            });
        }
    };
    updateCookie();
    setInterval(updateCookie, 3000);


})();

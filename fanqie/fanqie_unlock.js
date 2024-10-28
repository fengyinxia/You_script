// ==UserScript==
// @name         解锁番茄小说
// @match        https://fanqienovel.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = function(key) {
        if (key.startsWith('__tea_cache_tokens_')) {
            const fakeCache = {
                web_id: "0141661321110715542",
                user_unique_id: "verify_m2rm439h_E7cCpt2V_Ugxm_4xzP_88Pq_MfG5v2FmNs9h",
                timestamp: Date.now()
            };
            return JSON.stringify(fakeCache);
        }
        return originalGetItem.apply(this, arguments);
    };
})();

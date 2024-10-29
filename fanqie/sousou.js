// ==UserScript==
// @name         番茄小说搜索工具
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  选中文本后搜索番茄小说并显示详情
// @author       You
// @match        https://*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    // 创建弹出窗口元素
    const popup = document.createElement('div');
    popup.style.cssText = `
        position: fixed;
        background: white;
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        display: none;
        z-index: 10000;
        max-width: 800px;
        max-height: 80vh;
        overflow-y: auto;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
    `;
    document.body.appendChild(popup);

    // 搜索并显示书籍信息
    function searchBook(keyword) {
        const url = `https://api5-normal-lf.fqnovel.com/reading/bookapi/search/page/v/?query=${keyword}&aid=1967&channel=0&os_version=0&device_type=0&device_platform=0&iid=466614321180296&version_code=999`;
        
        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            onload: function(response) {
                try {
                    const json = JSON.parse(response.responseText);
    
                    if (json) {
                        const book = json.data[0].book_data[0];
                        popup.innerHTML = `
                            <div class="book-container">
                                <div class="book-header" style="display: flex; justify-content: center; align-items: center; margin-bottom: 15px;">
                                    <a href='https://fanqienovel.com/page/${book.book_id}' target="_blank" style="text-decoration: none; font-size: 24px; font-weight: bold; color: #333;">${book.book_name}</a>
                                </div>
                                
                                <div style="display: flex; gap: 20px; position: relative;">
                                    <img style="width: 300px; height: 400px; object-fit: cover; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" src="${book.expand_thumb_url}">
                                    <span style="position: absolute; top: 10px; right: 10px; background: rgba(255, 152, 0, 0.8); color: white; font-size: 20px; font-weight: bold; padding: 5px 10px; border-radius: 4px;">${book.score}分</span>
                                    
                                    <div class="book-info" style="flex: 1;">
                                        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
                                            <p style="margin: 8px 0; font-size: 16px;">作者：<span style="color: #666;">${book.author}</span></p>
                                            <p style="margin: 8px 0; font-size: 16px;">在读：<span style="color: #666;">${(book.read_count/10000).toFixed(1)}万</span></p>
                                            <p style="margin: 8px 0; font-size: 16px;">字数：<span style="color: #666;">${(book.word_number/10000).toFixed(1)}万</span></p>
                                            <p style="margin: 8px 0; font-size: 16px;">标签：<span style="color: #666;">${book.tags}</span></p>
                                            <p style="margin: 8px 0; font-size: 16px;">原书名：<span style="color: #666;">${book.original_book_name || '无'}</span></p>
                                        </div>
                                        
                                        <div style="margin-top: 20px; padding: 15px; border-top: 2px solid #eee; font-size: 16px; line-height: 1.6; color: #444;">
                                            ${book.abstract}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                        popup.style.display = 'block';
                    } else {
                        popup.innerHTML = '<div style="padding:20px">未找到相关书籍</div>';
                        popup.style.display = 'block';
                    }
                } catch (error) {
                    console.error('解析响应出错:', error);
                    popup.innerHTML = '<div style="padding:20px">搜索出错，请稍后重试</div>';
                    popup.style.display = 'block';
                }
            },
            onerror: function(error) {
                console.error('请求出错:', error);
                popup.innerHTML = '<div style="padding:20px">搜索出错，请稍后重试</div>';
                popup.style.display = 'block';
            }
        });
    }

    // 监听选择事件
    document.addEventListener('mouseup', function(e) {
        const selectedText = window.getSelection().toString().trim();
        
        if (selectedText) {
            searchBook(selectedText);
        }
    });

    // 点击页面其他地方时隐藏弹窗
    document.addEventListener('mousedown', function(e) {
        if (!popup.contains(e.target)) {
            popup.style.display = 'none';
        }
    });
})();

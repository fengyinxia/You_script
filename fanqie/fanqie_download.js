// ==UserScript==
// @name         番茄小说下载
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  在番茄小说详情页创建一个圆形下载按钮，点击即可开始下载
// @author       junzia
// @match        https://fanqienovel.com/page/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 下载函数
    async function downloadContent() {
        // 获取小说基本信息
        const novelInfo = getNovelInfo();
        const novelHeader = `书名：${novelInfo.title}\n作者：${novelInfo.author}\n标签：${novelInfo.tags}\n字数：${novelInfo.wordCount}\n\n简介：\n${novelInfo.abstract}\n\n`;

        // 获取页面信息数组
        const pageInfoArray = crawlPageInfo();

        let allContent = novelHeader; // 存储所有内容,以小说信息开头
        const totalPages = pageInfoArray.length;

        // 更新按钮显示下载开始
        downloadButton.innerHTML = '0%';

        // 将页面信息数组分成多个批次
        const batchSize = 20; // 每批处理5个页面
        const batches = [];
        for(let i = 0; i < pageInfoArray.length; i += batchSize) {
            batches.push(pageInfoArray.slice(i, i + batchSize));
        }

        let completedPages = 0;
        const contentArray = new Array(totalPages); // 用于按顺序存储内容

        // 并发处理每个批次
        for(let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            const batchPromises = batch.map((pageInfo, index) => {
                return processLinks([pageInfo]).then(content => {
                    const globalIndex = i * batchSize + index;
                    contentArray[globalIndex] = content;

                    // 更新进度
                    completedPages++;
                    const progress = Math.round((completedPages / totalPages) * 100);
                    downloadButton.innerHTML = progress + '%';
                });
            });

            // 等待当前批次完成
            await Promise.all(batchPromises);
        }

        // 按顺序合并所有内容
        allContent += contentArray.filter(content => content).join('\n\n');

        // 创建Blob对象
        const blob = new Blob([allContent], { type: 'text/plain;charset=utf-8' });

        // 创建下载链接
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${novelInfo.title}.txt`;

        // 触发下载
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 释放URL对象
        URL.revokeObjectURL(downloadUrl);

        // 下载完成后恢复按钮文字
        setTimeout(() => {
            downloadButton.innerHTML = '下载';
        }, 1000);
    }

    // 获取小说信息的函数
    function getNovelInfo() {
        // 获取小说标题
        const novelTitle = document.querySelector('.info-name')?.innerText || '未知小说';

        // 获取作者信息
        const authorName = document.querySelector('.author-name-text')?.innerText || '未知作者';

        // 获取标签信息
        const tags = Array.from(document.querySelectorAll('.info-label span'))
            .map(span => span.innerText)
            .join('，') || '暂无标签';

        // 获取字数信息
        const wordCount = (document.querySelector('.info-count-word')?.innerText || '未知字数').replace(/\s+/g, '');

        // 获取简介信息
        const abstract = document.querySelector('.page-abstract-content')?.innerText || '暂无简介';

        // 返回小说信息对象
        return {
            title: novelTitle,
            author: authorName,
            tags: tags,
            wordCount: wordCount,
            abstract: abstract
        };
    }
    // 爬取页面信息的函数
    function crawlPageInfo() {
        // 创建数组存储页面信息
        let pageInfoArray = [];

        // 获取所有章节元素
        const chapterElements = document.querySelectorAll('.chapter .chapter-item a');

        // 遍历每个章节元素
        chapterElements.forEach(element => {
            const title = element.innerText || '未知标题';
            const link = 'https://fanqienovel.com' + (element.getAttribute('href') || '');

            // 将信息添加到数组
            pageInfoArray.push({
                title,
                link
            });
        });

        // 返回信息数组
        return pageInfoArray;
    }
    // 处理爬取到的链接
    async function processLinks(pageInfoArray) {
        // 检查数组是否为空
        if (!pageInfoArray || pageInfoArray.length === 0) {
            console.log('没有找到可用的链接');
            return;
        }

        // 遍历处理每个链接
        for (const info of pageInfoArray) {
            // 验证链接有效性
            if (!info.link || !info.link.startsWith('https://fanqienovel.com')) {
                console.log(`无效的链接: ${info.title}`);
                continue;
            }

            console.log(`正在处理: ${info.title}`);
            console.log(`链接地址: ${info.link}`);

            try {
                // 发送请求获取页面内容
                const response = await fetch(info.link, {
                    headers: {
                        'Cookie': 'novel_web_id=6338474163312381345',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const pageContent = await response.text();
                console.log(`成功获取页面内容: ${info.title}`);

                // 创建一个临时的 DOM 解析器
                const parser = new DOMParser();
                const doc = parser.parseFromString(pageContent, 'text/html');

                // 获取.muye-reader-content下所有p标签的内容
                const paragraphs = doc.querySelectorAll('.muye-reader-content p');
                if (paragraphs.length > 0) {
                    console.log(`成功提取内容: ${info.title}`);
                    let decryptedContent = info.title + '\n\n'; // 添加标题

                    // 遍历每个段落并解密
                    paragraphs.forEach(p => {
                        const content = p.innerText || '';
                        if (content) {
                            decryptedContent += '  ' + decryptContent(content) + '\n'; // 每个段落前添加两个空格
                        }
                    });

                    console.log(`成功解密内容: ${info.title}`);
                    return decryptedContent;
                } else {
                    console.log(`未找到内容: ${info.title}`);
                }

            } catch (error) {
                console.error(`获取页面失败: ${info.title}`, error);
            }
        }
    }

// 定义解密所需的常量和字符集
const CODE_START = 58344;
const CODE_END = 58715;
const CHARSET = ['D', '在', '主', '特', '家', '军', '然', '表', '场', '4', '要', '只', 'v', '和', '?', '6', '别', '还', 'g',
'现', '儿', '岁', '?', '?', '此', '象', '月', '3', '出', '战', '工', '相', 'o', '男', '直', '失', '世', 'F',
'都', '平', '文', '什', 'V', 'O', '将', '真', 'T', '那', '当', '?', '会', '立', '些', 'u', '是', '十', '张',
'学', '气', '大', '爱', '两', '命', '全', '后', '东', '性', '通', '被', '1', '它', '乐', '接', '而', '感',
'车', '山', '公', '了', '常', '以', '何', '可', '话', '先', 'p', 'i', '叫', '轻', 'M', '士', 'w', '着', '变',
'尔', '快', 'l', '个', '说', '少', '色', '里', '安', '花', '远', '7', '难', '师', '放', 't', '报', '认',
'面', '道', 'S', '?', '克', '地', '度', 'I', '好', '机', 'U', '民', '写', '把', '万', '同', '水', '新', '没',
'书', '电', '吃', '像', '斯', '5', '为', 'y', '白', '几', '日', '教', '看', '但', '第', '加', '候', '作',
'上', '拉', '住', '有', '法', 'r', '事', '应', '位', '利', '你', '声', '身', '国', '问', '马', '女', '他',
'Y', '比', '父', 'x', 'A', 'H', 'N', 's', 'X', '边', '美', '对', '所', '金', '活', '回', '意', '到', 'z',
'从', 'j', '知', '又', '内', '因', '点', 'Q', '三', '定', '8', 'R', 'b', '正', '或', '夫', '向', '德', '听',
'更', '?', '得', '告', '并', '本', 'q', '过', '记', 'L', '让', '打', 'f', '人', '就', '者', '去', '原', '满',
'体', '做', '经', 'K', '走', '如', '孩', 'c', 'G', '给', '使', '物', '?', '最', '笑', '部', '?', '员', '等',
'受', 'k', '行', '一', '条', '果', '动', '光', '门', '头', '见', '往', '自', '解', '成', '处', '天', '能',
'于', '名', '其', '发', '总', '母', '的', '死', '手', '入', '路', '进', '心', '来', 'h', '时', '力', '多',
'开', '已', '许', 'd', '至', '由', '很', '界', 'n', '小', '与', 'Z', '想', '代', '么', '分', '生', '口',
'再', '妈', '望', '次', '西', '风', '种', '带', 'J', '?', '实', '情', '才', '这', '?', 'E', '我', '神', '格',
'长', '觉', '间', '年', '眼', '无', '不', '亲', '关', '结', '0', '友', '信', '下', '却', '重', '己', '老',
'2', '音', '字', 'm', '呢', '明', '之', '前', '高', 'P', 'B', '目', '太', 'e', '9', '起', '稜', '她', '也',
'W', '用', '方', '子', '英', '每', '理', '便', '四', '数', '期', '中', 'C', '外', '样', 'a', '海', '们',
'任'];

// 解密单个字符的函数
function decryptChar(charCode) {
    const bias = charCode - CODE_START;
    if (bias < 0 || bias >= CHARSET.length || CHARSET[bias] === '?') {
        return String.fromCharCode(charCode);
    }
    return CHARSET[bias];
}

// 解密整个文本内容的函数
function decryptContent(content) {
    let decryptedText = '';
    try {
        // 遍历每个段落
        for (const paragraph of content) {
            // 遍历段落中的每个字符
            for (let i = 0; i < paragraph.length; i++) {
                const charCode = paragraph.charCodeAt(i);
                // 判断字符是否需要解密
                if (charCode >= CODE_START && charCode <= CODE_END) {
                    decryptedText += decryptChar(charCode);
                } else {
                    decryptedText += paragraph.charAt(i);
                }
            }
        }
    } catch (error) {
        console.error('解密过程出错:', error);
    }
    return decryptedText;
}



    // 创建圆形下载按钮
    const downloadButton = document.createElement('button');
    downloadButton.innerHTML = '下载';

    // 设置按钮样式
    downloadButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: #4CAF50;
        color: white;
        border: none;
        cursor: pointer;
        font-size: 14px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        z-index: 9999;
    `;

    // 添加悬停效果
    downloadButton.onmouseover = function() {
        this.style.backgroundColor = '#45a049';
    };
    downloadButton.onmouseout = function() {
        this.style.backgroundColor = '#4CAF50';
    };

    // 添加点击事件
    downloadButton.onclick = downloadContent;

    // 在页面加载前添加按钮
    document.documentElement.appendChild(downloadButton);
})();

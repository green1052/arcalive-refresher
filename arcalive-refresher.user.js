// ==UserScript==
// @name arcalive-refresher
// @version 1.0.0
// @author green1052
// @description 아카라이브 자동 새로고침
// @match http*://arca.live/b/*
// @namespace arcalive-refresher
// @rut-at document-end
// @noframes
// @grant GM_xmlhttpRequest
// @license GPLv3
// @homepageURL	https://github.com/green1052/arcalive-refresher
// @downloadURL https://raw.githubusercontent.com/green1052/arcalive-refresher/main/arcalive-refresher.user.js
// ==/UserScript==

(() => {
    "use strict";

    function request(onload) {
        GM_xmlhttpRequest({
            url: location.href,
            responseType: "document",
            timeout: 10000,
            onload
        });
    }

    function getDateStr(datetime, format) {
        const date = new Date(datetime);

        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        const hh = date.getHours().toString().padStart(2, "0");
        const mm = date.getMinutes().toString().padStart(2, "0");
        const ss = date.getSeconds().toString().padStart(2, "0");

        return format
            .replace("year", year)
            .replace("month", month)
            .replace("day", day)
            .replace("hh", hh)
            .replace("mm", mm)
            .replace("ss", ss);
    }

    function in24Hours(datetime) {
        const target = new Date(datetime);
        const criteria = new Date();
        criteria.setHours(criteria.getHours() - 24);

        return target > criteria;
    }

    const interval = 5000;

    if (/\/b\/.*\/.*/gi.test(location.pathname)) {
        const comment = document.querySelector("#comment .list-area");

        if (comment) {
            setInterval(() => {
                if (document.hidden || !document.hasFocus()) return;

                if (document.querySelectorAll(".reply-form-textarea").length >= 2) return

                request((response) => {
                    const doc = new DOMParser().parseFromString(response.responseText, "text/html");
                    comment.innerHTML = doc.querySelector("#comment .list-area").innerHTML;
                });
            }, interval);
        }
    }

    const articleList = document.querySelector(".list-table");

    if (articleList === null) return;

    if (articleList.querySelector(".arca-overlay-notice")?.innerHTML.includes("이 콘텐츠는 해당 국가에서 이용할 수 없습니다.")) return;

    setInterval(() => {
        if (document.hidden || !document.hasFocus()) return;

        request((response) => {
            const doc = new DOMParser().parseFromString(response.responseText, "text/html");

            const oldArticles = new Map();

            for (const element of articleList.querySelectorAll("a.vrow:not(.notice-unfilter)")) {
                oldArticles.set(element.getAttribute("href"), element);
            }

            for (const element of doc.querySelectorAll("a.vrow:not(.notice-unfilter)")) {
                const oldArticle = oldArticles.get(element.getAttribute("href"));

                let time = null;

                if (oldArticle === undefined) {
                    articleList.removeChild(articleList.lastChild);
                    const target = articleList.insertBefore(element, articleList.querySelector("a.vrow:not(.notice)"));

                    const lazyWrapper = target.querySelector("noscript");
                    lazyWrapper?.replaceWith(lazyWrapper.firstElementChild);

                    time = target.querySelector("time")
                } else {
                    const inner = oldArticle.querySelector(".vrow-inner");
                    inner.innerHTML = element.querySelector(".vrow-inner").innerHTML;
                    time = inner.querySelector("time");
                }

                time.textContent &&= getDateStr(
                    time.dateTime,
                    in24Hours(time.dateTime) ? "hh:mm" : "year.month.day",
                );
            }
        });
    }, interval);
})();
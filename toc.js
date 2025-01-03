// Populate the sidebar
//
// This is a script, and not included directly in the page, to control the total size of the book.
// The TOC contains an entry for each page, so if each page includes a copy of the TOC,
// the total size of the page becomes O(n**2).
class MDBookSidebarScrollbox extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.innerHTML = '<ol class="chapter"><li class="chapter-item expanded "><a href="ch01-00.html"><strong aria-hidden="true">1.</strong> 从零开始运行 Starry</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="ch01-01.html"><strong aria-hidden="true">1.1.</strong> 实验环境配置</a></li><li class="chapter-item expanded "><a href="ch01-02.html"><strong aria-hidden="true">1.2.</strong> 运行 Starry 的测例</a></li><li class="chapter-item expanded "><a href="ch01-03.html"><strong aria-hidden="true">1.3.</strong> 为 Starry 添加新测例</a></li></ol></li><li class="chapter-item expanded "><a href="ch02-00.html"><strong aria-hidden="true">2.</strong> Starry 概述</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="ch02-01.html"><strong aria-hidden="true">2.1.</strong> 背景说明</a></li><li class="chapter-item expanded "><a href="ch02-02.html"><strong aria-hidden="true">2.2.</strong> 内核结构设计</a></li><li class="chapter-item expanded "><a href="ch02-03.html"><strong aria-hidden="true">2.3.</strong> 实现功能</a></li></ol></li><li class="chapter-item expanded "><a href="ch03-00.html"><strong aria-hidden="true">3.</strong> 在组件化系统上开发新内容</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="ch03-01.html"><strong aria-hidden="true">3.1.</strong> 添加一个新的 syscall</a></li><li class="chapter-item expanded "><a href="ch03-02.html"><strong aria-hidden="true">3.2.</strong> 适配新应用</a></li></ol></li><li class="chapter-item expanded "><a href="appendix-00.html"><strong aria-hidden="true">4.</strong> 附录: 接口文档</a></li></ol>';
        // Set the current, active page, and reveal it if it's hidden
        let current_page = document.location.href.toString();
        if (current_page.endsWith("/")) {
            current_page += "index.html";
        }
        var links = Array.prototype.slice.call(this.querySelectorAll("a"));
        var l = links.length;
        for (var i = 0; i < l; ++i) {
            var link = links[i];
            var href = link.getAttribute("href");
            if (href && !href.startsWith("#") && !/^(?:[a-z+]+:)?\/\//.test(href)) {
                link.href = path_to_root + href;
            }
            // The "index" page is supposed to alias the first chapter in the book.
            if (link.href === current_page || (i === 0 && path_to_root === "" && current_page.endsWith("/index.html"))) {
                link.classList.add("active");
                var parent = link.parentElement;
                if (parent && parent.classList.contains("chapter-item")) {
                    parent.classList.add("expanded");
                }
                while (parent) {
                    if (parent.tagName === "LI" && parent.previousElementSibling) {
                        if (parent.previousElementSibling.classList.contains("chapter-item")) {
                            parent.previousElementSibling.classList.add("expanded");
                        }
                    }
                    parent = parent.parentElement;
                }
            }
        }
        // Track and set sidebar scroll position
        this.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                sessionStorage.setItem('sidebar-scroll', this.scrollTop);
            }
        }, { passive: true });
        var sidebarScrollTop = sessionStorage.getItem('sidebar-scroll');
        sessionStorage.removeItem('sidebar-scroll');
        if (sidebarScrollTop) {
            // preserve sidebar scroll position when navigating via links within sidebar
            this.scrollTop = sidebarScrollTop;
        } else {
            // scroll sidebar to current active section when navigating via "next/previous chapter" buttons
            var activeSection = document.querySelector('#sidebar .active');
            if (activeSection) {
                activeSection.scrollIntoView({ block: 'center' });
            }
        }
        // Toggle buttons
        var sidebarAnchorToggles = document.querySelectorAll('#sidebar a.toggle');
        function toggleSection(ev) {
            ev.currentTarget.parentElement.classList.toggle('expanded');
        }
        Array.from(sidebarAnchorToggles).forEach(function (el) {
            el.addEventListener('click', toggleSection);
        });
    }
}
window.customElements.define("mdbook-sidebar-scrollbox", MDBookSidebarScrollbox);

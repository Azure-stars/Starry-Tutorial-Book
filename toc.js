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
        this.innerHTML = '<ol class="chapter"><li class="chapter-item expanded "><a href="ch01-00.html"><strong aria-hidden="true">1.</strong> 关于 Starry</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="ch01-01.html"><strong aria-hidden="true">1.1.</strong> 概述</a></li><li class="chapter-item expanded "><a href="ch01-02.html"><strong aria-hidden="true">1.2.</strong> 支持情况</a></li><li class="chapter-item expanded "><a href="ch01-03.html"><strong aria-hidden="true">1.3.</strong> 应用场景</a></li></ol></li><li class="chapter-item expanded "><a href="ch02-00.html"><strong aria-hidden="true">2.</strong> 快速上手 Starry</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="ch02-01.html"><strong aria-hidden="true">2.1.</strong> 环境配置</a></li><li class="chapter-item expanded "><a href="ch02-02.html"><strong aria-hidden="true">2.2.</strong> Qemu 快速上手</a></li><li class="chapter-item expanded "><a href="ch02-03.html"><strong aria-hidden="true">2.3.</strong> 飞腾派启动</a></li><li class="chapter-item expanded "><a href="ch02-04.html"><strong aria-hidden="true">2.4.</strong> 泉城x86工控机启动</a></li><li class="chapter-item expanded "><a href="ch02-05.html"><strong aria-hidden="true">2.5.</strong> 星光派二代 SiFive 启动</a></li></ol></li><li class="chapter-item expanded "><a href="ch03-00.html"><strong aria-hidden="true">3.</strong> Starry 使用手册</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="ch03-01.html"><strong aria-hidden="true">3.1.</strong> 运行基本测例</a></li><li class="chapter-item expanded "><a href="ch03-02.html"><strong aria-hidden="true">3.2.</strong> 运行OS比赛测例</a></li><li class="chapter-item expanded "><a href="ch03-03.html"><strong aria-hidden="true">3.3.</strong> 选择启用不同设备和功能</a></li><li class="chapter-item expanded "><a href="ch03-04.html"><strong aria-hidden="true">3.4.</strong> 运行更多复杂应用</a></li></ol></li><li class="chapter-item expanded "><a href="ch04-00.html"><strong aria-hidden="true">4.</strong> Starry 原理介绍</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="ch04-01.html"><strong aria-hidden="true">4.1.</strong> 架构设计</a></li><li class="chapter-item expanded "><a href="ch04-02.html"><strong aria-hidden="true">4.2.</strong> 启动与初始化</a></li><li class="chapter-item expanded "><a href="ch04-03.html"><strong aria-hidden="true">4.3.</strong> 任务调度</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="ch04-03-01.html"><strong aria-hidden="true">4.3.1.</strong> 任务调度接口</a></li><li class="chapter-item expanded "><a href="ch04-03-02.html"><strong aria-hidden="true">4.3.2.</strong> 多核调度的实现</a></li></ol></li><li class="chapter-item expanded "><a href="ch04-04.html"><strong aria-hidden="true">4.4.</strong> 驱动兼容层</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="ch04-04-01.html"><strong aria-hidden="true">4.4.1.</strong> blk 设备</a></li><li class="chapter-item expanded "><a href="ch04-04-02.html"><strong aria-hidden="true">4.4.2.</strong> net 设备</a></li><li class="chapter-item expanded "><a href="ch04-04-03.html"><strong aria-hidden="true">4.4.3.</strong> display 设备</a></li><li class="chapter-item expanded "><a href="ch04-04-04.html"><strong aria-hidden="true">4.4.4.</strong> 动态选择驱动</a></li></ol></li><li class="chapter-item expanded "><a href="ch04-05.html"><strong aria-hidden="true">4.5.</strong> 文件系统</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="ch04-05-01.html"><strong aria-hidden="true">4.5.1.</strong> 文件系统接口</a></li><li class="chapter-item expanded "><a href="ch04-05-02.html"><strong aria-hidden="true">4.5.2.</strong> 适配不同文件系统</a></li></ol></li><li class="chapter-item expanded "><a href="ch04-06.html"><strong aria-hidden="true">4.6.</strong> 网络协议栈</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="ch04-06-01.html"><strong aria-hidden="true">4.6.1.</strong> 网络协议栈接口</a></li><li class="chapter-item expanded "><a href="ch04-06-02.html"><strong aria-hidden="true">4.6.2.</strong> 适配不同网络协议栈</a></li></ol></li><li class="chapter-item expanded "><a href="ch04-07.html"><strong aria-hidden="true">4.7.</strong> 宏内核扩展与系统调用</a></li></ol></li><li class="chapter-item expanded "><a href="ch05-00.html"><strong aria-hidden="true">5.</strong> Starry 开发规划</a></li><li class="chapter-item expanded "><a href="appendix-01.html"><strong aria-hidden="true">6.</strong> 附录：利用 qemu-user 运行和调试程序</a></li></ol>';
        // Set the current, active page, and reveal it if it's hidden
        let current_page = document.location.href.toString().split("#")[0];
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

/**
 * 星枢 NovaOps — 中后台统一布局壳
 * 优先增强页面内已写好的静态 `.shell[data-admin-shell]`（导航跳转后仍可见）；
 * 若仅有内容占位节点，则回退为脚本注入壳层。
 */
(function () {
  /** @type {{id:string,href:string,label:string,group:string,icon:string}[]} */
  const NAV_ITEMS = [
    {
      id: "dashboard",
      href: "dashboard.html",
      label: "仪表盘",
      group: "总览",
      icon: '<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-5v-5H10v5H5a1 1 0 0 1-1-1v-8Z"/>'
    },
    {
      id: "users",
      href: "users.html",
      label: "用户管理",
      group: "组织",
      icon: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="3"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>'
    },
    {
      id: "settings",
      href: "settings.html",
      label: "个人设置",
      group: "组织",
      icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>'
    }
  ];

  /**
   * @param {string} message
   * @param {"ok"|"error"} [kind]
   */
  function showToast(message, kind) {
    let el = document.getElementById("toast");
    if (!el) {
      const canvas = document.querySelector(".canvas") || document.body;
      el = document.createElement("div");
      el.id = "toast";
      el.className = "toast";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      canvas.prepend(el);
    }
    el.textContent = message;
    el.classList.toggle("is-error", kind === "error");
    el.classList.add("is-show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.remove("is-show"), 2200);
  }

  /**
   * @param {string} activeId
   * @returns {string}
   */
  function renderNav(activeId) {
    let lastGroup = "";
    return NAV_ITEMS.map((item) => {
      let html = "";
      if (item.group !== lastGroup) {
        html += `<div class="nav-label">${item.group}</div>`;
        lastGroup = item.group;
      }
      const active = item.id === activeId ? " is-active" : "";
      html += `<a class="nav-item${active}" href="${item.href}" data-nav="${item.id}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">${item.icon}</svg>
        ${item.label}
      </a>`;
      return html;
    }).join("");
  }

  const THEME_KEY = "novaops-theme";

  /** 浅色 / 深色主题对应的单一 SVG 路径（仅渲染其中一个） */
  const THEME_ICON = {
    light:
      '<circle cx="12" cy="12" r="4"/>' +
      '<path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    dark: '<path d="M21 14.5A8.5 8.5 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5Z"/>'
  };

  /** @returns {"light"|"dark"} */
  function getStoredTheme() {
    const v = localStorage.getItem(THEME_KEY);
    return v === "dark" ? "dark" : "light";
  }

  /**
   * 更新主题切换按钮内的单一图标
   * @param {HTMLElement} btn
   * @param {"light"|"dark"} theme
   */
  function syncThemeToggleIcon(btn, theme) {
    const isDark = theme === "dark";
    btn.setAttribute("aria-label", isDark ? "当前深色主题，点击切换为浅色" : "当前浅色主题，点击切换为深色");
    btn.setAttribute("aria-pressed", isDark ? "true" : "false");
    btn.setAttribute("title", isDark ? "深色主题" : "浅色主题");
    btn.dataset.themeState = theme;
    const svg = btn.querySelector("[data-theme-icon]");
    if (svg) svg.innerHTML = THEME_ICON[theme];
  }

  /**
   * @param {"light"|"dark"} theme
   */
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      if (btn instanceof HTMLElement) syncThemeToggleIcon(btn, theme);
    });
  }

  /**
   * @param {HTMLElement} shell
   */
  function bindTopbarChrome(shell) {
    if (shell.dataset.chromeBound === "1") return;
    shell.dataset.chromeBound = "1";

    const themeBtn = shell.querySelector("[data-theme-toggle]");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        const next = getStoredTheme() === "dark" ? "light" : "dark";
        applyTheme(next);
        showToast(next === "dark" ? "已切换为深色主题" : "已切换为浅色主题");
      });
    }

    const notifyBtn = shell.querySelector("#notify-btn");
    if (notifyBtn) {
      notifyBtn.addEventListener("click", () => {
        showToast("有 3 条未读通知：2 条审批 · 1 条安全告警");
      });
    }

    const dropdown = shell.querySelector("[data-user-menu]");
    const trigger = shell.querySelector("[data-user-menu-trigger]");
    const menu = shell.querySelector("[data-user-menu-panel]");
    if (!dropdown || !trigger || !menu) return;

    /**
     * @param {boolean} open
     */
    function setMenuOpen(open) {
      dropdown.classList.toggle("is-open", open);
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
      menu.hidden = !open;
    }

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      setMenuOpen(!dropdown.classList.contains("is-open"));
    });

    menu.addEventListener("click", (e) => e.stopPropagation());

    document.addEventListener("click", () => setMenuOpen(false));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    });
  }

  /**
   * 同步侧栏高亮与顶栏标题（静态壳层）
   * @param {HTMLElement} shell
   */
  function syncShellMeta(shell) {
    const page = shell.getAttribute("data-page") || "dashboard";
    const title = shell.getAttribute("data-title") || "控制台";
    shell.querySelectorAll(".nav-item").forEach((link) => {
      const id = link.getAttribute("data-nav");
      link.classList.toggle("is-active", id === page);
    });
    const crumb = shell.querySelector(".breadcrumb-current");
    if (crumb) crumb.textContent = title;
    const heading = shell.querySelector(".topbar-title");
    if (heading) heading.textContent = title;
  }

  /**
   * 增强已存在的静态壳层（不替换 DOM）
   * @param {HTMLElement} shell
   */
  function hydrateShell(shell) {
    syncShellMeta(shell);
    applyTheme(getStoredTheme());
    bindTopbarChrome(shell);
  }

  /**
   * 顶栏右侧操作区 HTML（主题 / 通知 / 用户菜单）
   * @returns {string}
   */
  function renderTopbarActions() {
    return `
      <div class="topbar-actions">
        <button type="button" class="icon-btn theme-toggle-btn" data-theme-toggle data-theme-state="light"
          aria-pressed="false" aria-label="当前浅色主题，点击切换为深色" title="浅色主题">
          <svg data-theme-icon viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"></svg>
        </button>
        <button type="button" class="icon-btn" id="notify-btn" aria-label="通知">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
            <path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9"/>
            <path d="M10 20a2 2 0 0 0 4 0"/>
          </svg>
        </button>
        <div class="dropdown" data-user-menu>
          <button type="button" class="user-menu-trigger" data-user-menu-trigger
            aria-label="用户菜单" aria-haspopup="menu" aria-expanded="false" aria-controls="user-menu-panel">
            <div class="avatar" aria-hidden="true">陈</div>
          </button>
          <div class="dropdown-menu" id="user-menu-panel" data-user-menu-panel role="menu" hidden>
            <div class="dropdown-head">
              <div class="name">陈思远</div>
              <div class="email">chen@xinghai.cn</div>
            </div>
            <a class="dropdown-item" role="menuitem" href="settings.html">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>
              </svg>
              个人设置
            </a>
            <div class="dropdown-sep" role="separator"></div>
            <a class="dropdown-item is-danger" role="menuitem" href="auth.html">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <path d="M16 17l5-5-5-5"/>
                <path d="M21 12H9"/>
              </svg>
              退出登录
            </a>
          </div>
        </div>
      </div>`;
  }

  /**
   * 将纯内容占位节点升级为完整壳层（回退路径）
   * @param {HTMLElement} mount
   */
  function mountShell(mount) {
    if (mount.classList.contains("shell") || mount.querySelector(":scope > .sidebar")) {
      hydrateShell(mount);
      return;
    }

    const page = mount.getAttribute("data-page") || "dashboard";
    const title = mount.getAttribute("data-title") || "控制台";
    const contentId = mount.getAttribute("data-content-id") || page + "-content";
    const children = Array.from(mount.childNodes);

    const shell = document.createElement("div");
    shell.className = "shell";
    shell.setAttribute("data-admin-shell", "");
    shell.setAttribute("data-page", page);
    shell.setAttribute("data-title", title);
    shell.setAttribute("data-content-id", contentId);
    shell.innerHTML = `
      <aside class="sidebar" data-od-id="sidebar">
        <a class="brand" href="index.html" title="返回入口">
          <div class="brand-mark" aria-hidden="true">N</div>
          <div>
            <div class="brand-name">星枢 NovaOps</div>
            <div class="brand-sub">星海科技 · 生产环境</div>
          </div>
        </a>
        <nav class="nav" aria-label="主导航">
          ${renderNav(page)}
        </nav>
      </aside>
      <div class="main">
        <header class="topbar" data-od-id="topbar">
          <div class="topbar-left">
            <nav class="breadcrumb" aria-label="面包屑">
              <a href="index.html">首页</a>
              <span class="breadcrumb-sep" aria-hidden="true">/</span>
              <span class="breadcrumb-current">${title}</span>
            </nav>
            <div class="topbar-title">${title}</div>
          </div>
          ${renderTopbarActions()}
        </header>
        <main class="content" id="content" data-od-id="${contentId}"></main>
      </div>
    `;

    const content = shell.querySelector("#content");
    children.forEach((node) => content.appendChild(node));
    mount.replaceWith(shell);
    hydrateShell(shell);
  }

  function init() {
    applyTheme(getStoredTheme());
    document.querySelectorAll("[data-admin-shell]").forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      if (el.classList.contains("shell") || el.querySelector(":scope > .sidebar")) {
        hydrateShell(el);
      } else {
        mountShell(el);
      }
    });
  }

  window.NovaOps = Object.assign(window.NovaOps || {}, {
    showToast,
    mountShell,
    hydrateShell,
    applyTheme,
    getStoredTheme,
    NAV_ITEMS
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

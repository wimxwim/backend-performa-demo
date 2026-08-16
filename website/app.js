// website/app.js — branch switcher + tabs + back + copy + health + mermaid (Tier N, 150-200 baris)
(function () {
  const BRANCHES = [
    { id: "01-console-log", label: "01 Warung — console.log", short: "01 • Warung", slide: 4, desc: "01 Warung — console.log (Muttaqin: jujur tapi berantakan)", detail: "Analogi Warung: catat manual di buku tulis — console.log tanpa struktur, tanpa requestId, tanpa level. Cocok untuk 1 warung, hancur saat 6.081 warung." },
    { id: "02-proper-logging", label: "02 UMKM SOP — pino JSON", short: "02 • UMKM SOP", slide: 6, desc: "02 UMKM SOP — pino JSON (Shalih: rapi & terstruktur)", detail: "Analogi UMKM SOP 6.081: pino JSON + requestId + level + timestamp ISO. Log bisa di-query, di-aggregate, korelasi antar service via requestId." },
    { id: "03-scale", label: "03 Pasar 6.081 — scale", short: "03 • Pasar 6.081", slide: 15, desc: "03 Pasar 6.081 — scale (Nafi': bermanfaat scale)", detail: "Analogi Pasar 6.081 scale: 3 container order-service + nginx LB. Pino tetap, tapi scale horizontal — log dari 3 container harus terpusat." },
    { id: "04-centralized", label: "04 SAKTI 5M — centralized", short: "04 • SAKTI 5M", slide: 18, desc: "04 SAKTI 5M — centralized (SAKTI 5M centralized)", detail: "Analogi SAKTI 5M centralized: Alloy → Loki → Grafana. 5 juta log terpusat, query 10ms via LogQL, dashboard Grafana, alert." },
  ];
  const TABS = ["readme", "code", "diagram", "live", "logql"];
  const LS_BRANCH = "gr_branch";
  const LS_TAB = "gr_tab";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  function getBranchFromUrl() {
    const v = new URLSearchParams(location.search).get("branch");
    if (!v) return null;
    // allow short ?branch=02 or full id
    const norm = v.trim();
    const found = BRANCHES.find((b) => b.id === norm || b.id.startsWith(norm) || norm === b.id.split("-")[0]);
    return found ? found.id : null;
  }
  function getTabFromUrl() {
    const v = new URLSearchParams(location.search).get("tab");
    return v && TABS.includes(v) ? v : null;
  }
  function getBranchMeta(id) { return BRANCHES.find((b) => b.id === id) || BRANCHES[0]; }

  function currentBranchId() {
    const sel = $("#branch-select");
    return sel ? sel.value : BRANCHES[0].id;
  }
  function currentTabId() {
    const active = $$(".tab-btn[aria-selected='true']")[0];
    return active ? active.dataset.tab : "readme";
  }

  function pushState(branchId, tabId) {
    const url = new URL(location.href);
    url.searchParams.set("branch", branchId);
    url.searchParams.set("tab", tabId);
    history.pushState({ branch: branchId, tab: tabId }, "", url.toString());
    try { localStorage.setItem(LS_BRANCH, branchId); localStorage.setItem(LS_TAB, tabId); } catch (e) {}
    updateUrlPreview();
  }
  function replaceState(branchId, tabId) {
    const url = new URL(location.href);
    url.searchParams.set("branch", branchId);
    url.searchParams.set("tab", tabId);
    history.replaceState({ branch: branchId, tab: tabId }, "", url.toString());
    try { localStorage.setItem(LS_BRANCH, branchId); localStorage.setItem(LS_TAB, tabId); } catch (e) {}
    updateUrlPreview();
  }

  function updateUrlPreview() {
    const el = $("#branch-url-preview");
    if (el) el.textContent = "?branch=" + currentBranchId() + "&tab=" + currentTabId();
    const chip = $("#branch-chip");
    const meta = getBranchMeta(currentBranchId());
    if (chip) chip.textContent = meta.short;
    const recent = $("#branch-recent");
    if (recent) {
      let last = null; try { last = localStorage.getItem(LS_BRANCH); } catch (e) {}
      recent.textContent = "Recent: " + (last ? getBranchMeta(last).short : "—") + " • deep link shareable";
    }
  }

  function updateHeroCTA(branchId) {
    const meta = getBranchMeta(branchId);
    const cta = $("#hero-cta");
    const cta2 = $("#hero-cta-branch");
    const deep = $("#branch-deep-presentasi");
    if (cta) cta.href = "./presentasi/index.html#slide-" + meta.slide;
    if (cta2) cta2.textContent = meta.short;
    if (deep) deep.href = "./presentasi/index.html#slide-" + meta.slide;
    const bcBranch = $("#breadcrumb-branch");
    if (bcBranch) bcBranch.textContent = meta.label;
    $$(".branch-label").forEach((el) => { el.textContent = meta.label; });
    // readme title/desc
    const rt = $("#readme-title"); if (rt) rt.textContent = meta.desc;
    const rd = $("#readme-desc"); if (rd) rd.textContent = meta.detail;
  }

  function updateCodeViewer(branchId) {
    // file tree already branch-aware via .branch-label; mermaid switch
    const idx = BRANCHES.findIndex((b) => b.id === branchId);
    ["01","02","03","04"].forEach((n, i) => {
      const el = $("#mermaid-" + n);
      if (el) el.style.display = i === idx ? "block" : "none";
    });
    // grid highlight
    const map = { "01-console-log": ["4","5"], "02-proper-logging": ["6","7","8","9","10","11","12","13","14"], "03-scale": ["15","16","17"], "04-centralized": ["18","19","20","21","22"] };
    const highlights = map[branchId] || [];
    $$("#grid40 [data-slide]").forEach((a) => {
      const s = a.getAttribute("data-slide");
      if (highlights.includes(s)) a.classList.add("branch-highlight");
      else a.classList.remove("branch-highlight");
    });
    $$("[data-branch-card]").forEach((c) => {
      if (c.getAttribute("data-branch-card") === branchId) c.classList.add("branch-highlight");
      else c.classList.remove("branch-highlight");
    });
    try { if (window.mermaid) mermaid.run(); } catch (e) {}
  }

  function selectBranch(branchId, opts) {
    const sel = $("#branch-select");
    if (sel) sel.value = branchId;
    updateHeroCTA(branchId);
    updateCodeViewer(branchId);
    updateUrlPreview();
    if (opts && opts.push) pushState(branchId, currentTabId());
    else replaceState(branchId, currentTabId());
  }

  function selectTab(tabId, opts) {
    if (!TABS.includes(tabId)) return;
    $$(".tab-btn").forEach((btn) => {
      const isActive = btn.dataset.tab === tabId;
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
      btn.tabIndex = isActive ? 0 : -1;
    });
    $$(".tab-panel").forEach((p) => {
      const isActive = p.id === "panel-" + tabId;
      p.classList.toggle("active", isActive);
      if (isActive) p.removeAttribute("hidden"); else p.setAttribute("hidden", "");
    });
    const bcTab = $("#breadcrumb-tab");
    if (bcTab) bcTab.textContent = tabId.toUpperCase();
    if (opts && opts.push) pushState(currentBranchId(), tabId);
    else replaceState(currentBranchId(), tabId);
    if (tabId === "live") startHealthPoll(); else stopHealthPoll();
    if (tabId === "diagram") { try { if (window.mermaid) mermaid.run(); } catch (e) {} }
  }

  // Back: popstate restore branch/tab + custom Back link
  window.addEventListener("popstate", (e) => {
    const st = e.state;
    if (st && st.branch && st.tab) {
      selectBranch(st.branch, { push: false });
      selectTab(st.tab, { push: false });
    } else {
      const b = getBranchFromUrl() || BRANCHES[0].id;
      const t = getTabFromUrl() || "readme";
      selectBranch(b, { push: false });
      selectTab(t, { push: false });
    }
  });

  // Copy button + toast
  function showToast(msg) {
    const t = $("#toast");
    if (!t) return;
    t.textContent = msg || "Copied!";
    t.classList.add("show");
    clearTimeout(t._hide);
    t._hide = setTimeout(() => t.classList.remove("show"), 1800);
  }
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-copy]");
    if (!btn) return;
    const text = btn.getAttribute("data-copy");
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => showToast("Copied! " + text.slice(0, 40))).catch(() => showToast("Copied!"));
    } else {
      const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); showToast("Copied!"); } catch (err) { showToast(text); }
      ta.remove();
    }
  });

  // Health check poll 5s only when Live Demo tab active
  let healthTimer = null;
  function setHealthBadge(state) {
    const el = $("#health-badge");
    if (!el) return;
    if (state === "healthy") { el.textContent = "● Healthy — /healthz OK"; el.className = "health-badge healthy"; }
    else if (state === "checking") { el.textContent = "○ Checking — /healthz tiap 5 detik (hanya saat Live Demo tab aktif)"; el.className = "health-badge checking"; }
    else { el.textContent = "○ Offline — /healthz tidak terjangkau"; el.className = "health-badge checking"; }
  }
  function pollHealth() {
    fetch("/healthz", { cache: "no-store" }).then((r) => {
      if (r.ok) setHealthBadge("healthy"); else setHealthBadge("offline");
    }).catch(() => setHealthBadge("offline"));
  }
  function startHealthPoll() {
    stopHealthPoll();
    setHealthBadge("checking");
    pollHealth();
    healthTimer = setInterval(pollHealth, 5000);
  }
  function stopHealthPoll() { if (healthTimer) clearInterval(healthTimer); healthTimer = null; }

  // LogQL Builder/Code dual mode sync
  function syncLogqlPreview() {
    const job = $("#logql-job") ? $("#logql-job").value : "warung-service";
    const filter = $("#logql-filter") ? $("#logql-filter").value : '|= "CARD_DECLINED"';
    const q = '{job="' + job + '"} ' + filter;
    const prev = $("#logql-preview"); if (prev) prev.textContent = q;
    const ta = $("#logql-textarea"); if (ta) ta.value = q;
    const ta2 = $("#logql2-textarea"); if (ta2) ta2.value = q;
  }

  document.addEventListener("DOMContentLoaded", () => {
    // init branch from URL > localStorage > default
    let branchId = getBranchFromUrl();
    if (!branchId) { try { const ls = localStorage.getItem(LS_BRANCH); if (ls && BRANCHES.find((b) => b.id === ls)) branchId = ls; } catch (e) {} }
    if (!branchId) branchId = BRANCHES[0].id;
    let tabId = getTabFromUrl();
    if (!tabId) { try { const ls = localStorage.getItem(LS_TAB); if (ls && TABS.includes(ls)) tabId = ls; } catch (e) {} }
    if (!tabId) tabId = "readme";

    const sel = $("#branch-select");
    if (sel) {
      sel.addEventListener("change", () => selectBranch(sel.value, { push: true }));
    }
    // tabs click + keyboard Left/Right + Enter
    const tablist = $("#branch-tablist");
    if (tablist) {
      tablist.addEventListener("click", (e) => {
        const btn = e.target.closest(".tab-btn");
        if (!btn) return;
        selectTab(btn.dataset.tab, { push: true });
      });
      tablist.addEventListener("keydown", (e) => {
        const btns = $$(".tab-btn", tablist);
        const idx = btns.indexOf(document.activeElement);
        if (e.key === "ArrowRight") { e.preventDefault(); const n = (idx + 1) % btns.length; btns[n].focus(); }
        if (e.key === "ArrowLeft") { e.preventDefault(); const n = (idx - 1 + btns.length) % btns.length; btns[n].focus(); }
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); const b = document.activeElement; if (b && b.classList.contains("tab-btn")) selectTab(b.dataset.tab, { push: true }); }
      });
    }

    // Back link
    const back = $("#back-link");
    if (back) back.addEventListener("click", (e) => { e.preventDefault(); history.back(); });

    // copy link
    const copyLink = $("#branch-copy-link");
    if (copyLink) copyLink.addEventListener("click", (e) => {
      e.preventDefault();
      const url = location.href;
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => showToast("Link copied! " + url.slice(0, 50))).catch(() => showToast(url));
      else showToast(url);
    });

    // diff toggle
    const diffBtn = $("#btn-diff");
    if (diffBtn) diffBtn.addEventListener("click", () => {
      const dv = $("#diff-view");
      if (!dv) return;
      dv.style.display = dv.style.display === "none" ? "block" : "none";
      diffBtn.textContent = dv.style.display === "none" ? "Compare 01 vs 02" : "Hide diff";
    });

    // LogQL builder/code toggle
    const bBtn = $("#logql-mode-builder"), cBtn = $("#logql-mode-code");
    const bPanel = $("#logql-builder"), cPanel = $("#logql-code");
    if (bBtn && cBtn) {
      bBtn.addEventListener("click", () => { bPanel.style.display = "flex"; cPanel.style.display = "none"; bBtn.style.background = "#1e3a5f"; bBtn.style.color = "#fff"; cBtn.style.background = "#fff"; cBtn.style.color = "#1e3a5f"; });
      cBtn.addEventListener("click", () => { bPanel.style.display = "none"; cPanel.style.display = "block"; cBtn.style.background = "#1e3a5f"; cBtn.style.color = "#fff"; bBtn.style.background = "#fff"; bBtn.style.color = "#1e3a5f"; });
    }
    const lj = $("#logql-job"), lf = $("#logql-filter");
    if (lj) lj.addEventListener("change", syncLogqlPreview);
    if (lf) lf.addEventListener("change", syncLogqlPreview);
    const ta = $("#logql-textarea");
    if (ta) ta.addEventListener("input", () => { const p = $("#logql-preview"); if (p) p.textContent = ta.value; const t2 = $("#logql2-textarea"); if (t2) t2.value = ta.value; });
    const lj2 = $("#logql2-job"), ll2 = $("#logql2-level"), lc2 = $("#logql2-contains");
    function sync2() {
      const job = lj2 ? lj2.value : "warung-service";
      const level = ll2 && ll2.value ? ' | json | level="' + ll2.value + '"' : "";
      const contains = lc2 && lc2.value ? ' |= "' + lc2.value + '"' : "";
      const q = '{job="' + job + '"}' + contains + level;
      const t2 = $("#logql2-textarea"); if (t2) t2.value = q;
      const t = $("#logql-textarea"); if (t) t.value = q;
      const p = $("#logql-preview"); if (p) p.textContent = q;
    }
    if (lj2) lj2.addEventListener("change", sync2);
    if (ll2) ll2.addEventListener("change", sync2);
    if (lc2) lc2.addEventListener("input", sync2);

    // mermaid init
    try { if (window.mermaid) mermaid.initialize({ startOnLoad: true, theme: "base", themeVariables: { primaryColor: "#1e3a5f" } }); } catch (e) {}

    // initial render without push (replace)
    selectBranch(branchId, { push: false });
    selectTab(tabId, { push: false });
    // ensure history state has branch/tab for back
    replaceState(branchId, tabId);
    syncLogqlPreview();
  });
})();

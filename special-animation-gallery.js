(() => {
  "use strict";

  const data = window.MEOWMOON_SPECIAL_GALLERY_DATA;
  if (!data) return;

  const byId = new Map(data.animations.map(item => [item.id, item]));
  const categoryById = new Map(data.categories.map(item => [item.id, item]));
  const warnings = [];
  const previewStatuses = new Map();
  let liveRegistryIds = null;

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function previewUrl(animation) {
    const params = new URLSearchParams({
      meowmoonGalleryPreview: "1",
      animation: animation.id
    });
    return `special-animation-preview.html?${params.toString()}`;
  }

  function summaryUrl() {
    const params = new URLSearchParams({
      meowmoonGalleryPreview: "1",
      animation: "rocket",
      summaryOnly: "1"
    });
    return `special-animation-preview.html?${params.toString()}`;
  }

  function categoryAnimations(categoryId) {
    return data.animations.filter(animation => animation.category === categoryId);
  }

  function categoryName(categoryId) {
    return categoryById.get(categoryId)?.name || "Miscellaneous";
  }

  function addWarning(message) {
    if (!warnings.includes(message)) warnings.push(message);
    renderWarnings();
  }

  function renderWarnings() {
    const box = $("galleryWarning");
    const list = $("warningList");
    if (!box || !list) return;
    if (!warnings.length) {
      box.hidden = true;
      list.innerHTML = "";
      return;
    }
    box.hidden = false;
    list.innerHTML = `<ul>${warnings.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
  }

  function validateStaticInventory() {
    const ids = data.animations.map(item => item.id);
    const unique = new Set(ids);
    if (data.animations.length !== data.expectedRegistryCount) {
      addWarning(`Gallery data lists ${data.animations.length} animations, but expected ${data.expectedRegistryCount}.`);
    }
    if (unique.size !== ids.length) {
      addWarning("Gallery data contains duplicate animation ids.");
    }
    for (const animation of data.animations) {
      if (!categoryById.has(animation.category)) {
        addWarning(`${animation.id} has unknown category ${animation.category}.`);
      }
    }
  }

  function compareLiveRegistry(ids) {
    liveRegistryIds = ids;
    const live = new Set(ids);
    const gallery = new Set(data.animations.map(item => item.id));
    if (ids.length !== data.expectedRegistryCount) {
      addWarning(`Production registry reports ${ids.length} animations; gallery expected ${data.expectedRegistryCount}.`);
    }
    for (const id of ids) {
      if (!gallery.has(id)) addWarning(`Production registry animation missing from gallery data: ${id}.`);
    }
    for (const id of gallery) {
      if (!live.has(id)) addWarning(`Gallery animation not found in production registry: ${id}.`);
    }
  }

  function installRegistrySummaryProbe() {
    const iframe = document.createElement("iframe");
    iframe.title = "Production registry count self-check";
    iframe.src = summaryUrl();
    iframe.hidden = true;
    document.body.appendChild(iframe);
  }

  function renderStats(scopeAnimations, pageCount) {
    const stats = $("galleryStats");
    if (!stats) return;
    const liveText = liveRegistryIds ? `${liveRegistryIds.length}` : "checking...";
    stats.innerHTML = [
      `<div class="stat"><strong>${data.expectedRegistryCount}</strong><span>production animations expected</span></div>`,
      `<div class="stat"><strong>${scopeAnimations.length}</strong><span>animations on this page/view</span></div>`,
      `<div class="stat"><strong>${pageCount}</strong><span>gallery pages</span></div>`,
      `<div class="stat"><strong>${liveText}</strong><span>live registry count</span></div>`
    ].join("");
  }

  function matchesQuery(animation, query) {
    if (!query) return true;
    const haystack = [
      animation.id,
      animation.label,
      animation.draw,
      animation.version,
      categoryName(animation.category)
    ].join(" ").toLowerCase();
    return haystack.includes(query.toLowerCase());
  }

  function renderIndex() {
    renderStats(data.animations, data.categories.length);
    const grid = $("categoryGrid");
    if (grid) {
      grid.innerHTML = data.categories.map(category => {
        const count = categoryAnimations(category.id).length;
        const href = `special-animation-gallery-page.html?category=${encodeURIComponent(category.id)}`;
        return `
          <article class="category-card" data-search-text="${escapeHtml(`${category.name} ${category.description}`)}">
            <h3>${escapeHtml(category.name)}</h3>
            <p>${escapeHtml(category.description)}</p>
            <p><strong>${count}</strong> animations</p>
            <a class="button" href="${href}">Open gallery</a>
          </article>
        `;
      }).join("");
    }
    renderSearchResults("");
    $("gallerySearch")?.addEventListener("input", event => renderSearchResults(event.target.value));
  }

  function renderSearchResults(query) {
    const target = $("searchResults");
    if (!target) return;
    const matches = data.animations.filter(animation => matchesQuery(animation, query));
    if (!query) {
      target.innerHTML = "<p class=\"meta\">Type to search across all production special animations.</p>";
      return;
    }
    if (!matches.length) {
      target.innerHTML = "<p class=\"meta\">No matching production animations.</p>";
      return;
    }
    target.innerHTML = matches.map(animation => `
      <article class="category-card">
        <h3>${escapeHtml(animation.label)}</h3>
        <p class="meta">${escapeHtml(animation.id)} · ${escapeHtml(categoryName(animation.category))} · ${escapeHtml(animation.draw)}</p>
        <a class="button" href="special-animation-gallery-page.html?category=${encodeURIComponent(animation.category)}#${encodeURIComponent(animation.id)}">Open gallery</a>
      </article>
    `).join("");
  }

  function renderCategoryPage() {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("category") || data.categories[0]?.id || "";
    const category = categoryById.get(requested) || data.categories[0];
    const animations = categoryAnimations(category.id);
    document.title = `${category.name} · Meowmoon Special Animation Gallery`;
    $("categoryTitle").textContent = category.name;
    $("categoryDescription").textContent = category.description;
    renderStats(animations, data.categories.length);

    const grid = $("galleryGrid");
    grid.innerHTML = animations.map(renderTile).join("");
    $("gallerySearch")?.addEventListener("input", event => filterTiles(event.target.value));
    setupTileControls(grid);
    setupLargePreview();
  }

  function renderTile(animation) {
    return `
      <article class="tile" id="${escapeHtml(animation.id)}" data-animation-id="${escapeHtml(animation.id)}" data-filter-text="${escapeHtml(`${animation.label} ${animation.id} ${animation.draw} ${categoryName(animation.category)} ${animation.version}`)}">
        <div class="tile-header">
          <h3>${escapeHtml(animation.label)}</h3>
          <div class="meta">
            Key: <code>${escapeHtml(animation.id)}</code><br />
            Category: ${escapeHtml(categoryName(animation.category))}<br />
            Draw: <code>${escapeHtml(animation.draw)}</code><br />
            Duration: ${escapeHtml(animation.durationLabel)}${animation.version ? ` · Version: ${escapeHtml(animation.version)}` : ""}
          </div>
        </div>
        <div class="preview-wrap">
          <iframe class="preview-frame" loading="lazy" title="${escapeHtml(animation.label)} preview" src="${previewUrl(animation)}"></iframe>
        </div>
        <div class="tile-controls">
          <button type="button" data-action="restart">Play / Restart</button>
          <button type="button" class="secondary" data-action="pause">Pause</button>
          <button type="button" class="secondary" data-action="large">Large preview</button>
        </div>
        <div class="tile-status" data-status>Waiting for preview...</div>
      </article>
    `;
  }

  function filterTiles(query) {
    for (const tile of document.querySelectorAll(".tile")) {
      const text = tile.dataset.filterText.toLowerCase();
      tile.classList.toggle("filtered-out", query && !text.includes(query.toLowerCase()));
    }
  }

  function setupTileControls(container) {
    container.addEventListener("click", event => {
      const button = event.target.closest("button");
      if (!button) return;
      const tile = button.closest(".tile");
      const animation = byId.get(tile?.dataset.animationId);
      if (!tile || !animation) return;
      const action = button.dataset.action;
      if (action === "large") {
        openLargePreview(animation);
        return;
      }
      const iframe = tile.querySelector("iframe");
      if (action === "pause") {
        const paused = button.dataset.paused === "1";
        sendControl(iframe, paused ? "resume" : "pause");
        button.dataset.paused = paused ? "0" : "1";
        button.textContent = paused ? "Pause" : "Resume";
      } else {
        sendControl(iframe, "restart");
        const pauseButton = tile.querySelector('[data-action="pause"]');
        if (pauseButton) {
          pauseButton.dataset.paused = "0";
          pauseButton.textContent = "Pause";
        }
      }
    });
  }

  function sendControl(iframe, action) {
    iframe?.contentWindow?.postMessage({ source: "meowmoon-special-gallery-control", action }, "*");
  }

  function setupLargePreview() {
    const backdrop = $("largePreview");
    const close = document.querySelector("[data-large-close]");
    close?.addEventListener("click", closeLargePreview);
    backdrop?.addEventListener("click", event => {
      if (event.target === backdrop) closeLargePreview();
    });
    window.addEventListener("keydown", event => {
      if (event.key === "Escape" && !backdrop?.hidden) closeLargePreview();
    });
  }

  function openLargePreview(animation) {
    $("largePreviewTitle").textContent = `${animation.label} (${animation.id})`;
    $("largePreviewFrame").src = previewUrl(animation);
    $("largePreview").hidden = false;
  }

  function closeLargePreview() {
    $("largePreview").hidden = true;
    $("largePreviewFrame").src = "about:blank";
  }

  window.addEventListener("message", event => {
    const message = event.data;
    if (message?.source !== "meowmoon-special-gallery") return;
    if (message.kind === "registry-summary" && Array.isArray(message.ids)) {
      compareLiveRegistry(message.ids);
      renderStats(document.body.dataset.galleryView === "category"
        ? categoryAnimations(new URLSearchParams(window.location.search).get("category") || data.categories[0].id)
        : data.animations, data.categories.length);
      return;
    }
    if (message.kind === "status" && message.id) {
      previewStatuses.set(message.id, message);
      const tile = Array.from(document.querySelectorAll("[data-animation-id]"))
        .find(candidate => candidate.dataset.animationId === message.id);
      const status = tile?.querySelector("[data-status]");
      if (status) {
        status.textContent = message.status || (message.ok ? "OK" : "Error");
        status.classList.toggle("ok", !!message.ok);
        status.classList.toggle("error", !message.ok);
      }
      if (!message.ok) addWarning(`${message.id}: ${message.status || "preview error"}`);
    }
  });

  validateStaticInventory();
  installRegistrySummaryProbe();

  if (document.body.dataset.galleryView === "category") renderCategoryPage();
  else renderIndex();
})();

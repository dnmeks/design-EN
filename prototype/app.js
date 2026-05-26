(function () {
  const games = window.GAMES || [];
  const iconUrl = window.TYPE_ICON;
  const isSeason = window.isGameInSeason;
  const activeSeason = window.getActiveSeason;

  /** Идут сейчас = есть кнопка «Вход в игру» (playUrl / GameEnterBox на сайте) */
  const filters = {
    live: (g) => Boolean(g.playUrl),
    season: (g) => isSeason(g),
    upcoming: (g) => g.status === "upcoming",
    real: (g) => g.mode === "real",
    virtual: (g) => g.mode === "virtual",
    all: () => true,
  };

  function renderCard(game) {
    const inSeason = isSeason(game);
    const li = document.createElement("li");
    li.className = "game-card" + (inSeason ? " is-season" : "");
    li.dataset.zone = String(game.zone);

    const thumb = game.poster
      ? `<img class="game-card__thumb" src="${game.poster}" alt="" loading="lazy" />`
      : `<div class="game-card__thumb game-card__thumb--placeholder" aria-hidden="true">${game.mode === "virtual" ? "🧠" : "📍"}</div>`;

    const liveBadge = game.playUrl ? '<span class="badge-live">идёт</span>' : "";
    const seasonBadge = inSeason ? '<span class="badge-season">сезон</span>' : "";
    const playBtn = game.playUrl
      ? `<a class="action-btn action-btn--primary" href="${game.playUrl}">Вход в игру</a>`
      : "";

    li.innerHTML = `
      ${thumb}
      <div class="game-card__head">
        <span class="type-badge" data-zone="${game.zone}">
          <img src="${iconUrl(game.zone)}" alt="" width="16" height="16" />
          ${game.typeName}
        </span>
        ${liveBadge}
        ${seasonBadge}
        <span class="game-card__num">#${game.num}</span>
      </div>
      <h3 class="game-card__title">
        <a href="${game.url}">${escapeHtml(game.title)}</a>
      </h3>
      <div class="game-card__meta">
        <span>${escapeHtml(game.start)}</span>
        <span><strong>${escapeHtml(game.fee)}</strong></span>
        <span>${escapeHtml(game.authors)}</span>
      </div>
      <div class="game-card__actions">
        ${playBtn}
        <a class="action-btn action-btn--ghost" href="${game.url}">Подробнее</a>
      </div>
    `;

    return li;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fillGrid(gridId, list) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = "";
    list.forEach((g) => grid.appendChild(renderCard(g)));
  }

  function updateCounts() {
    Object.keys(filters).forEach((key) => {
      const el = document.querySelector(`[data-count="${key}"]`);
      if (el) el.textContent = games.filter(filters[key]).length;
    });
  }

  function renderAllPanels() {
    fillGrid("grid-live", games.filter(filters.live));
    fillGrid("grid-season", games.filter(filters.season));
    fillGrid("grid-all", games.filter(filters.all));
    fillGrid("grid-real", games.filter(filters.real));
    fillGrid("grid-virtual", games.filter(filters.virtual));
    fillGrid("grid-upcoming", games.filter(filters.upcoming));

    const emptyLive = document.querySelector("#panel-live .empty-state");
    if (emptyLive) emptyLive.hidden = games.filter(filters.live).length > 0;

    const emptySeason = document.querySelector("#panel-season .empty-state");
    if (emptySeason) emptySeason.hidden = games.filter(filters.season).length > 0;
  }

  function bindHeroSeasonLinks() {
    const s = activeSeason();
    if (!s) return;
    const reg = document.getElementById("chip-reglement");
    const stand = document.getElementById("chip-standings");
    const sub = document.getElementById("hero-season-name");
    const calTitle = document.getElementById("calendar-season-title");
    if (reg && s.reglementUrl) reg.href = s.reglementUrl;
    if (stand && s.standingsUrl) stand.href = s.standingsUrl;
    if (sub) sub.textContent = s.name;
    if (calTitle) calTitle.textContent = "Календарь: " + s.name;
  }

  function fillCalendarTable(bodyId, list) {
    const body = document.getElementById(bodyId);
    if (!body) return;
    if (!list.length) {
      body.innerHTML =
        '<tr><td colspan="4" class="calendar-empty">Нет игр</td></tr>';
      return;
    }
    body.innerHTML = list
      .map(
        (g) => `
      <tr>
        <td><img src="${iconUrl(g.zone)}" alt="" width="24" height="24" /></td>
        <td><a href="${g.url}">#${g.num} ${escapeHtml(g.title)}</a></td>
        <td>${escapeHtml(g.start)}</td>
        <td>${escapeHtml(g.fee)}</td>
      </tr>`
      )
      .join("");
  }

  function fillCalendars() {
    fillCalendarTable("calendar-body-all", games);
    fillCalendarTable("calendar-body-season", games.filter(filters.season));
  }

  function initTabs() {
    const tabs = document.querySelectorAll('.tabs [role="tab"]');
    const panels = document.querySelectorAll(".tab-panel");

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const id = tab.getAttribute("aria-controls");
        tabs.forEach((t) =>
          t.setAttribute("aria-selected", t === tab ? "true" : "false")
        );
        panels.forEach((p) => {
          const active = p.id === id;
          p.hidden = !active;
          p.classList.toggle("is-active", active);
        });
      });
    });
  }

  bindHeroSeasonLinks();
  updateCounts();
  renderAllPanels();
  fillCalendars();
  initTabs();
})();

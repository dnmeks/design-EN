/**
 * Сезоны домена kovrov.en.cx
 * При смене сезона: поменять activeSeasonId и блок в seasons[].
 */
window.SEASONS_CONFIG = {
  activeSeasonId: "made-en-russia-2026",
  seasons: [
    {
      id: "made-en-russia-2026",
      name: 'Сезон 2026 · "Made EN Russia"',
      reglementUrl: "/Addons.aspx?aid=19387",
      standingsUrl: "/Administration/",
      match: {
        titleContains: ["Made EN Russia"],
        gids: [
          "81885", "81369", "79677", "81886", "81887",
          "81888", "82156", "81889", "81348",
          "82190", "82191", "82192"
        ]
      }
    }
  ]
};

window.getActiveSeason = function () {
  var cfg = window.SEASONS_CONFIG;
  var i, s;
  for (i = 0; i < cfg.seasons.length; i++) {
    if (cfg.seasons[i].id === cfg.activeSeasonId) return cfg.seasons[i];
  }
  return cfg.seasons[0];
};

window.isGameInSeason = function (gameOrGid, titleOptional) {
  var season = window.getActiveSeason();
  var gid, title, gids, parts, i, j;
  if (!season || !season.match) return false;

  if (typeof gameOrGid === "object" && gameOrGid) {
    gid = String(gameOrGid.id);
    title = gameOrGid.title || "";
  } else {
    gid = String(gameOrGid);
    title = titleOptional || "";
  }

  gids = season.match.gids || [];
  for (i = 0; i < gids.length; i++) {
    if (gids[i] === gid) return true;
  }

  parts = season.match.titleContains || [];
  for (j = 0; j < parts.length; j++) {
    if (title.indexOf(parts[j]) !== -1) return true;
  }
  return false;
};

/** Реальные: схватка (0), точки (7), мокрые войны (5). Остальные — виртуальные */
window.isVirtualZone = function (zone) {
  return zone !== 0 && zone !== 7 && zone !== 5;
};

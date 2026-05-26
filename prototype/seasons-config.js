/**
 * Конфигурация сезонов домена.
 * При смене сезона: поменять activeSeasonId и при необходимости добавить новый объект в seasons.
 *
 * Игра попадает во вкладку «Сезон», если выполняется ЛЮБОЕ из условий match (логика ИЛИ):
 *   - gid в списке gids (надёжно, как сейчас в seasonGames на сайте);
 *   - в названии есть одна из подстрок titleContains.
 *
 * Для прошлых сезонов объекты можно оставить в seasons (архив), но activeSeasonId — только один.
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
          "81885",
          "81369",
          "79677",
          "81886",
          "81887",
          "81888",
          "82156",
          "81889",
          "81348",
        ],
      },
    },
    // Пример будущего сезона — пока не активен:
    // {
    //   id: "center-2027",
    //   name: 'Сезон "Центр всетлENной"',
    //   reglementUrl: "/Addons.aspx?aid=19242",
    //   standingsUrl: "/Addons.aspx?aid=19259",
    //   match: {
    //     titleContains: ["Центр всетлENной"],
    //     gids: [],
    //   },
    // },
  ],
};

window.getActiveSeason = function () {
  const cfg = window.SEASONS_CONFIG;
  return (
    cfg.seasons.find((s) => s.id === cfg.activeSeasonId) || cfg.seasons[0]
  );
};

/** Проверка по объекту игры { id, title } или по gid + title отдельно */
window.isGameInSeason = function (gameOrGid, titleOptional) {
  const season = window.getActiveSeason();
  if (!season || !season.match) return false;

  const gid = String(
    typeof gameOrGid === "object" ? gameOrGid.id : gameOrGid
  );
  const title =
    typeof gameOrGid === "object" ? gameOrGid.title : titleOptional || "";

  const { gids = [], titleContains = [] } = season.match;

  if (gids.includes(gid)) return true;
  return titleContains.some((part) => title.indexOf(part) !== -1);
};

/**
 * Kovrov games hub — парсит #boxCenterActiveGames / #boxCenterComingGames
 * Требует: jQuery, seasons-config.js, #kvGamesHub
 */
(function () {
  function isVirtualZone(zone) {
    if (window.isVirtualZone) return window.isVirtualZone(zone);
    return zone !== 0 && zone !== 7 && zone !== 5;
  }

  function isGameInSeason(game) {
    if (window.isGameInSeason) return window.isGameInSeason(game);
    return false;
  }

  function getActiveSeason() {
    if (window.getActiveSeason) return window.getActiveSeason();
    return null;
  }

  var hubDone = false;

  function isMobileLayout() {
    return window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
  }

  function syncMobileView($) {
    var mobile = isMobileLayout();
    $("html").addClass("kv-html-theme");
    $("body").addClass("kv-full-theme");
    $("html").toggleClass("kv-view-mobile", mobile);
    $("body").toggleClass("kv-layout-mobile", mobile);
  }

  /** Десктоп: спонсоры в #kvSponsorsCenter (под хабом игр); мобила: в #DivRightDesign */
  function placeSponsorsLayout($) {
    if (window.kvPlaceSponsors) {
      window.kvPlaceSponsors();
      return;
    }

    var $panel = $("#kvSponsorsCenter .kv-panel--season, #DivRightDesign .kv-panel--season").first();
    var $slot = $("#kvSponsorsCenter");
    var $right = $("#DivRightDesign");
    if (!$panel.length || !$right.length) {
      return;
    }

    var desktop =
      window.matchMedia && window.matchMedia("(min-width: 769px)").matches;

    if (desktop && $slot.length) {
      if (!$panel.parent().is($slot)) {
        $panel.appendTo($slot);
      }
      $("html, body").addClass("kv-sponsors-in-center");
      return;
    }

    if (!$panel.parent().is($right)) {
      var $anchor = $right.children(".kv-panel").not(".kv-panel--season").last();
      if ($anchor.length && !$anchor.is($panel)) {
        $panel.insertBefore($anchor);
      } else {
        $panel.appendTo($right);
      }
    }
    $("html, body").removeClass("kv-sponsors-in-center");
  }

  function ensureViewport() {
    var head, meta;
    if (document.querySelector('meta[name="viewport"]')) return;
    head = document.getElementsByTagName("head")[0];
    if (!head) return;
    meta = document.createElement("meta");
    meta.name = "viewport";
    meta.content = "width=device-width, initial-scale=1";
    head.appendChild(meta);
  }

  function initKvGamesHub($) {
    if (hubDone) return;

    ensureViewport();
    syncMobileView($);

    var hasHub = $("#kvGamesHub").length > 0;
    var $active = $("#boxCenterActiveGames");
    var $coming = $("#boxCenterComingGames");
    if (!hasHub && !$active.length && !$coming.length) return;

    var GRIDS = [
      { panel: "kv-panel-live", grid: "kv-grid-live" },
      { panel: "kv-panel-season", grid: "kv-grid-season" },
      { panel: "kv-panel-upcoming", grid: "kv-grid-upcoming" },
      { panel: "kv-panel-real", grid: "kv-grid-real" },
      { panel: "kv-panel-virtual", grid: "kv-grid-virtual" },
      { panel: "kv-panel-all", grid: "kv-grid-all" }
    ];

    function ensureGrids() {
      var i, p, $panel, $grid;
      for (i = 0; i < GRIDS.length; i++) {
        p = GRIDS[i];
        $panel = $("#" + p.panel);
        if (!$panel.length) continue;
        $grid = $("#" + p.grid);
        if (!$grid.length) {
          $panel.prepend(
            '<ul class="kv-game-grid" id="' + p.grid + '"><li class="kv-grid-placeholder" style="display:none">.</li></ul>'
          );
        }
      }
    }

    function iconUrl(zone) {
      return "https://cdn.endata.cx/images/icons/forum/type." + zone + ".gif?v1";
    }

    function escapeHtml(s) {
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function textAfterTitle($table, label) {
      var found = "";
      $table.find("span.title").each(function () {
        var $t = $(this);
        if ($t.text().indexOf(label) !== -1) {
          found = $t.parent().text().replace($t.text(), "").trim();
          if (!found) found = $t.next().text();
        }
      });
      return found.split("(")[0].trim();
    }

    function gameGidFromTable($table) {
      var href =
        $table.find('a[href*="GameDetails.aspx?gid="]').first().attr("href") || "";
      var m = href.match(/gid=(\d+)/i);
      return m ? m[1] : "";
    }

    function isBadPosterSrc(src, $img) {
      if (!src || /^data:/i.test(src)) return true;
      if (/type\.\d+\.gif/i.test(src)) return true;
      if (/icons\/forum\/|\/images\/engines\/|\/images\/icons\//i.test(src)) return true;
      if (/tgtg\.png|empty\.gif|\/buttons\//i.test(src)) return true;
      var w = parseInt(($img && $img.attr("width")) || 0, 10) || 0;
      if (w > 0 && w <= 40) return true;
      if (/\/data\/games\//i.test(src)) return false;
      if (/newanons/i.test(src)) return false;
      if (/personal\//i.test(src) && $img && $img.length) {
        var st = String($img.attr("style") || "").toLowerCase();
        if (st.indexOf("width: 100%") !== -1 || st.indexOf("width:100%") !== -1) return false;
        var wm = st.match(/width:\s*(\d{2,4})px/);
        if (wm && parseInt(wm[1], 10) >= 120) return false;
        if (/(telega|vk\d|instagram|icons8|logo|sponsor|50\.png|32\.)/i.test(src)) return true;
        return true;
      }
      return false;
    }

    function posterScore(src, gid) {
      var s = 0;
      if (gid && src.indexOf("/data/games/" + gid + "/") !== -1) s += 50;
      if (/newanons/i.test(src)) s += 25;
      if (/oblozka|анонс|announce|cover|poster|preview/i.test(src)) s += 30;
      if (/\.(jpe?g|png|webp)(\?|$)/i.test(src)) s += 10;
      return s;
    }

    function posterFromDescrStyles($descr, gid) {
      var best = null;
      var bestScore = -1;
      $descr.add($descr.find("[style]")).each(function () {
        var st = $(this).attr("style") || "";
        var m = st.match(/url\s*\(\s*['"]?([^'")]+)/i);
        if (!m) return;
        var src = m[1];
        if (isBadPosterSrc(src, null)) return;
        var sc = posterScore(src, gid);
        if (sc > bestScore) {
          bestScore = sc;
          best = src;
        }
      });
      return best;
    }

    /** Первая подходящая картинка в блоке анонса (обычно она одна) */
    function firstPosterInScope($scope, gid) {
      var found = null;
      $scope.find("img[src]").each(function () {
        var $img = $(this);
        var src = $img.attr("src") || "";
        if (isBadPosterSrc(src, $img)) return;
        found = src;
        return false;
      });
      if (found) return found;
      return posterFromDescrStyles($scope, gid);
    }

    /** Области анонса GameDetails: «От автора», .divDescr — без спонсоров внизу */
    function announcementScopes($wrap) {
      var scopes = [];
      var $authorTd = $wrap.find("#lblFromAuthor").closest("td");
      if ($authorTd.length) scopes.push($authorTd);

      $wrap.find(".divDescr, .gameDescr").each(function () {
        scopes.push($(this));
      });

      if (!scopes.length) {
        var $gi = $wrap.find("table.gameInfo").first();
        if ($gi.length) {
          var inAuthor = false;
          $gi.find("> tbody > tr").each(function () {
            var $tr = $(this);
            if ($tr.find("#lblFromAuthor").length) inAuthor = true;
            if (!inAuthor) return;
            if (
              $tr.find("#lblPhotoGalleries, #DivRightDesign, #footerRow, .bottom_hr").length
            ) {
              inAuthor = false;
              return false;
            }
            var $td = $tr.children("td").first();
            if ($td.length) scopes.push($td);
          });
        }
      }
      return scopes;
    }

    /** Постер только со страницы анонса */
    function parsePosterFromDetailsHtml(html, gid) {
      if (!html) return null;
      var $wrap = $("<div>").html(html);
      var scopes = announcementScopes($wrap);
      var i;
      for (i = 0; i < scopes.length; i++) {
        var poster = firstPosterInScope(scopes[i], gid);
        if (poster) return poster;
      }
      return null;
    }

    var posterFetchPending = {};
    var posterCache = {};

    function fetchPosterFromGameDetails(gid, done) {
      if (!gid) {
        done(null);
        return;
      }
      if (Object.prototype.hasOwnProperty.call(posterCache, gid)) {
        done(posterCache[gid]);
        return;
      }
      if (posterFetchPending[gid]) {
        setTimeout(function () {
          fetchPosterFromGameDetails(gid, done);
        }, 250);
        return;
      }
      posterFetchPending[gid] = true;
      $.ajax({
        url: "/GameDetails.aspx?gid=" + encodeURIComponent(gid),
        type: "GET",
        dataType: "html",
        cache: true
      })
        .done(function (html) {
          var poster = parsePosterFromDetailsHtml(html, gid);
          posterCache[gid] = poster || null;
          done(poster);
        })
        .fail(function () {
          posterCache[gid] = null;
          done(null);
        })
        .always(function () {
          posterFetchPending[gid] = false;
        });
    }

    function refreshPostersFromAnnouncements() {
      if (!hasHub || !games.length) return;
      var pending = 0;
      var dirty = false;

      function maybeFlush() {
        if (pending > 0) return;
        if (!dirty) return;
        fillAllGrids();
        initKvThumbZoom();
      }

      var i;
      for (i = 0; i < games.length; i++) {
        (function (g) {
          pending++;
          fetchPosterFromGameDetails(g.id, function (poster) {
            pending--;
            if (poster && poster !== g.poster) {
              g.poster = poster;
              dirty = true;
            }
            maybeFlush();
          });
        })(games[i]);
      }
      maybeFlush();
    }

    function shortTimeLeft(value) {
      return String(value || "")
        .split(" ")
        .filter(function (x, i) {
          return i < 4;
        })
        .join(" ")
        .replace(/(.+)\s0 часов$/, "$1")
        .trim();
    }

    function getEnterHolder($table) {
      return $table.find('[id*="GameEnterBox_divEnterGameHolder"]').first();
    }

    function findPlayLink($table) {
      var $holder = getEnterHolder($table);
      var $scope = $holder.length ? $holder : $table;
      return $scope
        .find('a.glassbutton[title="Вход в игру"], a[href*="/gameengines/"][href*="/play/"]')
        .first();
    }

    /** EN открывает блок входа за 15 мин — смотрим style, который выставляет OnGameEnterTimerTick */
    function isEnterHolderOpen($holder) {
      if (!$holder.length) return false;
      var el = $holder[0];
      if (el.style.display === "block") return true;
      if (el.style.display === "none") return false;
      var attr = ($holder.attr("style") || "").toLowerCase();
      return !/display\s*:\s*none/.test(attr);
    }

    function canShowEnterButton($table, listKind) {
      var $play = findPlayLink($table);
      if (!$play.length) return null;
      var href = $play.attr("href");
      if (!href) return null;
      if (listKind === "active") return href;
      var $holder = getEnterHolder($table);
      if ($holder.length && isEnterHolderOpen($holder)) return href;
      return null;
    }

    function parseAuthors($table) {
      var $links = $table.find('a#lnkAuthor, a[ID="lnkAuthor"]');
      if ($links.length) {
        return {
          text: $links
            .map(function () {
              return $.trim($(this).text());
            })
            .get()
            .join(", "),
          html: $links
            .map(function () {
              var $a = $(this);
              var href = $a.attr("href") || "#";
              return (
                '<a class="kv-author-link" href="' +
                String(href).replace(/"/g, "&quot;") +
                '" target="_blank">' +
                escapeHtml($.trim($a.text())) +
                "</a>"
              );
            })
            .get()
            .join(", ")
        };
      }
      var names = "";
      $table.find("span.title").each(function () {
        var $t = $(this);
        if ($t.text().indexOf("Автор") === -1) return;
        names = $t
          .parent()
          .find('a[href*="UserDetails.aspx"]')
          .map(function () {
            return $.trim($(this).text());
          })
          .get()
          .join(", ");
      });
      if (!names) return { text: "—", html: "—" };
      return { text: names, html: escapeHtml(names) };
    }

    function pluralRu(n, forms) {
      var num = Math.abs(parseInt(n, 10) || 0);
      var mod100 = num % 100;
      var mod10 = num % 10;
      if (mod100 > 10 && mod100 < 20) return forms[2];
      if (mod10 === 1) return forms[0];
      if (mod10 > 1 && mod10 < 5) return forms[1];
      return forms[2];
    }

    function participantUnitKind(text) {
      if (/команд/i.test(text)) return "teams";
      return "players";
    }

    function formatParticipantTotal(total, kind) {
      if (kind === "teams") {
        return total + " " + pluralRu(total, ["команда", "команды", "команд"]);
      }
      return total + " " + pluralRu(total, ["участник", "участника", "участников"]);
    }

    function countFromParticipantLine(text, label) {
      if (!text || text.indexOf(label) === -1) return null;
      var rest = text.replace(new RegExp("^.*?" + label, "i"), "");
      var m = rest.match(/(\d+)/);
      return m ? parseInt(m[1], 10) : 0;
    }

    function parseParticipants($table) {
      var confirmed = null;
      var approved = null;
      var unitKind = null;

      $table.find("td, div").each(function () {
        var t = $.trim($(this).text());
        if (t.indexOf("Подтвердили участие") !== -1) {
          confirmed = countFromParticipantLine(t, "Подтвердили участие");
          if (confirmed === null) confirmed = 0;
          if (!unitKind) unitKind = participantUnitKind(t);
        }
        if (t.indexOf("Приняты к участию") !== -1) {
          approved = countFromParticipantLine(t, "Приняты к участию");
          if (approved === null) approved = 0;
          if (!unitKind) unitKind = participantUnitKind(t);
        }
      });

      if (confirmed === null && approved === null) {
        return { text: "—", html: "—" };
      }

      var total = (confirmed || 0) + (approved || 0);
      var label = formatParticipantTotal(total, unitKind || "players");
      return { text: label, html: escapeHtml(label) };
    }

    function parseTimeLeft($table, canEnter, listKind) {
      var $label = $table.find("span.title").filter(function () {
        return $(this).text().indexOf("Времени осталось") !== -1;
      });
      if ($label.length) {
        var $cell = $label.first().parent();
        var $timer = $cell.find('span[id^="TimerText"]').first();
        if (!$timer.length) {
          $timer = $label.first().next().find("span").first();
        }
        if ($timer.length) {
          var tid = $timer.attr("id") || "";
          var txt = shortTimeLeft($timer.text());
          if (txt) return { text: txt, timerId: tid };
        }
      }
      if (listKind === "active") return { text: "игра уже началась", timerId: "" };
      if (canEnter) return { text: "скоро старт", timerId: "" };
      return { text: "", timerId: "" };
    }

    function parseFee($table) {
      var $feeTitle = $table.find("span.title").filter(function () {
        return $(this).text().indexOf("Взнос") !== -1;
      });
      if ($feeTitle.length) {
        var $row = $feeTitle.first().parent();
        var amount = $.trim($row.find("span.aqua").first().text());
        var cur = $.trim($row.find('[id*="lblFeeType"]').first().text());
        if (amount) return amount + (cur ? " " + cur : "");
      }
      var $aqua = $table.find(".aqua.padL3").first();
      if ($aqua.length) {
        var cur2 = $table.find('[id*="lblFeeType"]').first().text();
        return $.trim($aqua.text()) + (cur2 ? " " + cur2 : "");
      }
      if ($table.text().toLowerCase().indexOf("бесплатн") !== -1) return "бесплатно";
      return "—";
    }

    function parseGameFromTable($table, listKind) {
      /* Не использовать a#lnkGameTitle — на странице много одинаковых ID */
      var $title = $table.find('a[href*="GameDetails.aspx?gid="]').first();
      if (!$title.length) return null;

      var href = $title.attr("href") || "";
      var gidM = href.match(/gid=(\d+)/i);
      var gid = gidM ? gidM[1] : "";
      var title = $.trim($title.text()).replace(/^["\s]+|["\s]+$/g, "");

      var $typeImg = $table.find('img[src*="/type."]').first();
      var zoneM = ($typeImg.attr("src") || "").match(/type\.(\d+)/i);
      var zone = zoneM ? parseInt(zoneM[1], 10) : 0;

      var typeName = $.trim($table.find('[id*="lblGameTypeName"]').first().text());
      if (!typeName && $typeImg.length) typeName = $typeImg.attr("alt") || "";

      var authorData = parseAuthors($table);
      var participantsData = parseParticipants($table);

      var num = "";
      var numEl = $table.find(".gold19").first().text();
      if (numEl) num = (String(numEl).match(/(\d+)/) || [])[1] || "";

      var start = textAfterTitle($table, "Начало игры");
      if (!start) start = textAfterTitle($table, "Начало");

      var playUrl = canShowEnterButton($table, listKind);
      var timeData = parseTimeLeft($table, playUrl, listKind);
      var status =
        listKind === "coming"
          ? playUrl
            ? "live"
            : "upcoming"
          : playUrl
            ? "live"
            : "active";

      return {
        id: gid,
        num: num,
        title: title,
        zone: zone,
        typeName: typeName,
        mode: isVirtualZone(zone) ? "virtual" : "real",
        listKind: listKind,
        status: status,
        start: start || "—",
        fee: parseFee($table),
        authors: authorData.text,
        authorsHtml: authorData.html,
        participants: participantsData.text,
        participantsHtml: participantsData.html,
        timeLeft: timeData.text,
        timerId: timeData.timerId,
        url: href,
        playUrl: playUrl,
        icon: iconUrl(zone),
        poster: null
      };
    }

    function collectGames() {
      var games = [];
      var seen = {};

      function addFrom($root, kind) {
        if (!$root.length) return;
        $root.find("table.gameInfo").each(function () {
          var g = parseGameFromTable($(this), kind);
          if (!g || !g.id || seen[g.id]) return;
          seen[g.id] = true;
          games.push(g);
        });
      }

      addFrom($active, "active");
      addFrom($coming, "coming");
      return games;
    }

    if (hasHub) {
      ensureGrids();
    }

    var games = collectGames();
    if (hasHub && !games.length) {
      $("#kvGamesHub").addClass("kv-hub--empty");
    }

    var filters = {
      live: function (g) {
        return !!g.playUrl;
      },
      season: function (g) {
        return isGameInSeason(g);
      },
      upcoming: function (g) {
        return g.status === "upcoming";
      },
      real: function (g) {
        return g.mode === "real";
      },
      virtual: function (g) {
        return g.mode === "virtual";
      },
      all: function () {
        return true;
      }
    };

    function timerSpanHtml(g) {
      if (!g.timeLeft) return "—";
      if (g.timerId) {
        return (
          '<span class="kv-timer-live" data-timer-src="' +
          escapeHtml(g.timerId) +
          '">' +
          escapeHtml(g.timeLeft) +
          "</span>"
        );
      }
      return escapeHtml(g.timeLeft);
    }

    function cardHtml(g) {
      var inSeason = isGameInSeason(g);
      var ph = g.mode === "virtual" ? "&#129504;" : "&#128205;";
      var h = [];
      h.push(
        '<li class="kv-game-card' +
          (inSeason ? " kv-game-card--season" : "") +
          '" data-zone="' +
          g.zone +
          '" data-gid="' +
          escapeHtml(g.id) +
          '">'
      );
      if (g.poster) {
        h.push('<div class="kv-thumb-wrap kv-thumb-wrap--has-poster">');
        h.push(
          '<img class="kv-game-card__thumb" src="' +
            String(g.poster).replace(/"/g, "&quot;") +
            '" alt="" loading="lazy" />'
        );
        h.push("</div>");
      } else {
        h.push(
          '<div class="kv-thumb-wrap kv-thumb-wrap--ph"><div class="kv-game-card__thumb kv-game-card__thumb--ph" aria-hidden="true">' +
            ph +
            "</div></div>"
        );
      }
      h.push('<div class="kv-game-card__head">');
      h.push('<span class="kv-type-badge" data-zone="' + g.zone + '"><img src="' + g.icon + '" width="16" height="16" alt="" /> ' + escapeHtml(g.typeName) + "</span>");
      if (g.listKind === "active") h.push(' <span class="kv-badge kv-badge--live">идёт</span>');
      if (inSeason) h.push(' <span class="kv-badge kv-badge--season">сезон</span>');
      h.push("</div>");
      h.push('<h3 class="kv-game-card__title"><a href="' + g.url + '">' + escapeHtml(g.title) + "</a></h3>");
      h.push('<dl class="kv-game-card__facts">');
      h.push("<dt>Начало</dt><dd>" + escapeHtml(g.start) + "</dd>");
      h.push("<dt>Взнос</dt><dd><strong>" + escapeHtml(g.fee) + "</strong></dd>");
      h.push("<dt>Авторы</dt><dd>" + g.authorsHtml + "</dd>");
      h.push("<dt>Участники</dt><dd class=\"kv-participants\">" + g.participantsHtml + "</dd>");
      h.push("</dl>");
      h.push('<div class="kv-game-card__actions">');
      if (g.playUrl) {
        h.push(
          '<a class="kv-btn kv-btn--primary kv-btn-enter" href="' +
            g.playUrl +
            '">Вход в игру</a> '
        );
      }
      h.push('<a class="kv-btn kv-btn--ghost" href="' + g.url + '">Подробнее</a></div></li>');
      return h.join("");
    }

    function fillGrid(id, list) {
      var html = "", i;
      for (i = 0; i < list.length; i++) html += cardHtml(list[i]);
      var $g = $("#" + id);
      if ($g.length) $g.html(html);
    }

    function count(key) {
      var n = 0, i;
      for (i = 0; i < games.length; i++) if (filters[key](games[i])) n++;
      return n;
    }

    var seasonCfg = getActiveSeason();
    if (seasonCfg) {
      $("#kv-season-block-title").text(seasonCfg.name);
      $("#kv-chip-reglement").attr("href", seasonCfg.reglementUrl);
      $("#kv-chip-standings").attr("href", seasonCfg.standingsUrl);
      $("#kv-tab-season-label").text("Сезон");
    }

    if (hasHub && games.length) {
      fillGrid("kv-grid-live", $.grep(games, filters.live));
      fillGrid("kv-grid-season", $.grep(games, filters.season));
      fillGrid("kv-grid-upcoming", $.grep(games, filters.upcoming));
      fillGrid("kv-grid-real", $.grep(games, filters.real));
      fillGrid("kv-grid-virtual", $.grep(games, filters.virtual));
      fillGrid("kv-grid-all", games);

      $("[data-kv-count]").each(function () {
        var key = $(this).attr("data-kv-count");
        if (key && filters[key]) $(this).text(count(key));
      });

      if (count("live") === 0) $("#kv-empty-live").show();
      else $("#kv-empty-live").hide();
      if (count("season") === 0) $("#kv-empty-season").show();
      else $("#kv-empty-season").hide();
    }

    var TAB_MAP = ["live", "season", "upcoming", "real", "virtual", "all"];

    function showTab(key) {
      var panelId = "kv-panel-" + key;
      $(".kv-tabs button").attr("aria-selected", "false");
      $('.kv-tabs button[data-tab="' + key + '"]').attr("aria-selected", "true");
      $(".kv-tab-panel").hide().removeClass("kv-tab-panel--active");
      $("#" + panelId).show().addClass("kv-tab-panel--active");
    }

    if (hasHub) {
      $(".kv-tabs button").each(function (idx) {
        var $btn = $(this);
        if (!$btn.attr("data-tab")) $btn.attr("data-tab", TAB_MAP[idx] || "all");
        if (!$btn.attr("aria-controls")) {
          $btn.attr("aria-controls", "kv-panel-" + ($btn.attr("data-tab") || "all"));
        }
      });

      $(".kv-tabs button").unbind("click.kvgames").bind("click.kvgames", function () {
        showTab($(this).attr("data-tab") || "all");
      });
    }

    function calEmptyHtml() {
      return '<p class="kv-cal-empty">Нет запланированных игр</p>';
    }

    function calTableHtml(list, season) {
      if (!list.length) return calEmptyHtml();
      var tblCls = season ? "tblcalendar2" : "tblcalendar";
      var h =
        '<table cellspacing="1" class="' + tblCls + ' bg_light2 w100per kv-cal-table"><tbody>' +
        '<tr class="topWinnerHead"><td></td><td class="topWinners">Название игры</td>' +
        '<td class="topWinners">Автор(ы)</td><td class="topWinners">Начало игры</td>' +
        '<td class="topWinners">Осталось</td></tr>';
      var i, g, cls, timeCell;
      for (i = 0; i < list.length && i < 30; i++) {
        g = list[i];
        cls = i % 2 ? "toWinnerItem" : "toWinnerAltItem";
        timeCell = timerSpanHtml(g);
        h +=
          '<tr class="' + cls + '"><td><img src="' + g.icon + '" width="24" height="24" alt="" /></td>' +
          '<td><a href="' + g.url + '"><b>#' + escapeHtml(g.num) + " " + escapeHtml(g.title) + "</b></a></td>" +
          "<td>" + g.authorsHtml + "</td><td>" + escapeHtml(g.start) + "</td><td>" + timeCell + "</td></tr>";
      }
      h += "</tbody></table>";
      return h;
    }

    function calCardsHtml(list) {
      if (!list.length) return calEmptyHtml();
      var h = '<div class="kv-cal-cards">';
      var i, g;
      for (i = 0; i < list.length && i < 30; i++) {
        g = list[i];
        h += '<article class="kv-cal-card" data-zone="' + g.zone + '">';
        h += '<div class="kv-cal-card__head">';
        h += '<img src="' + g.icon + '" width="28" height="28" alt="" />';
        h += '<a class="kv-cal-card__title" href="' + g.url + '">#' + escapeHtml(g.num) + " " + escapeHtml(g.title) + "</a>";
        h += "</div>";
        h += '<p class="kv-cal-card__line"><span>Авторы:</span> ' + g.authorsHtml + "</p>";
        h += '<p class="kv-cal-card__line"><span>Начало:</span> ' + escapeHtml(g.start) + "</p>";
        h += '<p class="kv-cal-card__line"><span>Осталось:</span> ' + timerSpanHtml(g) + "</p>";
        h += "</article>";
      }
      h += "</div>";
      return h;
    }

    function calRenderHtml(list, season) {
      if (isMobileLayout()) {
        return "";
      }
      return calTableHtml(list, season);
    }

    var calWasMobile = null;

    function buildCalendars(force) {
      var mobile = isMobileLayout();
      if (!force && calWasMobile === mobile) {
        return;
      }
      calWasMobile = mobile;

      var $d1 = $("#divCalendar");
      var $d2 = $("#divCalendar2");
      if (mobile) {
        if ($d1.length) {
          $d1.empty();
        }
        if ($d2.length) {
          $d2.empty();
        }
        return;
      }
      var sl = [], j;
      for (j = 0; j < games.length; j++) {
        if (filters.season(games[j])) sl.push(games[j]);
      }

      /* Календарь домена на десктопе не показываем — только сезон */
      if ($d1.length) {
        $d1.empty();
      }
      if ($d2.length) {
        $d2.html(calRenderHtml(sl, true));
      }
    }

    buildCalendars(true);
    syncMobileView($);
    placeSponsorsLayout($);

    if (!window._kvResizeMobile) {
      window._kvResizeMobile = true;
      $(window).bind("resize.kvmobile", function () {
        clearTimeout(window._kvMobTimer);
        window._kvMobTimer = setTimeout(function () {
          syncMobileView($);
          buildCalendars(true);
          placeSponsorsLayout($);
        }, 200);
      });
    }

    function initKvThumbZoom() {
      var $pop = $("#kv-thumb-zoom");
      if (!$pop.length) {
        $("body").append(
          '<div id="kv-thumb-zoom" class="kv-thumb-zoom" aria-hidden="true"><img src="" alt="" /></div>'
        );
        $pop = $("#kv-thumb-zoom");
      }

      $("#kvGamesHub")
        .undelegate(".kv-thumb-wrap--has-poster", "mouseenter.kvzoom mouseleave.kvzoom")
        .delegate(".kv-thumb-wrap--has-poster", "mouseenter.kvzoom", function () {
          var src = $(this).find("img.kv-game-card__thumb").attr("src");
          if (!src) return;
          $pop.find("img").attr("src", src);
          $pop.addClass("kv-thumb-zoom--visible").attr("aria-hidden", "false");
        })
        .delegate(".kv-thumb-wrap--has-poster", "mouseleave.kvzoom", function () {
          $pop.removeClass("kv-thumb-zoom--visible").attr("aria-hidden", "true");
        });
    }

    if (hasHub) {
      initKvThumbZoom();
    }

    function findTableForGame(gid) {
      var found = null;
      $active.add($coming).find("table.gameInfo").each(function () {
        var h = $(this).find('a[href*="GameDetails.aspx?gid="]').first().attr("href") || "";
        if (h.indexOf("gid=" + gid) !== -1) {
          found = $(this);
          return false;
        }
      });
      return found;
    }

    function fillAllGrids() {
      if (!hasHub || !games.length) return;
      fillGrid("kv-grid-live", $.grep(games, filters.live));
      fillGrid("kv-grid-season", $.grep(games, filters.season));
      fillGrid("kv-grid-upcoming", $.grep(games, filters.upcoming));
      fillGrid("kv-grid-real", $.grep(games, filters.real));
      fillGrid("kv-grid-virtual", $.grep(games, filters.virtual));
      fillGrid("kv-grid-all", games);
    }

    function refreshEnterStates() {
      var i, g, $t, url, dirty = false;
      for (i = 0; i < games.length; i++) {
        g = games[i];
        $t = findTableForGame(g.id);
        if (!$t || !$t.length) continue;
        url = canShowEnterButton($t, g.listKind);
        if (url !== g.playUrl) {
          g.playUrl = url;
          g.status =
            g.listKind === "coming" ? (url ? "live" : "upcoming") : url ? "live" : "active";
          dirty = true;
        }
      }
      if (!dirty) return;
      fillGrid("kv-grid-live", $.grep(games, filters.live));
      fillGrid("kv-grid-upcoming", $.grep(games, filters.upcoming));
      fillGrid("kv-grid-all", games);
      $("[data-kv-count]").each(function () {
        var key = $(this).attr("data-kv-count");
        if (key && filters[key]) $(this).text(count(key));
      });
      if (count("live") === 0) $("#kv-empty-live").show();
      else $("#kv-empty-live").hide();
    }

    if (!window._kvTimerSync) {
      window._kvTimerSync = setInterval(function () {
        $(".kv-timer-live").each(function () {
          var srcId = $(this).attr("data-timer-src");
          if (!srcId) return;
          var $src = $("#" + srcId);
          if ($src.length) $(this).text(shortTimeLeft($src.text()));
        });
        refreshEnterStates();
      }, 1000);
    }

    if (hasHub) {
      var defaultTab = "upcoming";
      if (count("live") > 0) defaultTab = "live";
      else if (count("upcoming") === 0 && count("all") > 0) defaultTab = "all";
      showTab(defaultTab);

      refreshPostersFromAnnouncements();
      setTimeout(refreshPostersFromAnnouncements, 1500);
    }

    $active.add($coming).addClass("kv-legacy-hidden");
    if (hasHub) {
      $("body").addClass("kv-games-ready kv-home-page");
    }
    hubDone = true;
  }

  function boot() {
    ensureViewport();
    if (!window.jQuery) return;
    window.jQuery(function ($) {
      syncMobileView($);
      placeSponsorsLayout($);
      initKvGamesHub($);
    });
    window.jQuery(window).bind("load", function () {
      var $ = window.jQuery;
      syncMobileView($);
      placeSponsorsLayout($);
      initKvGamesHub($);
    });
  }

  boot();
})();

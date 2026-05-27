/**
 * Мобильная нижняя панель: главная, личное дело, баланс, команда, вход/выход, админка.
 * jQuery 1.6+, ≤768px. Ссылки из #boxUser / #adminPanelLinkDiv + кэш (на внутренних страницах
 * EN часто скрывает пункт меню текущего раздела).
 */
(function ($) {
  var MQ = "(max-width: 768px)";
  var TABBAR_ID = "kvMobileTabbar";
  var CACHE_KEY = "kvMtabbarLinksV1";
  var HOME_HREF = "/Default.aspx";

  var DEFAULT_LABELS = {
    home: "Главная",
    profile: "Личное дело",
    balance: "Баланс",
    team: "Команда",
    admin: "Админ",
    login: "Вход",
    logout: "Выход"
  };

  var ICONS = {
    home:
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z"/></svg>',
    profile:
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6"/></svg>',
    balance:
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18"/><path d="M8 14h2M14 14h2"/></svg>',
    team:
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><circle cx="9" cy="9" r="2.5"/><circle cx="16" cy="10" r="2"/><path d="M4 19c0-2.5 2.2-4 5-4"/><path d="M13 19c0-2 1.6-3.5 3.5-3.5S20 17 20 19"/></svg>',
    login:
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"/><path d="M14 12H4M18 8l4 4-4 4"/></svg>',
    logout:
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 12H20M6 8l-4 4 4 4"/></svg>',
    admin:
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg>'
  };

  function loadCache() {
    var raw;
    try {
      if (window.sessionStorage) {
        raw = sessionStorage.getItem(CACHE_KEY);
        if (raw) {
          return JSON.parse(raw);
        }
      }
    } catch (e1) {}
    return window.kvMtabbarLinkCache || {};
  }

  function saveCache(data) {
    window.kvMtabbarLinkCache = data;
    try {
      if (window.sessionStorage) {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
      }
    } catch (e2) {}
  }

  function isMobile() {
    return window.matchMedia && window.matchMedia(MQ).matches;
  }

  function normHref(href) {
    var h = String(href || "").split("#")[0].split("?")[0].toLowerCase();
    if (h && h.charAt(0) !== "/") {
      h = "/" + h;
    }
    return h;
  }

  function isHomePage() {
    var path = normHref(location.pathname || "");
    return (
      path === "/" ||
      path === "/default.aspx" ||
      path.indexOf("/home.aspx") >= 0
    );
  }

  function isCurrentPage(href) {
    var path = normHref(location.pathname || "");
    var target = normHref(href);
    if (!target) {
      return false;
    }
    if (target === "/default.aspx" && isHomePage()) {
      return true;
    }
    if (path === target) {
      return true;
    }
    var base = target.replace(/\.aspx$/i, "");
    if (base.length > 1 && path.indexOf(base) >= 0) {
      return true;
    }
    return false;
  }

  function pickLink($root, matchers) {
    var i;
    var $found = $();
    if (!$root || !$root.length) {
      return $found;
    }
    $root.find("a[href]").each(function () {
      var href = String($(this).attr("href") || "");
      var low = href.toLowerCase();
      for (i = 0; i < matchers.length; i++) {
        if (matchers[i](href, low, this)) {
          $found = $(this);
          return false;
        }
      }
    });
    return $found;
  }

  function searchRoots($box) {
    var $left = $("#tdContentLeft");
    var roots = [];
    if ($box && $box.length) {
      roots.push($box);
    }
    if ($left.length) {
      roots.push($left);
    }
    return roots;
  }

  function findInRoots(roots, finder) {
    var i;
    var $link;
    for (i = 0; i < roots.length; i++) {
      $link = finder(roots[i]);
      if ($link.length) {
        return $link;
      }
    }
    return $();
  }

  function isGuest($box) {
    if ($box.hasClass("kv-box-guest")) {
      return true;
    }
    return (
      findInRoots(searchRoots($box), findLoginLink).length > 0 &&
      findInRoots(searchRoots($box), findProfileLink).length === 0
    );
  }

  function findProfileLink($root) {
    return pickLink($root, [
      function (href, low) {
        return low.indexOf("userdetails.aspx") >= 0;
      }
    ]);
  }

  function findBalanceLink($root) {
    return pickLink($root, [
      function (href, low) {
        return low.indexOf("userbalance.aspx") >= 0;
      }
    ]);
  }

  function findTeamLink($root) {
    return pickLink($root, [
      function (href, low) {
        return low.indexOf("teamdetails") >= 0;
      }
    ]);
  }

  function findLoginLink($root) {
    return pickLink($root, [
      function (href, low) {
        return low.indexOf("/login.aspx") >= 0 && low.indexOf("logout") < 0;
      }
    ]);
  }

  function findLogoutLink($root) {
    return pickLink($root, [
      function (href, low) {
        return low.indexOf("logout") >= 0;
      }
    ]);
  }

  function findAdminLink() {
    var $div = $("#adminPanelLinkDiv");
    if (!$div.length) {
      return $();
    }
    var $link = pickLink($div, [
      function (href, low) {
        if (low.indexOf("dblrarrow") >= 0 || low.indexOf("javascript:") === 0) {
          return false;
        }
        return (
          low.indexOf("administration") >= 0 ||
          low.indexOf("domainadmin") >= 0 ||
          (low.indexOf("/admin") >= 0 && low.indexOf("addons") < 0)
        );
      }
    ]);
    if ($link.length) {
      return $link;
    }
    return pickLink($div, [
      function (href, low, el) {
        if (low.indexOf("javascript:") === 0) {
          return false;
        }
        var text = String($(el).text() || "").toLowerCase();
        return text.indexOf("админ") >= 0 || text.indexOf("организ") >= 0;
      }
    ]);
  }

  function linkLabel($a, fallback) {
    var t = $.trim(String($a.text() || ""));
    t = t.replace(/\s+/g, " ");
    if (!t || t.length > 24) {
      return fallback;
    }
    return t;
  }

  function currentPageHref() {
    return (location.pathname || "/") + (location.search || "");
  }

  function pageHrefIf(matchSubstr) {
    var path = (location.pathname || "").toLowerCase();
    if (path.indexOf(matchSubstr) >= 0) {
      return currentPageHref();
    }
    return "";
  }

  function storeLink(cache, key, $a, fallbackLabel) {
    if (!$a || !$a.length) {
      return;
    }
    var href = String($a.attr("href") || "");
    if (!href || href.toLowerCase().indexOf("javascript:") === 0) {
      return;
    }
    cache[key] = {
      href: href,
      label: linkLabel($a, fallbackLabel)
    };
  }

  function resolveItem(cache, key, $a, fallbackLabel, pageMatch) {
    storeLink(cache, key, $a, fallbackLabel);
    if (cache[key] && cache[key].href) {
      return cache[key];
    }
    if (pageMatch) {
      var selfHref = pageHrefIf(pageMatch);
      if (selfHref) {
        return { href: selfHref, label: fallbackLabel };
      }
    }
    return null;
  }

  function makeTab(href, label, iconKey, extraClass) {
    var cls = "kv-mtabbar__item";
    if (extraClass) {
      cls += " " + extraClass;
    }
    if (isCurrentPage(href)) {
      cls += " kv-mtabbar__item--active";
    }
    return (
      '<a class="' +
      cls +
      '" href="' +
      String(href).replace(/"/g, "&quot;") +
      '">' +
      '<span class="kv-mtabbar__icon">' +
      (ICONS[iconKey] || "") +
      "</span>" +
      '<span class="kv-mtabbar__label">' +
      label +
      "</span>" +
      "</a>"
    );
  }

  function removeTabbar() {
    $("#" + TABBAR_ID).remove();
    $("html").removeClass("kv-tabbar-on");
    $("body").removeClass("kv-tabbar-on kv-tabbar-guest");
  }

  function buildTabbar() {
    var $box = $("#boxUser");
    var roots = searchRoots($box);
    var cache = loadCache();
    var parts = [];
    var guest;
    var item;

    parts.push(
      makeTab(HOME_HREF, DEFAULT_LABELS.home, "home", "kv-mtabbar__item--home")
    );

    if (!$box.length && !cache.profile && !cache.login) {
      if (parts.length) {
        var htmlOnly =
          '<nav id="' +
          TABBAR_ID +
          '" class="kv-mtabbar" role="navigation" aria-label="Навигация">' +
          '<div class="kv-mtabbar__inner">' +
          parts.join("") +
          "</div></nav>";
        $("#" + TABBAR_ID).replaceWith(htmlOnly);
        if (!$("#" + TABBAR_ID).length) {
          $("body").append(htmlOnly);
        }
        $("html").addClass("kv-tabbar-on");
        $("body").addClass("kv-tabbar-on");
      } else {
        removeTabbar();
      }
      return;
    }

    guest = $box.length ? isGuest($box) : !cache.profile && !!cache.login;

    if (guest) {
      item = resolveItem(
        cache,
        "login",
        findInRoots(roots, findLoginLink),
        DEFAULT_LABELS.login
      );
      if (item) {
        parts.push(
          makeTab(
            item.href,
            item.label,
            "login",
            "kv-mtabbar__item--accent"
          )
        );
      }
    } else {
      item = resolveItem(
        cache,
        "profile",
        findInRoots(roots, findProfileLink),
        DEFAULT_LABELS.profile,
        "userdetails"
      );
      if (item) {
        parts.push(makeTab(item.href, item.label, "profile"));
      }

      item = resolveItem(
        cache,
        "balance",
        findInRoots(roots, findBalanceLink),
        DEFAULT_LABELS.balance,
        "userbalance"
      );
      if (item) {
        parts.push(makeTab(item.href, item.label, "balance"));
      }

      item = resolveItem(
        cache,
        "team",
        findInRoots(roots, findTeamLink),
        DEFAULT_LABELS.team,
        "teamdetails"
      );
      if (item) {
        parts.push(makeTab(item.href, item.label, "team"));
      }

      storeLink(cache, "admin", findAdminLink(), DEFAULT_LABELS.admin);
      if (cache.admin && cache.admin.href) {
        parts.push(
          makeTab(
            cache.admin.href,
            cache.admin.label,
            "admin",
            "kv-mtabbar__item--admin"
          )
        );
      }

      item = resolveItem(
        cache,
        "logout",
        findInRoots(roots, findLogoutLink),
        DEFAULT_LABELS.logout
      );
      if (item) {
        parts.push(
          makeTab(
            item.href,
            item.label,
            "logout",
            "kv-mtabbar__item--logout"
          )
        );
      }
    }

    saveCache(cache);

    if (!parts.length) {
      removeTabbar();
      return;
    }

    var html =
      '<nav id="' +
      TABBAR_ID +
      '" class="kv-mtabbar" role="navigation" aria-label="Навигация">' +
      '<div class="kv-mtabbar__inner">' +
      parts.join("") +
      "</div></nav>";

    if ($("#" + TABBAR_ID).length) {
      $("#" + TABBAR_ID).replaceWith(html);
    } else {
      $("body").append(html);
    }

    $("html").addClass("kv-tabbar-on");
    $("body").addClass("kv-tabbar-on");
    if (guest) {
      $("body").addClass("kv-tabbar-guest");
    } else {
      $("body").removeClass("kv-tabbar-guest");
    }
  }

  function refresh() {
    if (!isMobile()) {
      removeTabbar();
      return;
    }
    buildTabbar();
  }

  $(function () {
    refresh();
    setTimeout(refresh, 250);
    setTimeout(refresh, 1000);
    $(window).bind("resize.kvtabbar load.kvtabbar", refresh);
  });
})(jQuery);

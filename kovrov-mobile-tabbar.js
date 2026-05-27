/**
 * Мобильная нижняя панель: личное дело, баланс, команда, вход/выход, админка.
 * jQuery 1.6+, ≤768px. Ссылки берутся из #boxUser и #adminPanelLinkDiv.
 */
(function ($) {
  var MQ = "(max-width: 768px)";
  var TABBAR_ID = "kvMobileTabbar";

  var ICONS = {
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

  function isCurrentPage(href) {
    var path = normHref(location.pathname || "");
    var target = normHref(href);
    if (!target) {
      return false;
    }
    if (path === target) {
      return true;
    }
    var base = target.replace(/\.aspx$/i, "");
    return path.indexOf(base) >= 0;
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

  function isGuest($box) {
    if ($box.hasClass("kv-box-guest")) {
      return true;
    }
    return pickLink($box, [
      function (href, low) {
        return low.indexOf("/login.aspx") >= 0 && low.indexOf("logout") < 0;
      }
    ]).length > 0;
  }

  function findProfileLink($box) {
    return pickLink($box, [
      function (href, low) {
        return low.indexOf("userdetails.aspx") >= 0;
      }
    ]);
  }

  function findBalanceLink($box) {
    return pickLink($box, [
      function (href, low) {
        return low.indexOf("userbalance.aspx") >= 0;
      }
    ]);
  }

  function findTeamLink($box) {
    return pickLink($box, [
      function (href, low) {
        return low.indexOf("teamdetails") >= 0;
      }
    ]);
  }

  function findLoginLink($box) {
    return pickLink($box, [
      function (href, low) {
        return low.indexOf("/login.aspx") >= 0 && low.indexOf("logout") < 0;
      }
    ]);
  }

  function findLogoutLink($box) {
    return pickLink($box, [
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
      href.replace(/"/g, "&quot;") +
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
    $("body").removeClass("kv-tabbar-on");
  }

  function buildTabbar() {
    var $box = $("#boxUser");
    if (!$box.length) {
      removeTabbar();
      return;
    }

    var guest = isGuest($box);
    var parts = [];
    var $profile,
      $balance,
      $team,
      $logout,
      $login,
      $admin;

    if (guest) {
      $login = findLoginLink($box);
      if ($login.length) {
        parts.push(
          makeTab(
            $login.attr("href"),
            linkLabel($login, "Вход"),
            "login",
            "kv-mtabbar__item--accent"
          )
        );
      }
    } else {
      $profile = findProfileLink($box);
      $balance = findBalanceLink($box);
      $team = findTeamLink($box);
      $logout = findLogoutLink($box);
      $admin = findAdminLink();

      if ($profile.length) {
        parts.push(
          makeTab(
            $profile.attr("href"),
            linkLabel($profile, "Личное дело"),
            "profile"
          )
        );
      }
      if ($balance.length) {
        parts.push(
          makeTab(
            $balance.attr("href"),
            linkLabel($balance, "Баланс"),
            "balance"
          )
        );
      }
      if ($team.length) {
        parts.push(
          makeTab($team.attr("href"), linkLabel($team, "Команда"), "team")
        );
      }
      if ($admin.length) {
        parts.push(
          makeTab(
            $admin.attr("href"),
            linkLabel($admin, "Админ"),
            "admin",
            "kv-mtabbar__item--admin"
          )
        );
      }
      if ($logout.length) {
        parts.push(
          makeTab(
            $logout.attr("href"),
            linkLabel($logout, "Выход"),
            "logout",
            "kv-mtabbar__item--logout"
          )
        );
      }
    }

    if (!parts.length) {
      removeTabbar();
      return;
    }

    var html =
      '<nav id="' +
      TABBAR_ID +
      '" class="kv-mtabbar" role="navigation" aria-label="Личный кабинет">' +
      '<div class="kv-mtabbar__inner">' +
      parts.join("") +
      "</div></nav>";

    var $bar = $("#" + TABBAR_ID);
    if ($bar.length) {
      $bar.replaceWith(html);
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

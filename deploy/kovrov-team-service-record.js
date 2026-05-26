/**
 * Послужной список (команда + личное дело): убрать «Загрузка…», сворачивание >>.
 * jQuery 1.6 — delegate; работает с table > tr без tbody.
 */
jQuery(function ($) {
  var SR_SEL = "td:nth-child(2) a";
  var tabBound = false;
  var ajaxBound = false;
  var scrubTimer = null;

  function isServiceRecordPage() {
    var path = (location.pathname || "").toLowerCase();
    if (/teamdetails/i.test(path) && $("body").hasClass("kv-page-team")) {
      return true;
    }
    if (/userdetails/i.test(path) && $("body").hasClass("kv-page-user")) {
      return true;
    }
    return false;
  }

  function topLevelServiceTables() {
    var out = [];
    $("#tdContentCenter .tabContent table.bg_light2").each(function () {
      var el = this;
      if ($(el).parents("table.bg_light2").length > 1) return;
      out.push(el);
    });
    return out;
  }

  function directRows($table) {
    var $body = $table.children("tbody");
    if ($body.length) return $body.children("tr");
    return $table.children("tr");
  }

  function isLoadingText(text) {
    var t = $.trim(String(text || "").replace(/\s+/g, " "));
    return t.length > 0 && t.length < 24 && /загрузка/i.test(t);
  }

  function isZoneRow($tr) {
    return $tr.length && $tr.find(".gameIcon").length > 0;
  }

  function getDetailRow($zone) {
    var $detail = $zone.next();
    while ($detail.length && !$detail.is("tr")) $detail = $detail.next();
    if (!$detail.length || $detail.hasClass("topWinnerHead")) return $();
    if ($detail.find(".gameIcon").length) return $();
    return $detail;
  }

  function scrubCell($td) {
    if ($td.find("table").length) return false;
    if (!isLoadingText($td.text())) return false;
    $td.empty().addClass("kv-sr-loading-cell");
    var $tr = $td.closest("tr");
    $tr.addClass("kv-sr-detail kv-sr-placeholder kv-sr-loading-row").removeClass("kv-sr-open");
    $tr.css("display", "none").attr("data-kv-sr", "collapsed");
    return true;
  }

  function scrubAll() {
    if (!isServiceRecordPage()) return;

    $("#tdContentCenter .tabContent").find("td").each(function () {
      scrubCell($(this));
    });

    $(topLevelServiceTables()).each(function () {
      initTable($(this));
    });
  }

  function hideDetailRow($detail) {
    $detail
      .addClass("kv-sr-detail kv-sr-placeholder kv-sr-loading-row")
      .removeClass("kv-sr-open")
      .css("display", "none")
      .attr("data-kv-sr", "collapsed");
    $detail.find("td").each(function () {
      var $td = $(this);
      if (!$td.find("table").length && isLoadingText($td.text())) {
        scrubCell($td);
      }
    });
  }

  function showDetailRow($detail) {
    if (!$detail.find("table").length) return;
    $detail
      .addClass("kv-sr-detail kv-sr-open")
      .removeClass("kv-sr-placeholder kv-sr-loading-row")
      .css("display", "table-row")
      .attr("data-kv-sr", "expanded");
  }

  function watchForGamesTable($detail, left) {
    if (!$detail.length) return;
    scrubAll();
    if ($detail.find("table").length) {
      if ($detail.attr("data-kv-sr") !== "collapsed") {
        showDetailRow($detail);
      }
      return;
    }
    if (left <= 0) return;
    setTimeout(function () {
      watchForGamesTable($detail, left - 1);
    }, 100);
  }

  function onZoneListClick(e) {
    var $link = $(this);
    if ($link.closest(".gameIcon").length) return;
    if ($link.closest("table.bg_light2 table").length) return;

    var $zone = $link.closest("tr");
    if (!isZoneRow($zone)) return;

    var $detail = getDetailRow($zone);
    if (!$detail.length) return;

    if ($detail.attr("data-kv-sr") === "expanded") {
      if (e && e.preventDefault) e.preventDefault();
      if (e && e.stopImmediatePropagation) e.stopImmediatePropagation();
      hideDetailRow($detail);
      return false;
    }

    watchForGamesTable($detail, 50);
  }

  function initTable($table) {
    directRows($table).each(function () {
      var $zone = $(this);
      if (!isZoneRow($zone)) return;

      var $detail = getDetailRow($zone);
      if (!$detail.length) return;

      $detail.addClass("kv-sr-detail");
      $detail.find("td").each(function () {
        scrubCell($(this));
      });

      if ($detail.attr("data-kv-sr") === "expanded" && $detail.find("table").length) {
        showDetailRow($detail);
      } else {
        hideDetailRow($detail);
      }
    });
  }

  function bindTable($table) {
    if ($table.data("kvSrBound")) return;
    $table.delegate("tr:has(.gameIcon) " + SR_SEL, "click.kvSr", onZoneListClick);
    $table.data("kvSrBound", true);
  }

  function bindTabSwitch() {
    if (tabBound) return;
    $(document).delegate("#tdContentCenter table.enTab a", "click.kvSrTab", function () {
      setTimeout(scrubAll, 100);
      setTimeout(scrubAll, 500);
      setTimeout(scrubAll, 1200);
    });
    tabBound = true;
  }

  function bindAjax() {
    if (ajaxBound) return;
    $(document).ajaxComplete(function () {
      setTimeout(scrubAll, 30);
    });
    ajaxBound = true;
  }

  function startScrubLoop() {
    if (scrubTimer || !isServiceRecordPage()) return;
    var n = 0;
    scrubTimer = setInterval(function () {
      scrubAll();
      n += 1;
      if (n >= 60) {
        clearInterval(scrubTimer);
        scrubTimer = null;
      }
    }, 250);
  }

  function setup() {
    if (!isServiceRecordPage()) return;
    $(topLevelServiceTables()).each(function () {
      var $table = $(this);
      initTable($table);
      bindTable($table);
    });
  }

  bindTabSwitch();
  bindAjax();
  scrubAll();
  setup();
  setTimeout(scrubAll, 150);
  setTimeout(setup, 400);
  setTimeout(scrubAll, 1000);
  startScrubLoop();
});

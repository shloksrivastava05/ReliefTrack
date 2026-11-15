/* ReliefTrack - script.js

   This file fills the pages with the numbers from data.js.
   Colours and spacing are NOT in here, they are all in style.css.

   Each page has an id on its <body> tag (home, alloc, progress, tx, impact)
   and the code at the bottom runs the right function for that page.
*/


/* ---------- small helper functions ---------- */

// find an element by its id
function $(id) {
  return document.getElementById(id);
}

// 12345 -> "12,345"  (Indian style grouping)
function whole(n) {
  return n.toLocaleString("en-IN");
}

// 1234.5 -> "1,234.50"
function crore(n) {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// 1234.5 -> "₹1,234.50 Cr"
function money(n) {
  return "₹" + crore(n) + " Cr";
}

// add up one column of the FUNDS table (empty cells count as 0)
function total(column) {
  var sum = 0;
  for (var i = 0; i < FUNDS.length; i++) {
    sum = sum + (FUNDS[i][column] || 0);
  }
  return sum;
}

// add up one column of the DAMAGE table
function damageTotal(column) {
  var sum = 0;
  for (var i = 0; i < DAMAGE.length; i++) {
    sum = sum + DAMAGE[i][column];
  }
  return sum;
}

// read a colour from style.css, for example chartColor(1) gives --chart-1
function chartColor(number) {
  return getComputedStyle(document.documentElement).getPropertyValue("--chart-" + number).trim();
}


/* ---------- numbers used on several pages ---------- */

var ALLOCATION_2526 = total(3);   // SDRF allocation 2025-26
var SDRF_RELEASED_2526 = total(6);   // Centre's SDRF released 2025-26
var NDRF_RELEASED_2526 = total(9);   // NDRF released 2025-26


// top 5 states by allocation, plus one "Other states" slice
function getSlices() {
  var sorted = FUNDS.slice().sort(function (a, b) { return b[3] - a[3]; });
  var top = sorted.slice(0, 5);
  var slices = [];
  var percentUsed = 0;
  var amountUsed = 0;

  for (var i = 0; i < top.length; i++) {
    var percent = Math.round(top[i][3] / ALLOCATION_2526 * 100);
    slices.push({ name: top[i][0], percent: percent, amount: top[i][3], color: i + 1, row: top[i] });
    percentUsed = percentUsed + percent;
    amountUsed = amountUsed + top[i][3];
  }

  slices.push({
    name: "Other " + (FUNDS.length - 5) + " states",
    percent: 100 - percentUsed,
    amount: ALLOCATION_2526 - amountUsed,
    color: 6,
    row: null
  });
  return slices;
}

// the 6 states that got the most NDRF money in 2025-26
function getTopNdrf() {
  var list = [];
  for (var i = 0; i < FUNDS.length; i++) {
    if (FUNDS[i][9] != null) {
      list.push(FUNDS[i]);
    }
  }
  list.sort(function (a, b) { return b[9] - a[9]; });
  return list.slice(0, 6);
}

// one record for every state + year + fund where money was released
function getReleases() {
  var records = [];
  for (var i = 0; i < FUNDS.length; i++) {
    for (var y = 0; y < 3; y++) {
      if (FUNDS[i][4 + y] != null) {
        records.push([FUNDS[i][0], YEARS[y], "SDRF", FUNDS[i][4 + y], "Centre’s share released"]);
      }
      if (FUNDS[i][7 + y] != null) {
        records.push([FUNDS[i][0], YEARS[y], "NDRF", FUNDS[i][7 + y], "Released from NDRF"]);
      }
    }
  }
  // newest year first, biggest amount first
  records.sort(function (a, b) {
    if (a[1] !== b[1]) {
      return a[1] < b[1] ? 1 : -1;
    }
    return b[3] - a[3];
  });
  return records;
}

// the four damage numbers used on the overview and impact pages
function getDamageStats() {
  return [
    { color: "teal",   number: DAMAGE.length,       label: "States / UTs Reporting" },
    { color: "orange", number: damageTotal(1),      label: "Lives Lost" },
    { color: "blue",   number: damageTotal(3),      label: "Houses/Huts Damaged" },
    { color: "teal",   number: damageTotal(2),      label: "Cattle Lost" }
  ];
}


/* ---------- donut chart + list (overview and allocation pages) ---------- */

function showDonut() {
  var slices = getSlices();

  // coloured ring: a CSS conic-gradient
  var parts = [];
  var start = 0;
  for (var i = 0; i < slices.length; i++) {
    var end = start + slices[i].percent;
    parts.push(chartColor(slices[i].color) + " " + start + "% " + end + "%");
    start = end;
  }
  $("donut").style.background = "conic-gradient(" + parts.join(", ") + ")";

  // text in the middle
  $("donut-total").textContent = "₹" + whole(Math.round(ALLOCATION_2526)) + " Cr";

  // list next to the donut
  var html = "";
  for (var j = 0; j < slices.length; j++) {
    html += '<div class="share-row">' +
              '<span class="share-name"><span class="dot color-' + slices[j].color + '"></span>' + slices[j].name + '</span>' +
              '<b>' + slices[j].percent + '%</b>' +
              '<em>' + money(slices[j].amount) + '</em>' +
            '</div>';
  }
  $("share-list").innerHTML = html;
}


/* ---------- OVERVIEW PAGE ---------- */

function showHome() {
  // the four number boxes
  $("v-alloc").textContent = money(ALLOCATION_2526);
  $("v-sdrf").textContent = money(SDRF_RELEASED_2526);
  $("v-ndrf").textContent = money(NDRF_RELEASED_2526);
  $("v-lives").textContent = whole(DAMAGE_TOTALS[0][1][2]);
  $("ndrf-count").textContent = countNdrfStates();

  showDonut();

  // largest NDRF releases (top 3)
  var top = getTopNdrf().slice(0, 3);
  var biggest = top[0][9];
  var html = "";
  for (var i = 0; i < top.length; i++) {
    var width = (top[i][9] / biggest * 100).toFixed(1);
    html += '<div class="ndrf-row">' +
                            '<div class="grow">' +
                '<div class="ndrf-line">' +
                  '<div><b>' + top[i][0] + '</b><small>NDRF released 2025-26</small></div>' +
                  '<b>' + money(top[i][9]) + '</b>' +
                '</div>' +
                '<div class="bar-track"><div class="bar-fill color-' + (i + 1) + '" style="width:' + width + '%"></div></div>' +
              '</div>' +
            '</div>';
  }
  $("ndrf-list").innerHTML = html;

  // table of the 5 largest releases
  var records = getReleases().slice(0, 5);
  html = "";
  for (var j = 0; j < records.length; j++) {
    html += '<tr>' +
              '<td>' + records[j][0] + '</td>' +
              '<td>' + records[j][1] + '</td>' +
              '<td>' + records[j][2] + '</td>' +
              '<td>' + money(records[j][3]) + '</td>' +
              '<td><span class="label label-ok">✓ MHA data</span></td>' +
            '</tr>';
  }
  $("table-body").innerHTML = html;

  // damage list
  var stats = getDamageStats();
  html = "";
  for (var k = 0; k < stats.length; k++) {
    html += '<div class="damage-row">' +
                            '<div><b>' + whole(stats[k].number) + '</b><small>' + stats[k].label + '</small></div>' +
            '</div>';
  }
  $("damage-list").innerHTML = html;
}

// how many states got NDRF money in 2025-26
function countNdrfStates() {
  var count = 0;
  for (var i = 0; i < FUNDS.length; i++) {
    if (FUNDS[i][9] != null) {
      count++;
    }
  }
  return count;
}


/* ---------- FUND ALLOCATION PAGE ---------- */

function showAllocation() {
  showDonut();

  // "Funds Flow" numbers
  $("flow-alloc").textContent = money(ALLOCATION_2526);
  $("flow-sdrf").textContent = money(SDRF_RELEASED_2526);
  $("flow-ndrf").textContent = money(NDRF_RELEASED_2526);

  // one box for each of the top 5 states
  var slices = getSlices();
  var biggest = slices[0].amount;
  var html = "";
  for (var i = 0; i < slices.length; i++) {
    var s = slices[i];
    if (s.row == null) {
      continue;   // skip the "Other states" slice
    }
    var ndrf = s.row[9] != null ? crore(s.row[9]) : "0.00";
    html += '<div class="box state-card">' +
              '<div class="state-head">' +
                '<div class="state-name"><span class="dot color-' + s.color + '"></span>' + s.name + '</div>' +
                '<div class="state-percent">' + s.percent + '%</div>' +
              '</div>' +
              '<div class="state-amount">₹' + crore(s.amount) + ' Cr SDRF allocation 2025-26</div>' +
              '<div class="bar-track"><div class="bar-fill color-' + s.color + '" style="width:' + (s.amount / biggest * 100).toFixed(1) + '%"></div></div>' +
              '<div class="state-share"><span>Share of national allocation</span><span>' + s.percent + '%</span></div>' +
              '<div class="pills">' +
                '<span class="pill">Centre released ₹' + crore(s.row[6]) + ' Cr</span>' +
                '<span class="pill">NDRF ₹' + ndrf + ' Cr</span>' +
                '<span class="pill">2024-25 alloc. ₹' + crore(s.row[2]) + ' Cr</span>' +
              '</div>' +
            '</div>';
  }
  $("state-cards").innerHTML = html;
}


/* ---------- RELIEF PROGRESS PAGE ---------- */

function showProgress() {
  // one number box for each year
  for (var y = 0; y < 3; y++) {
    var ndrf = total(7 + y);
    $("v-year-" + (y + 1)).textContent = money(total(4 + y));
    $("n-year-" + (y + 1)).textContent = "NDRF " + (ndrf ? money(ndrf) : "none");
  }

  // one box for each of the top 6 NDRF states
  var top = getTopNdrf();
  var biggest = top[0][9];
  var html = "";
  for (var i = 0; i < top.length; i++) {
    var row = top[i];
    var threeYears = (row[7] || 0) + (row[8] || 0) + (row[9] || 0);
    html += '<div class="box recipient-card">' +
              '<div class="recipient-head">' +
                                '<div><div class="recipient-name">' + row[0] + '</div><small>NDRF released 2025-26</small></div>' +
              '</div>' +
              '<div class="recipient-value">' +
                '<b>' + money(row[9]) + '</b>' +
                '<div class="bar-track"><div class="bar-fill color-' + ((i % 4) + 1) + '" style="width:' + (row[9] / biggest * 100).toFixed(1) + '%"></div></div>' +
              '</div>' +
              '<div class="meta">' +
                '<div><small>SDRF allocation 25-26</small><b>' + money(row[3]) + '</b></div>' +
                '<div><small>Centre SDRF released</small><b>' + money(row[6]) + '</b></div>' +
                '<div><small>NDRF, 3-yr total</small><b>' + money(threeYears) + '</b></div>' +
              '</div>' +
            '</div>';
  }
  $("recipient-cards").innerHTML = html;
}


/* ---------- TRANSACTIONS PAGE ---------- */

function showTransactions() {
  var records = getReleases();

  // four number boxes
  $("v-1").textContent = money(total(4) + total(5) + total(6));
  $("v-2").textContent = money(total(7) + total(8) + total(9));
  $("v-3").textContent = whole(records.length);
  $("v-4").textContent = whole(FUNDS.length);

  var fund = "all";      // which filter button is selected
  var search = "";       // what is typed in the search box

  // draw the table using the current filter and search
  function drawTable() {
    var html = "";
    var shown = 0;
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      var text = (r[0] + " " + r[1] + " " + r[2]).toLowerCase();
      if (fund !== "all" && r[2] !== fund) {
        continue;
      }
      if (search !== "" && text.indexOf(search) === -1) {
        continue;
      }
      shown++;
      html += '<tr>' +
                '<td>' + r[0] + '</td>' +
                '<td>' + r[1] + '</td>' +
                '<td>' + r[4] + '</td>' +
                '<td><span class="label label-' + r[2].toLowerCase() + '">' + r[2] + '</span></td>' +
                '<td>' + money(r[3]) + '</td>' +
                '<td><span class="label label-ok">✓ MHA / PIB</span></td>' +
              '</tr>';
    }
    if (shown === 0) {
      html = '<tr><td colspan="6" class="empty">No records match your search.</td></tr>';
    }
    $("table-body").innerHTML = html;
    $("table-count").textContent = "Showing " + shown + " of " + records.length + " release records";
  }

  // typing in the search box
  $("search").addEventListener("input", function () {
    search = this.value.trim().toLowerCase();
    drawTable();
  });

  // clicking All / SDRF / NDRF
  var buttons = document.querySelectorAll(".filter-button");
  for (var b = 0; b < buttons.length; b++) {
    buttons[b].addEventListener("click", function () {
      for (var k = 0; k < buttons.length; k++) {
        buttons[k].classList.remove("active");
      }
      this.classList.add("active");
      fund = this.getAttribute("data-fund");
      drawTable();
    });
  }

  drawTable();
}


/* ---------- IMPACT PAGE ---------- */

function showImpact() {
  // four number boxes
  var stats = getDamageStats();
  for (var i = 0; i < stats.length; i++) {
    $("v-" + (i + 1)).textContent = whole(stats[i].number);
  }

  // national damage by year
  var html = "";
  for (var r = 0; r < DAMAGE_TOTALS.length; r++) {
    var row = DAMAGE_TOTALS[r];
    html += '<div class="year-row"><div><b>' + row[0] + '</b></div>';
    for (var y = 0; y < 3; y++) {
      html += '<div><small>' + YEARS[y] + '</small><b>' + whole(row[1][y]) + '</b></div>';
    }
    html += '</div>';
  }
  $("year-list").innerHTML = html;

  // top 12 states by houses damaged
  var sorted = DAMAGE.slice().sort(function (a, b) { return b[3] - a[3]; }).slice(0, 12);
  var biggest = sorted[0][3];
  html = "";
  for (var s = 0; s < sorted.length; s++) {
    var d = sorted[s];
    html += '<div class="state-row">' +
              '<div><b>' + d[0] + '</b><small>' + whole(d[1]) + ' lives lost · ' + whole(d[2]) + ' cattle lost</small></div>' +
              '<div class="bar-track"><div class="bar-fill color-1" style="width:' + (d[3] / biggest * 100).toFixed(1) + '%"></div></div>' +
              '<b>' + whole(d[3]) + '</b>' +
            '</div>';
  }
  $("house-list").innerHTML = html;
}


/* ---------- top bar: menu button and dark mode button ---------- */

var SVG_OPEN = '<svg class="theme-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
var MOON_ICON = SVG_OPEN + '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
var SUN_ICON = SVG_OPEN + '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';

function setupTopbar() {
  // menu button (only visible on phones)
  $("menu-button").addEventListener("click", function () {
    $("nav").classList.toggle("open");
  });

  // dark / light mode
  var theme = "light";
  try {
    if (localStorage.getItem("reliefTrackTheme") === "dark") {
      theme = "dark";
    }
  } catch (e) {}

  function applyTheme() {
    document.documentElement.setAttribute("data-theme", theme);
    $("theme-button").innerHTML = theme === "dark" ? SUN_ICON : MOON_ICON;
  }
  applyTheme();

  $("theme-button").addEventListener("click", function () {
    theme = theme === "dark" ? "light" : "dark";
    applyTheme();
    try {
      localStorage.setItem("reliefTrackTheme", theme);
    } catch (e) {}
    // the donut reads its colours from the CSS, so draw it again
    if ($("donut")) {
      showDonut();
    }
  });
}


/* ---------- start: run the code for the page we are on ---------- */

setupTopbar();

var page = document.body.id;

if (page === "home") {
  showHome();
} else if (page === "alloc") {
  showAllocation();
} else if (page === "progress") {
  showProgress();
} else if (page === "tx") {
  showTransactions();
} else if (page === "impact") {
  showImpact();
}


/* =====================================================================
   SCROLL ANIMATIONS
   - boxes, headings and the footer fade + slide up when scrolled into view
   - numbers count up, bars grow, the donut spins in
   - progress bar at the top, topbar shadow, back-to-top button
   Remove this block (and Part 6 of style.css) to switch it all off.
   ===================================================================== */

(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasObserver = "IntersectionObserver" in window;

  // ---- count a number up from 0, keeping its prefix/suffix (₹, Cr, %) ----
  function countUp(el) {
    var original = el.textContent;
    var match = original.match(/[\d,]+(\.\d+)?/);
    if (!match || reduce) { return; }
    var decimals = match[1] ? match[1].length - 1 : 0;
    var target = parseFloat(match[0].replace(/,/g, ""));
    var before = original.slice(0, match.index);
    var after = original.slice(match.index + match[0].length);
    var duration = 1400;
    var start = null;

    function frame(now) {
      if (start === null) { start = now; }
      var t = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 4);
      var value = target * eased;
      el.textContent = before + value.toLocaleString("en-IN", {
        minimumFractionDigits: decimals, maximumFractionDigits: decimals
      }) + after;
      if (t < 1) { requestAnimationFrame(frame); } else { el.textContent = original; }
    }
    requestAnimationFrame(frame);
  }

  // ---- bars: remember the real width, start at 0, grow when visible ----
  function prepareBars(scope) {
    var bars = scope.querySelectorAll(".bar-fill");
    for (var i = 0; i < bars.length; i++) {
      if (bars[i].getAttribute("data-w") === null) {
        bars[i].setAttribute("data-w", bars[i].style.width);
        bars[i].style.width = "0%";
      }
    }
  }
  function growBars(scope) {
    var bars = scope.querySelectorAll(".bar-fill");
    for (var i = 0; i < bars.length; i++) {
      bars[i].style.setProperty("--bar-delay", (i * 90 + 250) + "ms");
      bars[i].style.width = bars[i].getAttribute("data-w") || bars[i].style.width;
    }
  }

  // ---- decide what reveals, and in which order ----
  var targets = [];
  function add(list, extraClass) {
    for (var i = 0; i < list.length; i++) {
      if (targets.indexOf(list[i]) === -1) {
        list[i].classList.add("reveal");
        if (extraClass) { list[i].classList.add(extraClass); }
        targets.push(list[i]);
      }
    }
  }

  var main = document.querySelector("main");
  if (main) {
    add(main.querySelectorAll(".eyebrow, .hero h1, .hero p"));
    add(main.querySelectorAll(".tagline"), "reveal-left");
    add(main.querySelectorAll(".box, .section-title, .source-note"));
  }
  add(document.querySelectorAll(".footer .wrap"));
  var donut = $("donut");
  if (donut) { add([donut]); }

  // stagger: items that share a parent get a small delay one after another
  var seen = [];
  var counts = [];
  for (var i = 0; i < targets.length; i++) {
    var parent = targets[i].parentNode;
    var idx = seen.indexOf(parent);
    if (idx === -1) { seen.push(parent); counts.push(0); idx = seen.length - 1; }
    targets[i].style.setProperty("--d", (counts[idx] * 110) + "ms");
    counts[idx]++;
  }
  // the hero text is a vertical stack, so stagger it a bit more
  var heroBits = document.querySelectorAll(".hero .eyebrow, .hero h1, .hero p");
  for (var h = 0; h < heroBits.length; h++) {
    heroBits[h].style.setProperty("--d", (h * 130) + "ms");
  }

  for (var b = 0; b < targets.length; b++) { prepareBars(targets[b]); }

  function reveal(el) {
    el.classList.add("in-view");
    growBars(el);
    var nums = el.querySelectorAll(".kpi-value, .damage-row b, .flow b, .state-percent, .donut-hole b, .year-row b");
    for (var n = 0; n < nums.length; n++) {
      if (!nums[n].getAttribute("data-counted")) {
        nums[n].setAttribute("data-counted", "1");
        countUp(nums[n]);
      }
    }
    // table rows (home / transactions) slide in one after another
    var rows = el.querySelectorAll("tbody tr");
    for (var r = 0; r < rows.length && r < 14; r++) {
      rows[r].classList.add("row-in");
      rows[r].style.setProperty("--d", (r * 50 + 150) + "ms");
    }
  }

  if (hasObserver && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      for (var e = 0; e < entries.length; e++) {
        if (entries[e].isIntersecting) {
          reveal(entries[e].target);
          io.unobserve(entries[e].target);
        }
      }
    }, { threshold: 0, rootMargin: "0px 0px -60px 0px" });
    for (var t = 0; t < targets.length; t++) { io.observe(targets[t]); }
  } else {
    for (var f = 0; f < targets.length; f++) { reveal(targets[f]); }
  }

  // ---- animate new rows when the transactions filter / search redraws the table ----
  var tbody = $("table-body");
  if (tbody && document.body.id === "tx" && !reduce) {
    new MutationObserver(function () {
      var rows = tbody.querySelectorAll("tr");
      for (var r = 0; r < rows.length && r < 14; r++) {
        rows[r].classList.add("row-in");
        rows[r].style.setProperty("--d", (r * 30) + "ms");
      }
    }).observe(tbody, { childList: true });
  }

  // ---- progress bar, topbar shadow, back-to-top ----
  var progress = document.createElement("div");
  progress.id = "scroll-progress";
  document.body.appendChild(progress);

  var toTop = document.createElement("button");
  toTop.id = "to-top";
  toTop.type = "button";
  toTop.title = "Back to top";
  toTop.setAttribute("aria-label", "Back to top");
  toTop.textContent = "↑";
  toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  });
  document.body.appendChild(toTop);

  var topbar = document.querySelector(".topbar");
  var ticking = false;
  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = "scaleX(" + (max > 0 ? Math.min(y / max, 1) : 0) + ")";
    if (topbar) { topbar.classList.toggle("scrolled", y > 10); }
    toTop.classList.toggle("show", y > 500);
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();
})();

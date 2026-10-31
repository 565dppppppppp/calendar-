(function () {
  var KEY = "pulse-calendar-events";
  var store = {};
  try {
    store = JSON.parse(localStorage.getItem(KEY) || "null") || {};
  } catch (e) {
    store = {};
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(store));
    } catch (e) {}
  }
  function pad(n) {
    return String(n).padStart(2, "0");
  }
  function key(y, m, d) {
    return y + "-" + pad(m + 1) + "-" + pad(d);
  }

  var now = new Date(),
    view = new Date(now.getFullYear(), now.getMonth(), 1),
    sel = key(now.getFullYear(), now.getMonth(), now.getDate());
  // Example events so the first view shows the markings. Stored like any other event and deletable.
  if (!Object.keys(store).length) {
    var t = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var a = key(t.getFullYear(), t.getMonth(), t.getDate());
    t.setDate(t.getDate() + 2);
    var b = key(t.getFullYear(), t.getMonth(), t.getDate());
    store[a] = [
      {
        id: 1,
        title: "Example: project check-in",
        time: "10:00",
        note: "Delete me or add your own.",
      },
    ];
    store[b] = [
      { id: 2, title: "Example: submit deliverables", time: "15:30", note: "" },
      { id: 3, title: "Example: team sync", time: "17:00", note: "" },
    ];
    save();
  }

  var $ = function (id) {
    return document.getElementById(id);
  };
  var MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  var DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function tick() {
    var d = new Date(),
      h = d.getHours(),
      ap = h >= 12 ? "PM" : "AM";
    $("time").innerHTML =
      pad(h % 12 || 12) +
      ":" +
      pad(d.getMinutes()) +
      ":" +
      pad(d.getSeconds()) +
      "<small>" +
      ap +
      "</small>";
    $("todayLabel").textContent = d.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }
  tick();
  setInterval(tick, 1000);

  var clickTimer = null;
  function render() {
    var y = view.getFullYear(),
      m = view.getMonth();
    $("title").textContent = MONTHS[m] + " " + y;
    var g = $("grid");
    g.innerHTML = "";
    DOW.forEach(function (n) {
      var e = document.createElement("div");
      e.className = "dow";
      e.textContent = n;
      g.appendChild(e);
    });
    var first = new Date(y, m, 1).getDay(),
      days = new Date(y, m + 1, 0).getDate();
    for (var i = 0; i < first; i++) {
      var b = document.createElement("div");
      b.className = "day blank";
      g.appendChild(b);
    }
    var todayKey = key(now.getFullYear(), now.getMonth(), now.getDate());
    for (var d = 1; d <= days; d++) {
      (function (d) {
        var k = key(y, m, d),
          dow = new Date(y, m, d).getDay(),
          n = (store[k] || []).length;
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className =
          "day" +
          (dow === 0 || dow === 6 ? " weekend" : "") +
          (k === todayKey ? " today" : "") +
          (k === sel ? " selected" : "") +
          (n ? " has" : "");
        btn.innerHTML = d + (n > 1 ? '<span class="n">' + n + "</span>" : "");
        btn.setAttribute(
          "aria-label",
          MONTHS[m] + " " + d + ", " + n + (n === 1 ? " event" : " events"),
        );
        btn.addEventListener("click", function (e) {
          if (e.detail > 1) return; // second click of a double-click
          clearTimeout(clickTimer);
          clickTimer = setTimeout(function () {
            select(k);
          }, 220);
        });
        btn.addEventListener("dblclick", function () {
          clearTimeout(clickTimer);
          select(k);
          openDialog();
        });
        g.appendChild(btn);
      })(d);
    }
    renderPanel();
  }

  function select(k) {
    sel = k;
    render();
  }
  function renderPanel() {
    var p = sel.split("-").map(Number),
      dt = new Date(p[0], p[1] - 1, p[2]);
    $("selTitle").textContent = dt.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    var list = (store[sel] || []).slice().sort(function (a, b) {
      return a.time < b.time ? -1 : 1;
    });
    $("selSub").textContent = list.length
      ? list.length + (list.length === 1 ? " event" : " events") + " scheduled"
      : "Nothing scheduled";
    var ul = $("events");
    ul.innerHTML = "";
    if (!list.length) {
      var li = document.createElement("li");
      li.className = "empty";
      li.textContent =
        "No events or reminders for this day. Double-click the date or use Add event.";
      ul.appendChild(li);
    }
    list.forEach(function (ev) {
      var li = document.createElement("li");
      li.className = "ev";
      var t = document.createElement("time");
      t.textContent = ev.time || "All day";
      var mid = document.createElement("div");
      var b = document.createElement("b");
      b.textContent = ev.title;
      mid.appendChild(b);
      if (ev.note) {
        var s = document.createElement("span");
        s.textContent = ev.note;
        mid.appendChild(s);
      }
      var del = document.createElement("button");
      del.textContent = "Delete";
      del.setAttribute("aria-label", "Delete " + ev.title);
      del.addEventListener("click", function () {
        store[sel] = store[sel].filter(function (x) {
          return x.id !== ev.id;
        });
        if (!store[sel].length) delete store[sel];
        save();
        render();
      });
      li.appendChild(t);
      li.appendChild(mid);
      li.appendChild(del);
      ul.appendChild(li);
    });
  }

  var dlg = $("dlg");
  function openDialog() {
    $("dlgTitle").textContent = "New event for " + $("selTitle").textContent;
    $("form").reset();
    $("fTime").value = "09:00";
    if (dlg.showModal) dlg.showModal();
    else dlg.setAttribute("open", "");
    $("fTitle").focus();
  }
  function closeDialog() {
    if (dlg.close) dlg.close();
    else dlg.removeAttribute("open");
  }
  $("addBtn").addEventListener("click", openDialog);
  $("cancel").addEventListener("click", closeDialog);
  $("form").addEventListener("submit", function (e) {
    e.preventDefault();
    var title = $("fTitle").value.trim();
    if (!title) return;
    (store[sel] = store[sel] || []).push({
      id: Date.now(),
      title: title,
      time: $("fTime").value,
      note: $("fNote").value.trim(),
    });
    save();
    closeDialog();
    render();
  });
  $("prev").addEventListener("click", function () {
    view = new Date(view.getFullYear(), view.getMonth() - 1, 1);
    render();
  });
  $("next").addEventListener("click", function () {
    view = new Date(view.getFullYear(), view.getMonth() + 1, 1);
    render();
  });
  $("themeBtn").addEventListener("click", function () {
    var r = document.documentElement,
      dark = r.dataset.theme
        ? r.dataset.theme === "dark"
        : matchMedia("(prefers-color-scheme: dark)").matches;
    r.dataset.theme = dark ? "light" : "dark";
  });
  render();
})();

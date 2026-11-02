(function () {
  var STORAGE_KEY = "uqu-tablet-os-v1";
  var taskEls = Array.prototype.slice.call(document.querySelectorAll(".task"));
  var tasks = taskEls.map(function (el) {
    return {
      id: el.dataset.id,
      weight: Number(el.dataset.weight),
      minutes: Number(el.dataset.minutes),
      done: el.getAttribute("aria-pressed") === "true",
      el: el
    };
  });

  var ring = document.querySelector(".ring");
  var ringValue = document.querySelector("#progress-value");
  var summary = document.querySelector("#summary");
  var cheer = document.querySelector("#cheer");
  var doneStat = document.querySelector("#done-count");
  var leftStat = document.querySelector("#left-count");
  var progressbar = document.querySelector("#progress");
  var clock = document.querySelector("#clock");
  var dateEl = document.querySelector("#today-date");
  var tweenToken = 0;

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      var saved = JSON.parse(raw);
      if (!saved || typeof saved !== "object") return false;
      var changed = false;
      tasks.forEach(function (task) {
        if (typeof saved[task.id] === "boolean" && saved[task.id] !== task.done) {
          task.done = saved[task.id];
          changed = true;
        }
      });
      return changed;
    } catch (err) {
      return false;
    }
  }

  function save() {
    var data = {};
    tasks.forEach(function (task) {
      data[task.id] = task.done;
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      /* The page still works if storage is blocked. */
    }
  }

  function percent() {
    var total = tasks.reduce(function (sum, task) { return sum + task.weight; }, 0);
    var done = tasks.reduce(function (sum, task) {
      return sum + (task.done ? task.weight : 0);
    }, 0);
    if (!total) return 0;
    return Math.round((done / total) * 100);
  }

  function nextId() {
    var pending = tasks.filter(function (task) { return !task.done; });
    if (!pending.length) return null;
    var now = new Date();
    var nowMinutes = now.getHours() * 60 + now.getMinutes();
    var upcoming = pending
      .filter(function (task) { return task.minutes >= nowMinutes; })
      .sort(function (a, b) { return a.minutes - b.minutes; });
    var pool = upcoming.length
      ? upcoming
      : pending.slice().sort(function (a, b) { return a.minutes - b.minutes; });
    return pool[0].id;
  }

  function tween(to) {
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var from = parseInt(ringValue.textContent, 10);
    if (isNaN(from)) from = 0;
    ringValue.dataset.value = String(to);
    if (reduce || from === to) {
      ringValue.textContent = to + "%";
      return;
    }
    var token = ++tweenToken;
    var start = performance.now();
    function frame(now) {
      if (token !== tweenToken) return;
      var t = Math.min(1, (now - start) / 520);
      var eased = 1 - Math.pow(1 - t, 3);
      ringValue.textContent = Math.round(from + (to - from) * eased) + "%";
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function paintTasks() {
    var nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    var upcoming = nextId();
    tasks.forEach(function (task) {
      var label = "";
      if (!task.done && task.minutes < nowMinutes) label = "late";
      else if (!task.done && task.id === upcoming) label = "next";
      task.el.classList.toggle("is-done", task.done);
      task.el.classList.toggle("is-next", label === "next");
      task.el.setAttribute("aria-pressed", task.done ? "true" : "false");
      var badge = task.el.querySelector(".task__badge");
      if (!badge) return;
      badge.hidden = label === "";
      badge.textContent = label === "late" ? "متأخر" : "التالي";
      badge.classList.toggle("is-late", label === "late");
    });
  }

  function paint() {
    var doneCount = tasks.filter(function (task) { return task.done; }).length;
    var leftCount = tasks.length - doneCount;
    var value = percent();

    paintTasks();
    summary.textContent = doneCount + " مهام مكتملة، " + leftCount + " متبقية";
    doneStat.textContent = String(doneCount);
    leftStat.textContent = String(leftCount);
    cheer.hidden = leftCount !== 0;
    ring.style.setProperty("--progress", String(value));
    progressbar.setAttribute("aria-valuenow", String(value));
    progressbar.setAttribute("aria-valuetext", value + " بالمئة مكتمل");
    tween(value);
  }

  function tick() {
    var now = new Date();
    clock.textContent = new Intl.DateTimeFormat("ar-SA", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      numberingSystem: "latn"
    }).format(now);
    clock.dateTime = now.toISOString();
    dateEl.textContent = new Intl.DateTimeFormat("ar-SA", {
      weekday: "long",
      day: "numeric",
      month: "long",
      numberingSystem: "latn"
    }).format(now);
    dateEl.dateTime = now.toISOString().slice(0, 10);
    paintTasks();
  }

  taskEls.forEach(function (el) {
    el.addEventListener("click", function () {
      var task = tasks.filter(function (item) { return item.el === el; })[0];
      task.done = !task.done;
      save();
      paint();
    });
  });

  if (load()) ring.classList.add("is-settled");
  paint();
  tick();
  setInterval(tick, 1000);
})();

(function () {
  var STORAGE_KEY = "uqu-tablet-os-v2";
  var SWATCHES = ["#0f766e", "#1d4ed8", "#7c3aed", "#be123c", "#c2410c", "#a16207", "#0e7490", "#15803d"];
  var DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"];
  var LIVE = [
    {
      id: "live-fahad",
      delay: 6500,
      from: "د. فهد الحارثي",
      course: "CS201",
      body: "أرسل هذه المهمة الآن: مراجعة شرائح محاضرة CS201 قبل بداية الحصة الجاية.",
      task: { title: "مراجعة شرائح CS201", detail: "وصلت الآن من د. فهد الحارثي", time: "18:30", weight: 15 }
    },
    {
      id: "live-sara",
      delay: 17000,
      from: "د. سارة العمري",
      course: "التصميم",
      body: "أرسلت هذه المهمة الآن: ارفع نسخة المخطط المحدّثة قبل اجتماع الفريق.",
      task: { title: "رفع مخطط التصميم", detail: "مهمة جديدة من د. سارة العمري", time: "15:30", weight: 20 }
    },
    {
      id: "live-noura",
      delay: 30000,
      from: "د. نورة السلمي",
      course: "MATH110",
      body: "أرسلت تنبيه الآن: تسليم الرياضيات صار الليلة الساعة 9:00 م.",
      task: { title: "تسليم الرياضيات الليلة", detail: "موعد محدّث من د. نورة السلمي", time: "21:00", weight: 20 }
    }
  ];

  var state = loadState();
  var view = "home";
  var askStep = 0;
  var answers = { name: "", studentId: "", color: "#0f766e" };
  var timers = [];
  var ringSeen = false;

  var stage = document.querySelector("#stage");
  var welcome = document.querySelector("#welcome");
  var hello = document.querySelector("#hello");
  var ask = document.querySelector("#ask");
  var askTitle = document.querySelector("#ask-title");
  var askNote = document.querySelector("#ask-note");
  var askProgress = document.querySelector("#ask-progress");
  var askInput = document.querySelector("#ask-input");
  var askError = document.querySelector("#ask-error");
  var askNext = document.querySelector("#ask-next");
  var askSwatches = document.querySelector("#ask-swatches");
  var askColorLine = document.querySelector("#ask-color-line");
  var askColor = document.querySelector("#ask-color");
  var shade = document.querySelector("#shade");
  var shadeList = document.querySelector("#shade-list");
  var toasts = document.querySelector("#toasts");

  function defaultState() {
    return {
      profile: { name: "", studentId: "", color: "#0f766e", onboarded: false },
      focus: "أخلّص المتبقي قبل المغرب.",
      tasks: [
        { id: "cs201", title: "محاضرة CS201", detail: "كلية الحاسب الآلي · قاعة 214", time: "08:00", weight: 20, done: true, from: "الجدول" },
        { id: "math", title: "حل تكليف الرياضيات", detail: "MATH110 · تسليم إلكتروني", time: "10:30", weight: 25, done: true, from: "د. نورة السلمي" },
        { id: "design", title: "التحضير لمشروع التصميم", detail: "مراجعة المخطط قبل الاجتماع", time: "13:00", weight: 20, done: true, from: "د. سارة العمري" },
        { id: "meet", title: "اجتماع فريق التصميم", detail: "مبنى 12 · قاعة المشروع", time: "16:00", weight: 35, done: false, from: "د. سارة العمري" }
      ],
      schedule: [
        { id: "s1", course: "CS201", title: "مقدمة برمجة", day: "الأحد", start: "08:00", end: "09:30", room: "214", doctor: "د. فهد الحارثي" },
        { id: "s2", course: "MATH110", title: "رياضيات", day: "الأحد", start: "10:30", end: "12:00", room: "B12", doctor: "د. نورة السلمي" },
        { id: "s3", course: "DSGN220", title: "مشروع التصميم", day: "الإثنين", start: "13:00", end: "14:30", room: "استوديو 3", doctor: "د. سارة العمري" },
        { id: "s4", course: "CS201", title: "معمل البرمجة", day: "الثلاثاء", start: "08:00", end: "10:00", room: "معمل 2", doctor: "د. فهد الحارثي" },
        { id: "s5", course: "TEAM", title: "اجتماع الفريق", day: "الإثنين", start: "16:00", end: "17:00", room: "مبنى 12", doctor: "د. سارة العمري" }
      ],
      messages: [
        { id: "m1", from: "د. نورة السلمي", course: "MATH110", body: "تنبيه: متبقي ساعة لتسليم تكليف الرياضيات.", time: "قبل ساعة", unread: true, kind: "sms" },
        { id: "m2", from: "د. سارة العمري", course: "التصميم", body: "اجتماع فريق التصميم الساعة 4:00 م في مبنى 12.", time: "اليوم", unread: true, kind: "sms" }
      ],
      seenLive: []
    };
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      var saved = JSON.parse(raw);
      var base = defaultState();
      if (!saved || typeof saved !== "object") return base;
      base.profile = Object.assign(base.profile, saved.profile || {});
      if (typeof saved.focus === "string") base.focus = saved.focus;
      if (Array.isArray(saved.tasks) && saved.tasks.length) base.tasks = saved.tasks;
      if (Array.isArray(saved.schedule) && saved.schedule.length) base.schedule = saved.schedule;
      if (Array.isArray(saved.messages)) base.messages = saved.messages;
      if (Array.isArray(saved.seenLive)) base.seenLive = saved.seenLive;
      return base;
    } catch (err) {
      return defaultState();
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {}
  }

  function uid(prefix) {
    return prefix + "-" + Math.random().toString(36).slice(2, 8);
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function hexToRgb(hex) {
    var clean = String(hex || "").replace("#", "");
    if (clean.length === 3) clean = clean.split("").map(function (c) { return c + c; }).join("");
    var num = parseInt(clean, 16);
    if (isNaN(num) || clean.length !== 6) return { r: 15, g: 118, b: 110 };
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  function rgbToHex(r, g, b) {
    function part(n) { return Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0"); }
    return "#" + part(r) + part(g) + part(b);
  }

  function mix(hex, target, amount) {
    var a = hexToRgb(hex);
    var b = hexToRgb(target);
    function blend(x, y) { return Math.round(x + (y - x) * amount); }
    return rgbToHex(blend(a.r, b.r), blend(a.g, b.g), blend(a.b, b.b));
  }

  function channel(value) {
    var v = value / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }

  function luminance(hex) {
    var rgb = hexToRgb(hex);
    return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
  }

  function contrast(a, b) {
    var light = Math.max(luminance(a), luminance(b));
    var dark = Math.min(luminance(a), luminance(b));
    return (light + 0.05) / (dark + 0.05);
  }

  function applyTheme(hex) {
    var color = /^#([0-9a-f]{6})$/i.test(hex) ? hex : "#0f766e";
    var header = color;
    var guard = 0;
    while (contrast(header, "#ffffff") < 4.5 && guard < 14) {
      header = mix(header, "#041614", 0.18);
      guard += 1;
    }
    var screen = document.querySelector(".screen");
    screen.style.setProperty("--accent", color);
    screen.style.setProperty("--header", header);
    screen.style.setProperty("--header-deep", mix(header, "#000000", 0.24));
    screen.style.setProperty("--accent-soft", mix(color, "#ffffff", 0.88));
    screen.style.setProperty("--on-accent", contrast(color, "#ffffff") >= 3 ? "#ffffff" : "#14221f");
    var rgb = hexToRgb(header);
    document.querySelector(".desk").style.setProperty("--glow", "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",0.4)");
    var theme = document.querySelector("meta[name=theme-color]");
    if (theme) theme.setAttribute("content", header);
  }

  function todayName() {
    return ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"][new Date().getDay()];
  }

  function minutesNow() {
    var now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }

  function toMinutes(value) {
    var parts = String(value || "00:00").split(":");
    return (Number(parts[0]) || 0) * 60 + (Number(parts[1]) || 0);
  }

  function formatTime(value) {
    var parts = String(value || "00:00").split(":");
    var hour = Number(parts[0]) || 0;
    var minute = String(parts[1] || "00").padStart(2, "0");
    var period = hour >= 12 ? "م" : "ص";
    var h12 = hour % 12 || 12;
    return String(h12).padStart(2, "0") + ":" + minute + " " + period;
  }

  function percent() {
    var total = state.tasks.reduce(function (sum, task) { return sum + (Number(task.weight) || 1); }, 0);
    var done = state.tasks.reduce(function (sum, task) {
      return sum + (task.done ? (Number(task.weight) || 1) : 0);
    }, 0);
    if (!total) return 0;
    return Math.round((done / total) * 100);
  }

  function nextTaskId() {
    var pending = state.tasks.filter(function (task) { return !task.done; });
    if (!pending.length) return "";
    var now = minutesNow();
    var upcoming = pending.filter(function (task) { return toMinutes(task.time) >= now; })
      .sort(function (a, b) { return toMinutes(a.time) - toMinutes(b.time); });
    var pool = upcoming.length ? upcoming : pending.slice().sort(function (a, b) { return toMinutes(a.time) - toMinutes(b.time); });
    return pool[0].id;
  }

  function nextClass() {
    var now = minutesNow();
    var today = state.schedule
      .filter(function (item) { return item.day === todayName() && toMinutes(item.start) >= now - 20; })
      .sort(function (a, b) { return toMinutes(a.start) - toMinutes(b.start); });
    return today[0] || null;
  }

  function countdown(start) {
    var diff = toMinutes(start) - minutesNow();
    if (diff <= 0) return "بدأت من شوي";
    if (diff < 60) return "بعد " + diff + " دقيقة";
    var hours = Math.floor(diff / 60);
    var mins = diff % 60;
    return "بعد " + hours + " س" + (mins ? " و " + mins + " د" : "");
  }

  function unreadCount() {
    return state.messages.filter(function (message) { return message.unread; }).length;
  }

  function paintChrome() {
    var name = state.profile.name || "طالب";
    document.querySelector("#hello-name").textContent = "أهلاً، " + name;
    document.querySelector("#hello-id").textContent = state.profile.studentId ? "الرقم " + state.profile.studentId : "الرقم الجامعي";
    document.querySelector("#avatar").textContent = name.trim().charAt(0) || "ط";
    var badge = document.querySelector("#unread-badge");
    var count = unreadCount();
    badge.hidden = count === 0;
    badge.textContent = String(count);
    document.querySelectorAll(".dock__btn").forEach(function (button) {
      var on = button.dataset.view === view;
      if (on) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
      button.classList.toggle("is-on", on);
    });
    var now = new Date();
    document.querySelector("#clock").textContent = new Intl.DateTimeFormat("ar-SA", {
      hour: "numeric", minute: "2-digit", hour12: true, numberingSystem: "latn"
    }).format(now);
    document.querySelector("#today-date").textContent = new Intl.DateTimeFormat("ar-SA", {
      weekday: "long", day: "numeric", month: "long", numberingSystem: "latn"
    }).format(now);
  }

  function dayOptions(selected) {
    return DAYS.map(function (day) {
      return "<option" + (day === selected ? " selected" : "") + ">" + day + "</option>";
    }).join("");
  }

  function renderHome() {
    var doneCount = state.tasks.filter(function (task) { return task.done; }).length;
    var leftCount = state.tasks.length - doneCount;
    var value = percent();
    var upcomingClass = nextClass();
    var nextId = nextTaskId();
    var nowMinutes = minutesNow();
    var alerts = state.messages.slice(0, 3);
    var classBlock = upcomingClass
      ? "<p class=\"next-class__kicker\">الحصة الجاية · " + esc(upcomingClass.day) + "</p><h2>" + esc(upcomingClass.course) + " · " + esc(upcomingClass.title) + "</h2><p>" + esc(upcomingClass.doctor) + " · قاعة " + esc(upcomingClass.room) + " · " + esc(formatTime(upcomingClass.start)) + " – " + esc(formatTime(upcomingClass.end)) + "</p><strong>" + esc(countdown(upcomingClass.start)) + "</strong>"
      : "<p class=\"next-class__kicker\">جدول اليوم</p><h2>ما فيه حصة باقية اليوم</h2><p>تقدر تعدّل الأوقات من قائمة الجدول.</p>";

    var tasks = state.tasks.map(function (task) {
      var label = "";
      if (!task.done && toMinutes(task.time) < nowMinutes) label = "late";
      else if (!task.done && task.id === nextId) label = "next";
      return "<li><div class=\"task" + (task.done ? " is-done" : "") + (label === "next" ? " is-next" : "") + "\" data-row data-list=\"tasks\" data-id=\"" + esc(task.id) + "\">" +
        "<button class=\"task__toggle\" type=\"button\" data-action=\"toggle\" data-id=\"" + esc(task.id) + "\" aria-pressed=\"" + (task.done ? "true" : "false") + "\">" +
          "<span class=\"task__check\" aria-hidden=\"true\"></span>" +
          "<span class=\"task__body\"><span class=\"task__heading\"><span class=\"task__title\">" + esc(task.title) + "</span>" +
          (label ? "<span class=\"task__badge" + (label === "late" ? " is-late" : "") + "\">" + (label === "late" ? "متأخر" : "التالي") + "</span>" : "") +
          "</span><span class=\"task__detail\">" + esc(task.detail) + "</span></span></button>" +
        "<label class=\"time-edit\"><span class=\"sr-only\">وقت " + esc(task.title) + "</span><input type=\"time\" data-field=\"time\" value=\"" + esc(task.time) + "\"></label>" +
      "</div></li>";
    }).join("");

    var alertHtml = alerts.map(function (message) {
      return "<li class=\"alert\"><span class=\"alert__tag\">SMS</span><p class=\"alert__text\"><strong>" + esc(message.from) + "</strong> " + esc(message.body) + "</p><time>" + esc(message.time) + "</time></li>";
    }).join("");

    stage.innerHTML = "<div class=\"dashboard\">" +
      "<section class=\"next-class\">" + classBlock + "</section>" +
      "<section class=\"card card--progress\"><h2>مؤشر الإنجاز</h2>" +
        "<div class=\"ring\" id=\"progress\" role=\"progressbar\" aria-valuemin=\"0\" aria-valuemax=\"100\" aria-valuenow=\"" + value + "\" aria-label=\"إنجاز اليوم\" style=\"--progress:" + (ringSeen ? value : 0) + "\">" +
          "<svg class=\"ring__svg\" viewBox=\"0 0 120 120\" aria-hidden=\"true\"><circle class=\"ring__track\" cx=\"60\" cy=\"60\" r=\"46\"></circle><circle class=\"ring__value\" cx=\"60\" cy=\"60\" r=\"46\"></circle></svg>" +
          "<div class=\"ring__center\"><strong id=\"progress-value\">" + value + "%</strong><span>مكتمل</span></div></div>" +
        "<p class=\"summary\" id=\"summary\">" + doneCount + " مهام مكتملة، " + leftCount + " متبقية</p>" +
        (leftCount === 0 && state.tasks.length ? "<p class=\"cheer\">أنهيت جدول اليوم.</p>" : "") +
        "<div class=\"stats\"><div class=\"stat\"><strong>" + doneCount + "</strong><span>مهام مكتملة</span></div><div class=\"stat\"><strong>" + leftCount + "</strong><span>متبقية</span></div></div>" +
      "</section>" +
      "<section class=\"card\"><div class=\"card__head\"><h2>مهام اليوم</h2><span class=\"count-pill\">" + state.tasks.length + " مهام</span></div>" +
        "<label class=\"focus-line\"><span>تركيز اليوم</span><input id=\"focus-note\" value=\"" + esc(state.focus) + "\"></label>" +
        "<ul class=\"task-list\">" + (tasks || "<li class=\"empty\">ما فيه مهام. أضف واحدة من تبويب المهام.</li>") + "</ul></section>" +
      "<section class=\"card card--alerts\"><div class=\"card__head\"><h2>التنبيهات العاجلة</h2><span class=\"live\"><span class=\"pulse\" aria-hidden=\"true\"></span> مباشر</span></div>" +
        "<p class=\"card__note\">رسائل SMS من الدكاترة، والمهمة الجديدة تنزل هنا أول ما توصل.</p>" +
        "<ul class=\"alert-list\">" + (alertHtml || "<li class=\"empty\">ما فيه تنبيهات حالياً.</li>") + "</ul></section>" +
    "</div>";

    if (!ringSeen) {
      var ring = document.querySelector(".ring");
      requestAnimationFrame(function () {
        if (ring) ring.style.setProperty("--progress", String(value));
      });
      ringSeen = true;
    }
  }

  function renderSchedule() {
    var rows = state.schedule.map(function (item) {
      return "<article class=\"admin-row\" data-row data-list=\"schedule\" data-id=\"" + esc(item.id) + "\">" +
        "<div class=\"admin-time\"><strong>" + esc(formatTime(item.start)) + "</strong><span>" + esc(item.day) + "</span></div>" +
        "<div class=\"admin-fields\">" +
          "<label>الرمز<input data-field=\"course\" value=\"" + esc(item.course) + "\"></label>" +
          "<label>اسم المحاضرة<input data-field=\"title\" value=\"" + esc(item.title) + "\"></label>" +
          "<label>اليوم<select data-field=\"day\">" + dayOptions(item.day) + "</select></label>" +
          "<label>من<input type=\"time\" data-field=\"start\" value=\"" + esc(item.start) + "\"></label>" +
          "<label>إلى<input type=\"time\" data-field=\"end\" value=\"" + esc(item.end) + "\"></label>" +
          "<label>القاعة<input data-field=\"room\" value=\"" + esc(item.room) + "\"></label>" +
          "<label>الدكتور<input data-field=\"doctor\" value=\"" + esc(item.doctor) + "\"></label>" +
        "</div>" +
        "<button class=\"ghost danger\" type=\"button\" data-action=\"delete\" data-list=\"schedule\" data-id=\"" + esc(item.id) + "\">حذف</button>" +
      "</article>";
    }).join("");

    stage.innerHTML = "<section class=\"panel\">" +
      "<div class=\"card__head\"><div><h2>قائمة الجدول</h2><p class=\"card__note\">عدّل الوقت أو اليوم أو القاعة، والحفظ يصير مباشرة.</p></div>" +
      "<button class=\"solid\" type=\"button\" data-action=\"add-class\">إضافة محاضرة</button></div>" +
      "<div class=\"admin-list\">" + rows + "</div></section>";
  }

  function renderTasks() {
    var rows = state.tasks.map(function (task) {
      return "<article class=\"admin-row\" data-row data-list=\"tasks\" data-id=\"" + esc(task.id) + "\">" +
        "<label class=\"check-line\"><input type=\"checkbox\" data-field=\"done\" " + (task.done ? "checked" : "") + "><span>" + (task.done ? "مكتملة" : "مفتوحة") + "</span></label>" +
        "<div class=\"admin-fields\">" +
          "<label>المهمة<input data-field=\"title\" value=\"" + esc(task.title) + "\"></label>" +
          "<label>التفاصيل<input data-field=\"detail\" value=\"" + esc(task.detail) + "\"></label>" +
          "<label>الوقت<input type=\"time\" data-field=\"time\" value=\"" + esc(task.time) + "\"></label>" +
          "<label>من<input data-field=\"from\" value=\"" + esc(task.from || "") + "\"></label>" +
        "</div>" +
        "<button class=\"ghost danger\" type=\"button\" data-action=\"delete\" data-list=\"tasks\" data-id=\"" + esc(task.id) + "\">حذف</button>" +
      "</article>";
    }).join("");

    stage.innerHTML = "<section class=\"panel\">" +
      "<div class=\"card__head\"><div><h2>إدارة المهام</h2><p class=\"card__note\">أضف مهمة، غيّر وقتها، أو علّمها مكتملة. مؤشر اليوم يتحدث معك.</p></div>" +
      "<button class=\"solid\" type=\"button\" data-action=\"add-task\">إضافة مهمة</button></div>" +
      "<div class=\"admin-list\">" + (rows || "<p class=\"empty\">القائمة فاضية.</p>") + "</div></section>";
  }

  function renderInbox() {
    var rows = state.messages.map(function (message) {
      return "<article class=\"message" + (message.unread ? " is-unread" : "") + "\" data-id=\"" + esc(message.id) + "\">" +
        "<div class=\"message__top\"><strong>" + esc(message.from) + "</strong><time>" + esc(message.time) + "</time></div>" +
        "<span class=\"message__course\">" + esc(message.course || "SMS") + "</span>" +
        "<p>" + esc(message.body) + "</p>" +
        (message.unread ? "<button class=\"ghost\" type=\"button\" data-action=\"read\" data-id=\"" + esc(message.id) + "\">تمت القراءة</button>" : "") +
      "</article>";
    }).join("");
    stage.innerHTML = "<section class=\"panel\"><div class=\"card__head\"><div><h2>رسائل الدكاترة</h2><p class=\"card__note\">إذا الدكتور أرسل مهمة الآن، تظهر هنا وتنضاف لقائمة اليوم.</p></div></div>" +
      "<div class=\"message-list\">" + (rows || "<p class=\"empty\">ما فيه رسائل.</p>") + "</div></section>";
  }

  function swatchButtons(selected) {
    return SWATCHES.map(function (color) {
      return "<button type=\"button\" class=\"swatch" + (color.toLowerCase() === String(selected).toLowerCase() ? " is-on" : "") + "\" data-swatch=\"" + color + "\" style=\"background:" + color + "\" aria-label=\"" + color + "\"></button>";
    }).join("");
  }

  function renderProfile() {
    stage.innerHTML = "<section class=\"panel profile\">" +
      "<h2>حسابي</h2><p class=\"card__note\">عدّل اسمك ورقمك ولون التابلت في أي وقت.</p>" +
      "<label class=\"stack\">الاسم<input id=\"profile-name\" value=\"" + esc(state.profile.name) + "\"></label>" +
      "<label class=\"stack\">الرقم الجامعي<input id=\"profile-id\" inputmode=\"numeric\" value=\"" + esc(state.profile.studentId) + "\"></label>" +
      "<div class=\"stack\"><span>اللون المفضل</span><div class=\"swatches\">" + swatchButtons(state.profile.color) + "</div>" +
      "<label class=\"color-line\">لون أدق<input type=\"color\" id=\"color-picker\" value=\"" + esc(state.profile.color) + "\"></label></div>" +
      "<div class=\"profile-actions\">" +
        "<button class=\"ghost\" type=\"button\" data-action=\"replay-hello\">إعادة الترحيب</button>" +
        "<button class=\"ghost\" type=\"button\" data-action=\"replay-live\">محاكاة رسالة الدكتور</button>" +
      "</div></section>";
  }

  function render() {
    if (view === "home") renderHome();
    else if (view === "schedule") renderSchedule();
    else if (view === "tasks") renderTasks();
    else if (view === "inbox") renderInbox();
    else renderProfile();
    paintChrome();
  }

  function setView(next) {
    view = next;
    shade.hidden = true;
    render();
  }

  function showToast(title, body) {
    var node = document.createElement("div");
    node.className = "toast";
    node.innerHTML = "<span class=\"toast__dot\" aria-hidden=\"true\"></span><div><strong>" + esc(title) + "</strong><p>" + esc(body) + "</p></div>";
    toasts.appendChild(node);
    if (navigator.vibrate) navigator.vibrate(18);
    setTimeout(function () {
      node.classList.add("is-out");
      setTimeout(function () { node.remove(); }, 280);
    }, 5200);
  }

  function softRefresh() {
    var active = document.activeElement;
    var typing = active && stage.contains(active) && (view === "schedule" || view === "tasks" || view === "profile");
    if (typing) {
      paintChrome();
      return;
    }
    render();
  }

  function fireLive(event) {
    if (state.seenLive.indexOf(event.id) !== -1) return;
    state.seenLive.push(event.id);
    state.messages.unshift({
      id: uid("msg"),
      from: event.from,
      course: event.course,
      body: event.body,
      time: "الآن",
      unread: true,
      kind: "sms",
      source: event.id
    });
    if (event.task) {
      state.tasks.push({
        id: uid("task"),
        title: event.task.title,
        detail: event.task.detail,
        time: event.task.time,
        weight: event.task.weight,
        done: false,
        from: event.from,
        source: event.id
      });
    }
    save();
    showToast(event.from + " أرسل هذه المهمة الآن", event.task ? event.task.title : event.body);
    softRefresh();
  }

  function startLiveEvents() {
    timers.forEach(clearTimeout);
    timers = [];
    LIVE.forEach(function (event) {
      if (state.seenLive.indexOf(event.id) !== -1) return;
      timers.push(setTimeout(function () { fireLive(event); }, event.delay));
    });
  }

  function boot() {
    applyTheme(state.profile.color || "#0f766e");
    welcome.hidden = true;
    document.documentElement.classList.add("is-ready");
    render();
    startLiveEvents();
  }

  function showAskStep() {
    askError.textContent = "";
    askProgress.textContent = (askStep + 1) + " من 3";
    askSwatches.hidden = askStep !== 2;
    askColorLine.hidden = askStep !== 2;
    askInput.hidden = askStep === 2;
    if (askStep === 0) {
      askTitle.textContent = "وش اسمك؟";
      askNote.textContent = "الاسم يظهر في شريط التابلت، وتقدر تعدّله بعدين.";
      askInput.value = answers.name;
      askInput.placeholder = "محمد آل مهديه";
      askInput.type = "text";
      askInput.inputMode = "text";
      askNext.textContent = "التالي";
      askInput.focus();
    } else if (askStep === 1) {
      askTitle.textContent = "رقمك الجامعي؟";
      askNote.textContent = "نكتبه تحت اسمك، عشان الجهاز يعرفك.";
      askInput.value = answers.studentId;
      askInput.placeholder = "443012345";
      askInput.inputMode = "numeric";
      askNext.textContent = "التالي";
      askInput.focus();
    } else {
      askTitle.textContent = "لونك المفضل؟";
      askNote.textContent = "هذا اللون بيصير ثيم التابلت كله.";
      askNext.textContent = "ادخل التابلت";
      askSwatches.innerHTML = swatchButtons(answers.color);
      askColor.value = answers.color;
    }
  }

  function openWelcome() {
    document.documentElement.classList.remove("is-ready");
    welcome.hidden = false;
    hello.hidden = false;
    ask.hidden = true;
    askStep = 0;
    var word = hello.querySelector(".hello-word");
    word.style.animation = "none";
    void word.offsetWidth;
    word.style.animation = "";
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(function () {
      hello.hidden = true;
      ask.hidden = false;
      showAskStep();
    }, reduce ? 500 : 2800);
  }

  function finishWelcome() {
    state.profile.name = answers.name;
    state.profile.studentId = answers.studentId;
    state.profile.color = answers.color;
    state.profile.onboarded = true;
    save();
    boot();
  }

  ask.addEventListener("submit", function (event) {
    event.preventDefault();
    if (askStep === 0) {
      var name = askInput.value.trim();
      if (name.length < 2) {
        askError.textContent = "اكتب اسمك كامل.";
        return;
      }
      answers.name = name;
      askStep = 1;
      showAskStep();
      return;
    }
    if (askStep === 1) {
      var studentId = askInput.value.trim();
      if (!/^\d{5,12}$/.test(studentId)) {
        askError.textContent = "اكتب الرقم الجامعي بالأرقام.";
        return;
      }
      answers.studentId = studentId;
      askStep = 2;
      showAskStep();
      return;
    }
    finishWelcome();
  });

  askSwatches.addEventListener("click", function (event) {
    var button = event.target.closest("[data-swatch]");
    if (!button) return;
    answers.color = button.dataset.swatch;
    askColor.value = answers.color;
    askSwatches.querySelectorAll(".swatch").forEach(function (swatch) {
      swatch.classList.toggle("is-on", swatch === button);
    });
  });

  askColor.addEventListener("input", function () {
    answers.color = askColor.value;
    askSwatches.querySelectorAll(".swatch").forEach(function (swatch) {
      swatch.classList.toggle("is-on", swatch.dataset.swatch.toLowerCase() === answers.color.toLowerCase());
    });
  });

  document.querySelector(".dock").addEventListener("click", function (event) {
    var button = event.target.closest("[data-view]");
    if (!button || welcome.hidden === false) return;
    setView(button.dataset.view);
  });

  document.querySelector("#open-profile").addEventListener("click", function () {
    if (!welcome.hidden) return;
    setView("profile");
  });

  document.querySelector("#shade-toggle").addEventListener("click", function () {
    if (!welcome.hidden) return;
    shade.hidden = !shade.hidden;
    if (!shade.hidden) {
      shadeList.innerHTML = state.messages.slice(0, 4).map(function (message) {
        return "<p><strong>" + esc(message.from) + "</strong> " + esc(message.body) + "</p>";
      }).join("") || "<p>ما فيه تنبيهات.</p>";
    }
  });

  document.querySelector("#shade-close").addEventListener("click", function () {
    shade.hidden = true;
  });

  stage.addEventListener("click", function (event) {
    var swatch = event.target.closest("[data-swatch]");
    if (swatch && view === "profile") {
      state.profile.color = swatch.dataset.swatch;
      applyTheme(state.profile.color);
      save();
      document.querySelectorAll("#stage [data-swatch]").forEach(function (button) {
        button.classList.toggle("is-on", button === swatch);
      });
      var picker = document.querySelector("#color-picker");
      if (picker) picker.value = state.profile.color;
      return;
    }

    var action = event.target.closest("[data-action]");
    if (!action) return;
    var name = action.dataset.action;
    if (name === "toggle") {
      var task = state.tasks.filter(function (item) { return item.id === action.dataset.id; })[0];
      if (!task) return;
      task.done = !task.done;
      save();
      render();
      return;
    }
    if (name === "delete") {
      var list = state[action.dataset.list];
      state[action.dataset.list] = list.filter(function (item) { return item.id !== action.dataset.id; });
      save();
      render();
      return;
    }
    if (name === "add-class") {
      var id = uid("class");
      state.schedule.push({ id: id, course: "NEW", title: "محاضرة جديدة", day: todayName(), start: "09:00", end: "10:30", room: "—", doctor: "" });
      save();
      render();
      return;
    }
    if (name === "add-task") {
      state.tasks.push({ id: uid("task"), title: "مهمة جديدة", detail: "اكتب التفاصيل", time: "12:00", weight: 15, done: false, from: "أنا" });
      save();
      render();
      return;
    }
    if (name === "read") {
      var message = state.messages.filter(function (item) { return item.id === action.dataset.id; })[0];
      if (message) message.unread = false;
      save();
      render();
      return;
    }
    if (name === "replay-hello") {
      openWelcome();
      return;
    }
    if (name === "replay-live") {
      var ids = LIVE.map(function (item) { return item.id; });
      state.seenLive = state.seenLive.filter(function (id) { return ids.indexOf(id) === -1; });
      state.tasks = state.tasks.filter(function (task) { return !task.source || ids.indexOf(task.source) === -1; });
      state.messages = state.messages.filter(function (message) { return !message.source || ids.indexOf(message.source) === -1; });
      save();
      render();
      startLiveEvents();
      showToast("المحاكاة اشتغلت", "بتوصلك رسالة الدكتور بعد ثواني.");
    }
  });

  stage.addEventListener("input", function (event) {
    var target = event.target;
    if (target.id === "profile-name") {
      state.profile.name = target.value.trim() || state.profile.name;
      paintChrome();
      save();
      return;
    }
    if (target.id === "profile-id") {
      var cleaned = target.value.replace(/\D/g, "").slice(0, 12);
      if (cleaned !== target.value) target.value = cleaned;
      state.profile.studentId = cleaned;
      paintChrome();
      save();
      return;
    }
    if (target.id === "color-picker") {
      state.profile.color = target.value;
      applyTheme(target.value);
      save();
      document.querySelectorAll("#stage [data-swatch]").forEach(function (button) {
        button.classList.toggle("is-on", button.dataset.swatch.toLowerCase() === target.value.toLowerCase());
      });
      return;
    }
    if (target.id === "focus-note") {
      state.focus = target.value;
      save();
      return;
    }
    var row = target.closest("[data-row]");
    if (!row || !target.dataset.field) return;
    var collection = state[row.dataset.list];
    var item = collection.filter(function (entry) { return entry.id === row.dataset.id; })[0];
    if (!item) return;
    if (target.type === "checkbox") item.done = target.checked;
    else item[target.dataset.field] = target.value;
    save();
    if (row.dataset.list === "schedule") {
      var block = row.querySelector(".admin-time strong");
      var daySpan = row.querySelector(".admin-time span");
      if (block && item.start) block.textContent = formatTime(item.start);
      if (daySpan && item.day) daySpan.textContent = item.day;
    }
  });

  stage.addEventListener("change", function (event) {
    var target = event.target;
    var row = target.closest("[data-row]");
    if (!row || !target.dataset.field) return;
    if (view === "home" && target.dataset.field === "time") render();
    if (view === "tasks" && target.type === "checkbox") render();
  });

  paintChrome();
  if (state.profile.onboarded) boot();
  else openWelcome();

  setInterval(paintChrome, 1000);
})();

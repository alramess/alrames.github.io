// منطق الموقع المشترك بين الصفحتين. البيانات في data.js
(function () {
  const $ = s => document.querySelector(s);
  const root = document.querySelector("[data-page]");
  const PAGE = root ? root.dataset.page : "home";
  const secs = d => { const [m, s] = d.split(":").map(Number); return m * 60 + s; };
  const fmt = t => { t = Math.max(0, Math.floor(t || 0)); return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0"); };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const countWord = n => n === 1 ? "عمل واحد" : n === 2 ? "عملان" : n <= 10 ? n + " أعمال" : n + " عملًا";

  // ===== واتساب والرقم =====
  const waUrl = "https://wa.me/" + PROFILE.phoneIntl + "?text=" + encodeURIComponent(PROFILE.waText);
  document.querySelectorAll(".js-wa").forEach(a => { a.href = waUrl; a.target = "_blank"; a.rel = "noopener"; });
  const num = $("#number"); if (num) num.textContent = PROFILE.phoneLocal;
  const yr = $("#year"); if (yr) yr.textContent = new Date().getFullYear();
  const copyBtn = $("#copy");
  if (copyBtn) copyBtn.addEventListener("click", () => {
    const msg = $("#copied");
    const select = () => {
      const r = document.createRange(); r.selectNodeContents(num);
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      msg.textContent = "الرقم محدد، انسخه يدويًا";
    };
    try { navigator.clipboard.writeText(PROFILE.phoneLocal.replace(/\s/g, "")).then(() => msg.textContent = "تم نسخ الرقم", select); }
    catch (e) { select(); }
  });

  const miniWave = (id, n) => {
    const p = PEAKS[id] || "";
    let h = ""; for (let i = 0; i < n; i++) h += '<b style="height:' + (15 + (+p[Math.floor(i * p.length / n)] || 4) * 9.4) + '%"></b>';
    return h;
  };

  // ===== المشغّل =====
  const player = $("#player"), scrub = $("#scrub"), lamp = $("#lamp"), stage = $("#stage");
  const BAR_N = 96;
  for (let i = 0; i < BAR_N; i++) { const s = document.createElement("span"); s.style.setProperty("--i", i); scrub.appendChild(s); }
  const bars = [...scrub.children];
  let list = [], index = 0, started = false, catOf = () => "";

  function drawWave(id) {
    const p = PEAKS[id] || "5".repeat(BAR_N);
    bars.forEach((b, i) => { b.style.height = (12 + (+p[Math.floor(i * p.length / BAR_N)]) * 9.5) + "%"; });
  }
  function paint() {
    const f = player.duration ? player.currentTime / player.duration : 0;
    const k = Math.round(f * BAR_N);
    bars.forEach((b, i) => b.classList.toggle("on", i < k));
    $("#time").textContent = fmt(player.currentTime) + " / " + fmt(player.duration || (list[index] ? secs(list[index][3]) : 0));
    scrub.setAttribute("aria-valuenow", Math.round(f * 100));
    scrub.setAttribute("aria-valuetext", fmt(player.currentTime));
  }
  let raf = 0;
  const loop = () => { paint(); if (!player.paused) raf = requestAnimationFrame(loop); };

  function load(i, autoplay) {
    if (!list.length) return;
    index = (i + list.length) % list.length;
    const [id, title, cat, dur] = list[index];
    player.src = "media/work-" + id + ".mp4";
    player.poster = "media/work-" + id + ".jpg";
    $("#now-title").textContent = title;
    const c = $("#now-cat"); c.style.setProperty("--c", catOf(cat)); c.lastElementChild.textContent = cat + "، " + dur;
    drawWave(id); paint();
    document.querySelectorAll("[data-id]").forEach(el => el.classList.toggle("current", el.dataset.id === id));
    if (autoplay) play();
  }
  function play() { started = true; $("#big-play").hidden = true; player.play().catch(() => { $("#big-play").hidden = false; }); }
  const PLAY = "M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z";
  const PAUSE = "M6 4h4v16H6zM14 4h4v16h-4z";
  player.addEventListener("play", () => {
    $("#toggle-icon").innerHTML = '<path d="' + PAUSE + '"/>'; $("#toggle").setAttribute("aria-label", "إيقاف مؤقت");
    if (lamp) lamp.classList.add("live");
    document.querySelectorAll("[data-id].current").forEach(c => c.classList.add("playing"));
    cancelAnimationFrame(raf); loop();
  });
  player.addEventListener("pause", () => {
    $("#toggle-icon").innerHTML = '<path d="' + PLAY + '"/>'; $("#toggle").setAttribute("aria-label", "تشغيل");
    if (lamp) lamp.classList.remove("live");
    document.querySelectorAll("[data-id].playing").forEach(c => c.classList.remove("playing")); paint();
  });
  player.addEventListener("loadedmetadata", paint);
  player.addEventListener("ended", () => load(index + 1, true));
  player.addEventListener("click", () => player.paused ? play() : player.pause());
  $("#big-play").addEventListener("click", play);
  $("#toggle").addEventListener("click", () => player.paused ? play() : player.pause());
  $("#prev").addEventListener("click", () => load(index - 1, started));
  $("#next").addEventListener("click", () => load(index + 1, started));
  $("#mute").addEventListener("click", () => {
    player.muted = !player.muted;
    $("#mute").setAttribute("aria-label", player.muted ? "تشغيل الصوت" : "كتم الصوت");
    $("#mute-icon").innerHTML = player.muted
      ? '<path d="M4 9v6h4l5 4V5L8 9zm12.6 3 2.7-2.7-1.4-1.4-2.7 2.7-2.7-2.7-1.4 1.4 2.7 2.7-2.7 2.7 1.4 1.4 2.7-2.7 2.7 2.7 1.4-1.4z"/>'
      : '<path d="M4 9v6h4l5 4V5L8 9zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/>';
  });
  $("#fs").addEventListener("click", () => {
    const el = $(".screen");
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (el.requestFullscreen) el.requestFullscreen().catch(() => player.webkitEnterFullscreen && player.webkitEnterFullscreen());
      else if (player.webkitEnterFullscreen) player.webkitEnterFullscreen();
    } catch (e) {}
  });
  function seekAt(x) {
    const r = scrub.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (r.right - x) / r.width));
    if (player.readyState > 0) { player.currentTime = f * player.duration; paint(); }
  }
  let dragging = false;
  scrub.addEventListener("pointerdown", e => { dragging = true; scrub.setPointerCapture(e.pointerId); seekAt(e.clientX); });
  scrub.addEventListener("pointermove", e => { if (dragging) seekAt(e.clientX); });
  scrub.addEventListener("pointerup", () => dragging = false);
  scrub.addEventListener("keydown", e => {
    const step = { ArrowLeft: 5, ArrowRight: -5, Home: -1e9, End: 1e9 }[e.key];
    if (step === undefined) return;
    e.preventDefault(); player.currentTime = Math.min(player.duration || 0, Math.max(0, player.currentTime + step)); paint();
  });
  const showStage = () => {
    const r = stage.getBoundingClientRect();
    if (r.top < 0 || r.bottom > innerHeight) stage.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
  };
  function playWork(id) {
    const i = list.findIndex(w => w[0] === id);
    if (i !== -1) { load(i, true); showStage(); }
  }

  // ===== الصفحة الرئيسية =====
  if (PAGE === "home") {
    list = FEATURED.slice();
    catOf = () => "var(--saffron)";

    const roster = $("#roster");
    FEATURED.forEach(([id, name, sector, dur]) => {
      const li = document.createElement("li");
      li.innerHTML =
        '<button type="button" class="rw" data-id="' + id + '">' +
        '<div class="thumb"><img loading="lazy" alt="" src="media/work-' + id + '.jpg">' +
        '<span class="playing-tag">يُعرض الآن<span><b></b><b></b><b></b></span></span></div>' +
        '<div><h3 class="rw-name"></h3><span class="rw-sector"><i></i><span></span></span></div>' +
        '<div class="rw-side"><div class="mini">' + miniWave(id, 40) + '</div><span class="rw-dur"></span></div></button>';
      li.querySelector(".rw-name").textContent = name;
      li.querySelector(".rw-sector span").textContent = sector;
      li.querySelector(".rw-dur").textContent = dur;
      const b = li.querySelector("button");
      b.setAttribute("aria-label", "تشغيل عمل " + name + "، المدة " + dur);
      b.addEventListener("click", () => playWork(id));
      roster.appendChild(li);
    });

    // تشويقة الأعمال الأخرى
    $("#more-count").textContent = countWord(OTHERS.length) + " أخرى";
    $("#more-cats").innerHTML = Object.keys(CATS).map(c =>
      '<li><i style="--c:' + CATS[c] + '"></i>' + c + ' <small>' + OTHERS.filter(w => w[2] === c).length + '</small></li>').join("");
    $("#fan").innerHTML = OTHERS.slice(0, 6).map(w =>
      '<a href="works.html#w' + w[0] + '" aria-label="' + w[1].replace(/"/g, "") + '"><img loading="lazy" alt="" src="media/work-' + w[0] + '.jpg"></a>').join("");
    $("#more-btn-count").textContent = OTHERS.length;

    $("#hero-play").addEventListener("click", () => { if (player.paused) play(); showStage(); });
    load(0, false);
  }

  // ===== صفحة الأعمال الأخرى =====
  if (PAGE === "works") {
    list = OTHERS.slice();
    catOf = c => CATS[c] || "var(--muted)";
    $("#works-sub").textContent = countWord(OTHERS.length) + " لجمعيات خيرية وجهات مجتمعية وإعلانات تجارية ومبادرات. اختر أي عمل ليُعرض في المشغّل.";

    const grid = $("#grid");
    OTHERS.forEach(([id, title, cat, dur]) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "card"; b.dataset.id = id; b.dataset.cat = cat; b.id = "w" + id;
      b.innerHTML =
        '<div class="thumb"><img loading="lazy" alt="" src="media/work-' + id + '.jpg"><span class="dur"></span>' +
        '<span class="playing-tag">يُعرض الآن<span><b></b><b></b><b></b></span></span></div>' +
        '<h3></h3><div class="row"><span class="cat" style="--c:' + catOf(cat) + '"><i></i><span></span></span><div class="mini" style="width:40%">' + miniWave(id, 40) + '</div></div>';
      b.querySelector(".dur").textContent = dur;
      b.querySelector("h3").textContent = title;
      b.querySelector(".cat span").textContent = cat;
      b.setAttribute("aria-label", "تشغيل " + title + "، " + cat + "، المدة " + dur);
      b.addEventListener("click", () => {
        if (list.findIndex(w => w[0] === id) === -1) list = OTHERS.slice();
        playWork(id);
      });
      grid.appendChild(b);
    });

    const filters = $("#filters"), chips = [];
    [["الكل", null], ...Object.keys(CATS).map(c => [c, CATS[c]])].forEach(([label, color], i) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.setAttribute("aria-pressed", i ? "false" : "true");
      const count = i ? OTHERS.filter(w => w[2] === label).length : OTHERS.length;
      b.innerHTML = (color ? '<i style="--c:' + color + '"></i>' : "") + "<span></span><small>" + count + "</small>";
      b.querySelector("span").textContent = label;
      b.addEventListener("click", () => {
        chips.forEach(c => c.setAttribute("aria-pressed", c === b ? "true" : "false"));
        grid.querySelectorAll(".card").forEach(c => c.hidden = i ? c.dataset.cat !== label : false);
        const curId = list[index] && list[index][0];
        list = i ? OTHERS.filter(w => w[2] === label) : OTHERS.slice();
        const keep = list.findIndex(w => w[0] === curId);
        if (keep !== -1) index = keep;
        else if (player.paused) load(0, false);
        else index = -1;
      });
      chips.push(b); filters.appendChild(b);
    });

    // فتح عمل محدد من رابط الصفحة الرئيسية (works.html#w24)
    const h = (location.hash || "").replace("#w", "");
    const start = OTHERS.findIndex(w => w[0] === h);
    load(start === -1 ? 0 : start, false);
  }

  scrub.classList.add("intro");
  setTimeout(() => scrub.classList.remove("intro"), 1800);
})();

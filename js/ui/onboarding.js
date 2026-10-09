const STORAGE_KEY = "tabichike:onboarded";
let overlay;
let previousFocus;
let previousOverflow;
let currentIndex = 0;

function loadStyles() {
  if (document.querySelector('link[data-onboarding-style]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "./css/onboarding.css";
  link.dataset.onboardingStyle = "true";
  document.head.append(link);
}

export function markOnboarded() {
  try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* Storage may be unavailable. */ }
}

function hasOnboarded() {
  try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch { return false; }
}

export function maybeShowTutorial(data, hash) {
  if (data.trips.length > 0) { markOnboarded(); return; }
  if (hash === "#/" && !hasOnboarded()) showTutorial();
}

export function openTutorial({ force = false } = {}) {
  if (force) showTutorial();
}

const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

function showTutorial() {
  if (overlay) { go(0); return; }
  loadStyles();
  previousFocus = document.activeElement;
  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  overlay = document.createElement("div");
  overlay.className = "ob";
  overlay.id = "onboarding-dialog";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "たびチケの使い方");
  overlay.innerHTML = `
    <button class="ob-skip" type="button" data-skip>スキップ</button>
    <div class="track" data-track><div class="slides" data-slides>
      <section class="slide" aria-roledescription="slide" aria-label="1 / 4"><div class="pass">
        <div class="pass-top" style="--bg: var(--c-board)"><div class="ill-board"><span class="plate">✈ 出発<span class="bar"></span><span class="en">DEPARTURES</span></span><div class="flaps"><span class="flap">た</span><span class="flap">び</span><span class="flap">チ</span><span class="flap">ケ</span></div><div class="board-sub">FREE · NO SIGN-UP · OFFLINE OK</div></div></div>
        <div class="pass-body"><div class="pass-label"><span>WELCOME ABOARD</span><b>1 / 4</b></div><h2>ようこそ、たびチケへ</h2><p>旅程・持ち物・費用・しおりを、1枚のチケットにまとめる旅行アプリです。無料で、登録もいりません。</p></div>
      </div></section>
      <section class="slide" aria-roledescription="slide" aria-label="2 / 4" aria-hidden="true"><div class="pass">
        <div class="pass-top" style="--bg: #FFE8DE"><div class="mini-ticket"><div class="mt-main"><small>BOARDING PASS</small><b>京都</b><span>10/12 → 10/14</span></div><div class="mt-stub"><div><i>DAYS TO GO</i><em>5</em></div></div></div></div>
        <div class="pass-body"><div class="pass-label"><span>STEP 1 · TICKET</span><b>2 / 4</b></div><h2>旅行ごとに、チケットを発券</h2><p>なまえと日にちを入れるだけ。ホームに搭乗券が並んで、出発までの日数をカウントダウンします。</p></div>
      </div></section>
      <section class="slide" aria-roledescription="slide" aria-label="3 / 4" aria-hidden="true"><div class="pass">
        <div class="pass-top" style="--bg: #FDECEF"><div class="ill-stamps"><div class="row" style="--cc:#3BA7E0"><small>08:12</small>のぞみで京都へ<span class="st">VISITED</span></div><div class="row" style="--cc:#FF6B3D"><small>13:30</small>清水寺<span class="st">VISITED</span></div><div class="row" style="--cc:#E8A317"><small>18:00</small>にしんそば<span class="st">VISITED</span></div></div></div>
        <div class="pass-body"><div class="pass-label"><span>STEP 2 · STAMP</span><b>3 / 4</b></div><h2>行った場所に、スタンプを</h2><p>予定を時間割にして、旅先では「行った？」を押すだけ。持ち物を全部そろえると「READY TO GO!」が押されます。</p></div>
      </div></section>
      <section class="slide" aria-roledescription="slide" aria-label="4 / 4" aria-hidden="true"><div class="pass">
        <div class="pass-top" style="--bg: #E5EEF8"><div class="ill-pass"><div class="en">TRAVEL<br>PASSPORT</div><svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="50" cy="50" r="40"/><ellipse cx="50" cy="50" rx="17" ry="40"/><path d="M10 50h80M16 32h68M16 68h68M50 10v80"/></svg><div class="tt">京都ひとり旅</div><span class="share-chip"><i></i>LINEで送る</span></div></div>
        <div class="pass-body"><div class="pass-label"><span>STEP 3 · SHARE</span><b>4 / 4</b></div><h2>しおりにして、みんなに送る</h2><p>パスポート風のしおりは印刷やPDFにもできます。リンクを送れば、一緒に行く人も見られます。</p></div>
      </div></section>
    </div></div>
    <div class="dots" aria-hidden="true"><span class="on"></span><span></span><span></span><span></span></div>
    <div class="ob-actions single" data-actions></div>
    <a class="ob-guide" href="/guide/" data-guide>くわしい使い方を見る</a>`;
  document.body.append(overlay);
  overlay.querySelector("[data-actions]").addEventListener("click", (event) => {
    if (event.target.closest("[data-next]")) go(currentIndex + 1);
    else if (event.target.closest("[data-prev]")) go(currentIndex - 1);
    else if (event.target.closest("[data-create]")) closeTutorial(true);
  });
  overlay.querySelector("[data-skip]").addEventListener("click", () => closeTutorial(false));
  overlay.querySelector("[data-guide]").addEventListener("click", () => closeTutorial(false));
  let startX = null;
  overlay.querySelector("[data-track]").addEventListener("touchstart", (event) => { startX = event.touches[0].clientX; }, { passive: true });
  overlay.querySelector("[data-track]").addEventListener("touchend", (event) => {
    if (startX === null) return;
    const dx = event.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) go(currentIndex + (dx < 0 ? 1 : -1));
    startX = null;
  }, { passive: true });
  overlay.addEventListener("keydown", handleKeys);
  document.addEventListener("focusin", containFocus);
  go(0);
  overlay.querySelector("[data-skip]").focus();
}

function go(nextIndex) {
  if (!overlay) return;
  currentIndex = Math.max(0, Math.min(3, nextIndex));
  const slides = overlay.querySelector("[data-slides]");
  [...slides.children].forEach((slide, index) => {
    slide.classList.toggle("is-active", index === currentIndex);
    slide.setAttribute("aria-hidden", String(index !== currentIndex));
  });
  slides.style.transform = `translateX(-${currentIndex * 100}%)`;
  [...overlay.querySelectorAll(".dots span")].forEach((dot, index) => dot.classList.toggle("on", index === currentIndex));
  const actions = overlay.querySelector("[data-actions]");
  actions.className = `ob-actions${currentIndex === 0 ? " single" : ""}`;
  actions.innerHTML = (currentIndex > 0 ? '<button class="b prev" type="button" data-prev>もどる</button>' : "") +
    (currentIndex < 3 ? `<button class="b next" type="button" data-next>つぎへ ${arrow}</button>` : `<button class="b next" type="button" data-create>チケットをつくる ${arrow}</button>`);
  overlay.querySelector("[data-skip]").hidden = currentIndex === 3;
}

function handleKeys(event) {
  if (!overlay) return;
  if (event.key === "Escape") { event.preventDefault(); closeTutorial(false); return; }
  if (event.key === "ArrowRight") { event.preventDefault(); go(currentIndex + 1); }
  if (event.key === "ArrowLeft") { event.preventDefault(); go(currentIndex - 1); }
  if (event.key === "Tab") {
    const focusable = [...overlay.querySelectorAll('button:not([hidden]), a[href]')];
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
}

function containFocus(event) {
  if (overlay && !overlay.contains(event.target)) overlay.querySelector("[data-skip]").focus();
}

function closeTutorial(createTrip) {
  if (!overlay) return;
  markOnboarded();
  const current = overlay;
  overlay = null;
  current.removeEventListener("keydown", handleKeys);
  document.removeEventListener("focusin", containFocus);
  current.remove();
  document.body.style.overflow = previousOverflow;
  if (createTrip) location.hash = "#/trip/new";
  else if (previousFocus?.isConnected) previousFocus.focus();
}

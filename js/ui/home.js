import { appRoot } from "../utils/dom.js";
import { createId } from "../models.js";
import { saveData } from "../store.js";
import { confirmDialog } from "../utils/dialog.js";
import { toast } from "../utils/toast.js";
import { localDateString } from "../utils/date.js";
import { departureBoard, ticket } from "./common.js";

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const FLAP_CHARS = "0123456789ABCDEFGHJKLMNPRSTUVWXYZ";
let clockTimer;

const planeMark = `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>`;
const settingsIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`;

function ticketEntry(trip, index) {
  return ticket(trip, { index });
}

export function renderHome(data) {
  let currentData = data;
  const today = localDateString();
  const upcoming = data.trips.filter((trip) => trip.endDate >= today).sort((a, b) => a.startDate.localeCompare(b.startDate));
  const ended = data.trips.filter((trip) => trip.endDate < today).sort((a, b) => b.startDate.localeCompare(a.startDate));
  const empty = data.trips.length === 0;
  clearInterval(clockTimer);
  appRoot().innerHTML = `<div class="app-shell home-page">
    <div class="wrap">
      <header class="top">
        <div class="logo"><span class="logo-mark">${planeMark}</span><span>たびチケ</span></div>
        <a class="icon-btn" href="#/settings" aria-label="設定">${settingsIcon}</a>
      </header>
      ${departureBoard(data.trips)}
      ${empty ? `<section class="empty-state"><div class="empty-illustration" aria-hidden="true">🧳</div><p>まだ旅行がありません。最初のチケットをつくりましょう！</p><a class="primary-button" href="#/trip/new">旅行をつくる</a></section>` : `
        <section aria-labelledby="upcoming-title"><div class="sec"><h2 id="upcoming-title">これからの旅行</h2><span class="count">${upcoming.length}</span></div>
          ${upcoming.length ? `<div class="list">${upcoming.map((trip, index) => ticketEntry(trip, index)).join("")}</div>` : ""}
        </section>
        <section aria-labelledby="past-title"><button class="sec toggle" id="pastToggle" aria-expanded="false" aria-controls="pastList"><h2 id="past-title">おわった旅行</h2><span class="count">${ended.length}</span><svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>
          <div class="list past-list" id="pastList" hidden>${ended.map((trip, index) => ticketEntry(trip, index)).join("")}</div>
        </section>`}
      <footer class="foot">
        つくったのは チップ商会 開発部<br>
        <a href="https://chipshokai.com" target="_blank" rel="noopener">公式サイト</a>
        <a href="https://x.com/chip_shokai" target="_blank" rel="noopener">X</a>
        <a href="https://note.com/chip_shokai" target="_blank" rel="noopener">note</a><br>
        <button class="share" type="button"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>このアプリをシェア</button>
      </footer>
    </div>
    <button class="fab" type="button" aria-label="新しい旅行をつくる" data-href="#/trip/new"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>
  </div>`;

  const pastToggle = document.getElementById("pastToggle");
  pastToggle?.addEventListener("click", () => {
    const open = pastToggle.getAttribute("aria-expanded") !== "true";
    pastToggle.setAttribute("aria-expanded", String(open));
    document.getElementById("pastList").hidden = !open;
  });
  document.querySelectorAll("[data-href]").forEach((element) => {
    element.addEventListener("click", (event) => {
      if (event.target !== element && event.target.closest("button, a, summary, details")) return;
      location.hash = element.dataset.href;
    });
    element.addEventListener("keydown", (event) => {
      if (event.target !== element || !(event.key === "Enter" || event.key === " ")) return;
      event.preventDefault();
      location.hash = element.dataset.href;
    });
  });
  document.getElementById("pastList")?.addEventListener("click", (event) => {
    if (event.target.closest("button, a, summary, details")) event.stopPropagation();
  });
  const shareDialog = document.createElement("dialog");
  shareDialog.className = "share-sheet";
  shareDialog.innerHTML = `<h2>このアプリをシェア</h2><form method="dialog"><a data-share-x target="_blank" rel="noopener">Xでシェア</a><a data-share-line target="_blank" rel="noopener">LINEで送る</a><button type="button" data-share-copy>リンクをコピー</button><button class="share-close" value="cancel">閉じる</button></form>`;
  appRoot().append(shareDialog);
  const appUrl = new URL(".", location.href).href;
  const shareText = `旅のチケットを発券して、旅程も持ち物もまとめて準備できる旅行アプリ「たびチケ」✈️ ${appUrl}`;
  shareDialog.querySelector("[data-share-x]").href = `https://x.com/intent/post?text=${encodeURIComponent(shareText)}`;
  shareDialog.querySelector("[data-share-line]").href = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(appUrl)}`;
  appRoot().querySelector(".share").addEventListener("click", () => shareDialog.showModal());
  shareDialog.addEventListener("click", (event) => { if (event.target === shareDialog) shareDialog.close(); });
  shareDialog.querySelector("[data-share-copy]").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      toast("リンクをコピーしました");
    } catch {
      toast("リンクをコピーできませんでした");
    }
    shareDialog.close();
  });
  appRoot().onclick = async (event) => {
    const copyButton = event.target.closest("[data-copy-trip]");
    if (copyButton) {
      const source = currentData.trips.find((trip) => trip.id === copyButton.dataset.copyTrip);
      if (!source) return;
      const now = new Date().toISOString();
      const copy = {
        ...source, id: createId(), title: `${[...source.title].slice(0, 36).join("")}（コピー）`, createdAt: now, updatedAt: now,
        items: (source.items || []).map((item) => ({ ...item, id: createId(), done: false })),
        packing: (source.packing || []).map((item) => ({ ...item, id: createId(), checked: false })),
        expenses: [],
      };
      const next = { ...currentData, trips: [...currentData.trips, copy] };
      if (saveData(next)) { currentData = next; toast("旅行を複製しました"); renderHome(next); }
      return;
    }
    const deleteButton = event.target.closest("[data-delete-trip]");
    if (!deleteButton) return;
    const targetTrip = currentData.trips.find((trip) => trip.id === deleteButton.dataset.deleteTrip);
    if (!targetTrip) return;
    const confirmed = await confirmDialog({ title: "この旅行を削除しますか？", message: `「${targetTrip.title}」の旅程・持ち物・費用がすべて消えます。元に戻せません。`, confirmLabel: "削除する", danger: true });
    if (!confirmed) return;
    const next = { ...currentData, trips: currentData.trips.filter((trip) => trip.id !== targetTrip.id) };
    if (saveData(next)) { currentData = next; toast("旅行を削除しました"); renderHome(next); }
  };

  const clock = () => {
    const element = appRoot().querySelector("[data-clock]");
    if (!element) return;
    const now = new Date();
    element.textContent = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  };
  clock();
  clockTimer = setInterval(clock, 30000);
  animateFlaps();
}

function animateFlaps() {
  if (reducedMotion) return;
  document.querySelectorAll(".board-count [data-flaps]").forEach((container) => {
    [...container.children].forEach((flap, index) => {
      const final = flap.textContent;
      if (final === " ") return;
      let remaining = 5 + index * 2;
      const timer = setInterval(() => {
        flap.classList.remove("tick");
        void flap.offsetWidth;
        flap.classList.add("tick");
        remaining -= 1;
        if (remaining <= 0) {
          flap.textContent = final;
          clearInterval(timer);
        } else flap.textContent = FLAP_CHARS[Math.floor(Math.random() * FLAP_CHARS.length)];
      }, 50);
    });
  });
}

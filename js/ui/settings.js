import { createId, createEmptyData, normalizeTrip } from "../models.js";
import { saveData } from "../store.js";
import { appRoot } from "../utils/dom.js";
import { localDateString } from "../utils/date.js";
import { header } from "./common.js";
import { confirmDialog } from "../utils/dialog.js";
import { toast } from "../utils/toast.js";
import { getShareTokenFromLink } from "../utils/share.js";

export function renderSettings(data) {
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  appRoot().innerHTML = `<div class="app-shell settings-shell">${header("設定", { back: "#/" })}<main class="page-content settings-content">
    <section class="settings-card"><h2>データのバックアップ</h2><p>データはこの端末のブラウザの中だけに保存されています。ブラウザのデータを消すと旅行も消えるので、ときどき書き出して控えを取っておきましょう。</p><div class="settings-actions"><button class="secondary-button" type="button" data-export>データを書き出す</button><button class="secondary-button" type="button" data-import>データを読み込む</button><input id="backup-file" type="file" accept="application/json,.json" hidden></div></section>
    <section class="settings-card"><h2>共有リンクから取り込む</h2><p>ホーム画面に追加したたびチケは、Safariとは別にデータを保存しています。LINEなどで受け取ったリンクをSafariで開いた場合は、ここにリンクを貼り付けると取り込めます。</p><form class="share-link-form"><div><input name="shareLink" aria-label="共有リンクを貼り付け" placeholder="共有リンクを貼り付け"><button class="primary-button" type="submit">開く</button></div><p class="field-error" data-share-link-error aria-live="polite"></p></form></section>
    ${standalone ? "" : `<section class="settings-card"><h2>ホーム画面に追加する方法</h2><p>iPhoneのSafariで開き、共有ボタン →「ホーム画面に追加」を押すと、アプリのように使えます。</p></section>`}
    <section class="settings-card"><h2>すべてのデータを削除</h2><p>保存した旅行と関連データをすべて削除します。</p><button class="danger-button" type="button" data-clear>すべてのデータを削除</button></section>
    <section class="settings-card"><h2>このアプリについて</h2><p>このアプリはチップ商会 開発部（AI社員）がつくりました。</p><p>アクセス数の計測に Cloudflare Web Analytics を使っています（Cookie は使わず、個人を特定する情報や旅行の内容は送信しません）</p><p class="version-label">v0.1.0</p><div class="settings-links"><a href="https://chipshokai.com" target="_blank" rel="noopener">公式サイト</a><a href="https://x.com/chip_shokai" target="_blank" rel="noopener">X</a><a href="https://note.com/chip_shokai" target="_blank" rel="noopener">note</a></div></section>
    ${footerMarkup()}
  </main><dialog class="share-sheet" id="settings-share"><h2>このアプリをシェア</h2><form method="dialog"><a data-share-x target="_blank" rel="noopener">Xでシェア</a><a data-share-line target="_blank" rel="noopener">LINEで送る</a><button type="button" data-share-copy>リンクをコピー</button><button class="share-close" value="cancel">閉じる</button></form></dialog></div>`;
  const file = document.getElementById("backup-file");
  const shareLinkForm = document.querySelector(".share-link-form");
  shareLinkForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const token = getShareTokenFromLink(shareLinkForm.elements.shareLink.value);
    const error = document.querySelector("[data-share-link-error]");
    if (!token) { error.textContent = "たびチケの共有リンクではないようです"; return; }
    error.textContent = "";
    location.hash = `#/s/${token}`;
  });
  shareLinkForm.elements.shareLink.addEventListener("input", () => { document.querySelector("[data-share-link-error]").textContent = ""; });
  document.querySelector("[data-export]").addEventListener("click", () => exportData(data));
  document.querySelector("[data-import]").addEventListener("click", () => file.click());
  file.addEventListener("change", async () => {
    const selected = file.files?.[0]; if (!selected) return;
    try {
      const parsed = JSON.parse(await selected.text());
      if (!parsed || !Number.isInteger(parsed.schemaVersion) || !Array.isArray(parsed.trips) || !parsed.trips.every((trip) => trip && typeof trip === "object" && typeof trip.id === "string")) throw new TypeError("Invalid backup");
      chooseImportMode(parsed, data);
    } catch { toast("このファイルは読み込めませんでした"); }
    finally { file.value = ""; }
  });
  document.querySelector("[data-clear]").addEventListener("click", async () => {
    if (!await confirmDialog({ title: "すべての旅行を削除しますか？", message: "書き出していないデータは元に戻せません。", confirmLabel: "すべて削除", danger: true })) return;
    if (saveData(createEmptyData())) { toast("すべての旅行を削除しました"); location.hash = "#/"; }
  });
  bindShare(document.getElementById("settings-share"));
}

function chooseImportMode(backup, current) {
  const dialog = document.createElement("dialog"); dialog.className = "bottom-sheet";
  dialog.innerHTML = `<h2>データを読み込む</h2><p class="sheet-intro">読み込み方法を選んでください。</p><div class="import-options"><button type="button" data-import-add>今のデータに追加する</button><button type="button" data-import-replace>今のデータと入れ替える</button></div><button class="secondary-button sheet-close" type="button">キャンセル</button>`;
  document.body.append(dialog); dialog.showModal();
  dialog.querySelector("[data-import-add]").addEventListener("click", () => {
    const ids = new Set(current.trips.map((trip) => trip.id));
    const imported = backup.trips.map((raw) => { const trip = normalizeTrip(raw); if (ids.has(trip.id)) trip.id = createId(); ids.add(trip.id); return trip; });
    if (saveData({ ...current, trips: [...current.trips, ...imported] })) { toast(`${imported.length}件の旅行を読み込みました`); dialog.close(); location.hash = "#/"; }
  });
  dialog.querySelector("[data-import-replace]").addEventListener("click", async () => {
    dialog.close();
    if (!await confirmDialog({ title: "今のデータはすべて消えて、読み込んだデータに置き換わります。よろしいですか？", message: "", confirmLabel: "入れ替える", danger: true })) return;
    const trips = backup.trips.map((trip) => normalizeTrip(trip));
    if (saveData({ ...createEmptyData(), schemaVersion: backup.schemaVersion, trips })) { toast(`${trips.length}件の旅行を読み込みました`); dialog.close(); location.hash = "#/"; }
  });
  dialog.querySelector(".sheet-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener("close", () => dialog.remove(), { once: true });
}

function exportData(data) {
  try {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a");
    link.href = url; link.download = `tabichike-backup-${localDateString().replaceAll("-", "")}.json`;
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch { toast("データを書き出せませんでした"); }
}

function footerMarkup() {
  return `<footer class="settings-footer"><div>つくったのは チップ商会 開発部</div><nav aria-label="外部リンク"><a href="https://chipshokai.com" target="_blank" rel="noopener">公式サイト</a><a href="https://x.com/chip_shokai" target="_blank" rel="noopener">X</a><a href="https://note.com/chip_shokai" target="_blank" rel="noopener">note</a></nav><button class="share" type="button" data-open-share>↗ このアプリをシェア</button></footer>`;
}

function bindShare(dialog) {
  const appUrl = new URL(".", location.href).href;
  const shareText = `旅のチケットを発券して、旅程も持ち物もまとめて準備できる旅行アプリ「たびチケ」✈️ ${appUrl}`;
  dialog.querySelector("[data-share-x]").href = `https://x.com/intent/post?text=${encodeURIComponent(shareText)}`;
  dialog.querySelector("[data-share-line]").href = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(appUrl)}`;
  document.querySelector("[data-open-share]").addEventListener("click", () => dialog.showModal());
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
  dialog.querySelector("[data-share-copy]").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(appUrl); toast("リンクをコピーしました"); }
    catch { toast("リンクをコピーできませんでした"); }
    dialog.close();
  });
}

import { createCollaborativeTrip } from "../collab/repo.js";
import { getNickname, hasNickname, removeJoinedTrip, saveNickname, storeTripChecks, upsertJoinedTrip } from "../collab/local.js";
import { loadData, saveData } from "../store.js";
import { escapeHTML } from "../utils/dom.js";
import { toast } from "../utils/toast.js";

const INVITE_BASE = "https://tabichike.chipshokai.com/#/j/";

export function showConversionSheet(trip) {
  const dialog = document.createElement("dialog");
  dialog.className = "bottom-sheet collab-sheet";
  const nicknameField = hasNickname() ? "" : `<label>ニックネーム（空でもOK）<input name="nickname" maxlength="20" placeholder="例：てん" value="${escapeHTML(getNickname())}"></label>`;
  dialog.innerHTML = `<h2>みんなで編集する <small class="beta-label">BETA</small></h2><p class="sheet-intro">この旅行をサーバーに保存して、招待した人と一緒に編集できるようにします。招待リンクを知っている人は、誰でも見たり編集したりできます。</p><a class="collab-privacy-link" href="/privacy/">プライバシーポリシー</a><form class="sheet-form">${nicknameField}<p class="sheet-error" aria-live="polite"></p><button class="primary-button" type="submit">サーバーに保存して招待する</button><button class="secondary-button sheet-close" type="button">キャンセル</button></form>`;
  document.body.append(dialog); dialog.showModal();
  dialog.querySelector(".sheet-close").onclick = () => dialog.close();
  dialog.querySelector("form").onsubmit = async (event) => {
    event.preventDefault();
    const button = dialog.querySelector('[type="submit"]'); button.disabled = true; button.textContent = "保存しています…";
    const nickname = hasNickname() ? getNickname() : dialog.querySelector('[name="nickname"]')?.value || "";
    if (!saveNickname(nickname)) { button.disabled = false; button.textContent = "サーバーに保存して招待する"; dialog.querySelector(".sheet-error").textContent = "端末に保存できませんでした"; return; }
    try {
      if (!navigator.onLine) throw new Error("Offline");
      const result = await createCollaborativeTrip(trip, nickname);
      const collab = { ...trip, ...result.header, id: result.id, collaborative: true, isOwner: true };
      const checks = Object.fromEntries((trip.packing || []).filter((item) => item.checked).map((item) => [item.id, true]));
      const registered = upsertJoinedTrip(collab) && storeTripChecks(result.id, checks);
      if (!registered) { removeJoinedTrip(result.id); throw new Error("Could not save the local joined trip"); }
      const data = loadData();
      if (!saveData({ ...data, trips: data.trips.filter((entry) => entry.id !== trip.id) })) { removeJoinedTrip(result.id); throw new Error("Could not remove the local trip"); }
      dialog.close();
      location.hash = `#/trip/${encodeURIComponent(result.id)}`;
      setTimeout(() => showInviteSheet(result.id, collab), 0);
    } catch {
      button.disabled = false; button.textContent = "サーバーに保存して招待する";
      toast("サーバーに保存できませんでした。電波のよい場所でもう一度お試しください");
    }
  };
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener("close", () => dialog.remove(), { once: true });
}

export function showInviteSheet(tripId, trip = {}) {
  const link = `${INVITE_BASE}${encodeURIComponent(tripId)}`;
  const dialog = document.createElement("dialog"); dialog.className = "bottom-sheet collab-sheet";
  dialog.innerHTML = `<h2>メンバーを招待</h2><p class="sheet-intro">${escapeHTML(trip.title || "共同旅行")}</p><label>招待リンク<input readonly value="${escapeHTML(link)}"></label><p class="sheet-intro">このリンクを知っている人は、誰でもこの旅行を見たり編集したりできます。</p><div class="settings-actions"><a class="primary-button" target="_blank" rel="noopener" href="https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(link)}">LINEで送る</a><button class="secondary-button" type="button" data-copy>リンクをコピー</button>${navigator.share ? `<button class="secondary-button" type="button" data-share>その他のアプリで送る</button>` : ""}<button class="secondary-button" type="button" data-close>閉じる</button></div>`;
  document.body.append(dialog); dialog.showModal();
  dialog.querySelector("[data-copy]").onclick = async () => { try { await navigator.clipboard.writeText(link); toast("リンクをコピーしました"); } catch { toast("リンクをコピーできませんでした"); } };
  dialog.querySelector("[data-share]")?.addEventListener("click", async () => { try { await navigator.share({ title: trip.title || "たびチケ", text: "旅行に招待されています", url: link }); } catch {} });
  dialog.querySelector("[data-close]").onclick = () => dialog.close();
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener("close", () => dialog.remove(), { once: true });
}

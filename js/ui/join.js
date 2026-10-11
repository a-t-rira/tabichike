import { readCollaborativeTrip } from "../collab/repo.js";
import { getNickname, hasNickname, readCollabState, saveNickname, upsertJoinedTrip } from "../collab/local.js";
import { appRoot, escapeHTML } from "../utils/dom.js";
import { header, ticket } from "./common.js";
import { toast } from "../utils/toast.js";

export async function renderJoin(tripId) {
  if (readCollabState().trips.some((trip) => trip.id === tripId)) { location.hash = `#/trip/${encodeURIComponent(tripId)}`; return; }
  appRoot().innerHTML = `<div class="app-shell">${header("旅行への招待", { back: "#/" })}<main class="page-content"><div class="loading-state">招待を確認しています…</div></main></div>`;
  try {
    const trip = await readCollaborativeTrip(tripId);
    if (!trip) { invalidInvite(); return; }
    trip.collaborative = true;
    appRoot().innerHTML = `<div class="app-shell join-page">${header("旅行への招待", { back: "#/" })}<main class="page-content"><h2 class="join-heading">✈ 旅行に招待されています</h2><div class="join-ticket">${ticket(trip, { interactive: false })}</div><form class="sheet-form join-form">${hasNickname() ? `<p>ニックネーム：${escapeHTML(getNickname() || "だれか")}</p>` : `<label>ニックネーム（空でもOK）<input name="nickname" maxlength="20" placeholder="例：てん" value="${escapeHTML(getNickname())}"></label>`}<button class="primary-button" type="submit">この旅行に参加する</button><a class="secondary-button" href="#/">ホームへ</a></form></main></div>`;
    appRoot().querySelector(".join-form").onsubmit = (event) => {
      event.preventDefault();
      const nickname = hasNickname() ? getNickname() : appRoot().querySelector('[name="nickname"]')?.value || "";
      if (!saveNickname(nickname) || !upsertJoinedTrip(trip)) { toast("端末に保存できませんでした"); return; }
      location.hash = `#/trip/${encodeURIComponent(trip.id)}`;
      toast("旅行に参加しました ✈️");
    };
  } catch {
    if (!navigator.onLine) {
      appRoot().innerHTML = `<div class="app-shell">${header("旅行への招待", { back: "#/" })}<main class="page-content"><section class="empty-state"><div class="empty-illustration">📡</div><p>招待を開くにはインターネットへの接続が必要です</p><a class="secondary-button" href="#/">ホームへ</a></section></main></div>`;
    } else invalidInvite();
  }
}

function invalidInvite() {
  appRoot().innerHTML = `<div class="app-shell">${header("旅行への招待", { back: "#/" })}<main class="page-content"><section class="empty-state"><div class="empty-illustration">🎫</div><p>この招待リンクは開けませんでした。旅行が削除されたか、リンクが途中で切れている可能性があります。</p><a class="secondary-button" href="#/">ホームへ</a></section></main></div>`;
}

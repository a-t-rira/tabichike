import { ticket } from "./common.js";
import { createSharePayload, encodeSharePayload } from "../utils/share.js";
import { toast } from "../utils/toast.js";

const LONG_LINK_NOTICE = "予定が多いため、アプリによってはリンクが開けないことがあります。メモや費用を外すと短くなります。";

export async function showTripShareSheet(trip) {
  const dialog = document.createElement("dialog");
  dialog.className = "bottom-sheet trip-share-dialog";
  const memoSwitch = trip.memo?.trim() ? `<label class="share-toggle"><span>メモも共有する</span><input type="checkbox" name="includeMemo" checked><i aria-hidden="true"></i></label>` : "";
  const financeSwitch = trip.budget != null || trip.expenses?.length ? `<label class="share-toggle"><span>予算と費用も共有する</span><input type="checkbox" name="includeFinance"><i aria-hidden="true"></i></label>` : "";
  const nativeShare = typeof navigator.share === "function" ? `<button class="secondary-button" type="button" data-native-share>その他のアプリで送る</button>` : "";
  dialog.innerHTML = `<h2>旅行を共有</h2><div class="share-ticket-preview">${ticket(trip, { interactive: false })}</div><div class="share-toggles">${memoSwitch}${financeSwitch}</div><p class="share-explain">リンクを知っている人は、誰でもこの旅行を見られます。データはリンクの中にだけ入っていて、どこにも保存されません。</p><div class="share-trip-actions"><a class="primary-button" data-line-share target="_blank" rel="noopener">LINEで送る</a><button class="secondary-button" type="button" data-copy-share>リンクをコピー</button>${nativeShare}<p class="share-long-link" data-link-warning hidden>${LONG_LINK_NOTICE}</p></div><button class="secondary-button share-dialog-close" type="button">閉じる</button>`;
  document.body.append(dialog);

  const lineButton = dialog.querySelector("[data-line-share]");
  const warning = dialog.querySelector("[data-link-warning]");
  let shareUrl = "";
  let revision = 0;
  const updateShareUrl = async () => {
    const current = ++revision;
    const includeMemo = dialog.querySelector('[name="includeMemo"]')?.checked ?? false;
    const includeFinance = dialog.querySelector('[name="includeFinance"]')?.checked ?? false;
    const payload = createSharePayload(trip, { includeMemo, includeFinance, sharedAt });
    try {
      const token = await encodeSharePayload(payload);
      if (current !== revision) return;
      shareUrl = `${location.origin}${location.pathname}#/s/${token}`;
      lineButton.href = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`;
      warning.hidden = shareUrl.length <= 8000;
    } catch {
      toast("共有リンクを作成できませんでした");
    }
  };
  const sharedAt = new Date().toISOString();
  await updateShareUrl();
  dialog.showModal();
  dialog.querySelectorAll('.share-toggle input').forEach((input) => input.addEventListener("change", updateShareUrl));
  dialog.querySelector("[data-copy-share]").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(shareUrl); toast("共有リンクをコピーしました"); }
    catch { toast("共有リンクをコピーできませんでした"); }
  });
  dialog.querySelector("[data-native-share]")?.addEventListener("click", async () => {
    try { await navigator.share({ title: trip.title, text: `「${trip.title}」のしおりです｜たびチケ`, url: shareUrl }); }
    catch (error) { if (error?.name !== "AbortError") toast("共有できませんでした"); }
  });
  dialog.querySelector(".share-dialog-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener("close", () => dialog.remove(), { once: true });
}

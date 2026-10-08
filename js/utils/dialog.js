export function confirmDialog({ title, message, cancelLabel = "キャンセル", confirmLabel = "実行", danger = false } = {}) {
  return new Promise((resolve) => {
    const dialog = document.createElement("dialog");
    dialog.className = "confirm-dialog";
    dialog.innerHTML = `<form method="dialog"><h2>${escapeHTML(title)}</h2><p>${escapeHTML(message)}</p><div class="dialog-actions"><button value="cancel" class="secondary-button">${escapeHTML(cancelLabel)}</button><button value="confirm" class="${danger ? "danger-button" : "primary-button"}">${escapeHTML(confirmLabel)}</button></div></form>`;
    document.body.append(dialog);
    dialog.addEventListener("close", () => {
      resolve(dialog.returnValue === "confirm");
      dialog.remove();
    }, { once: true });
    dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close("cancel"); });
    dialog.showModal();
  });
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

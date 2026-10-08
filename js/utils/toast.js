let timer;

export function toast(message, actionLabel = "", action = null) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.replaceChildren(document.createTextNode(message));
  if (actionLabel && action) {
    const button = document.createElement("button");
    button.type = "button"; button.className = "toast-action"; button.textContent = actionLabel;
    button.addEventListener("click", () => { action(); el.classList.remove("is-visible"); }, { once: true });
    el.append(button);
  }
  el.classList.add("is-visible");
  clearTimeout(timer);
  timer = setTimeout(() => el.classList.remove("is-visible"), 2500);
}

document.addEventListener("tabichike:toast", (event) => toast(event.detail));

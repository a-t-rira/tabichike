export function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

export function appRoot() {
  return document.getElementById("app");
}

export function currentHash() {
  return location.hash || "#/";
}

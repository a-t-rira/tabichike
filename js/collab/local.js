const COLLAB_KEY = "tabichike:collab:v1";
const BETA_KEY = "tabichike:beta";

function emptyState() {
  return { trips: [], checks: {} };
}

export function readCollabState() {
  try {
    const raw = localStorage.getItem(COLLAB_KEY);
    if (!raw) return emptyState();
    const state = JSON.parse(raw);
    if (!state || !Array.isArray(state.trips) || !state.checks || typeof state.checks !== "object") return emptyState();
    return state;
  } catch { return emptyState(); }
}

export function writeCollabState(state) {
  try { localStorage.setItem(COLLAB_KEY, JSON.stringify(state)); return true; }
  catch { return false; }
}

export function saveNickname(nickname) {
  const state = readCollabState();
  state.nickname = [...String(nickname ?? "").trim()].slice(0, 20).join("");
  return writeCollabState(state);
}

export function hasNickname() {
  const state = readCollabState();
  return typeof state.nickname === "string";
}

export function getNickname() {
  const state = readCollabState();
  return typeof state.nickname === "string" ? state.nickname : "";
}

export function upsertJoinedTrip(trip, { joinedAt = new Date().toISOString() } = {}) {
  const state = readCollabState();
  const existing = state.trips.find((entry) => entry.id === trip.id);
  const entry = {
    id: trip.id,
    joinedAt: existing?.joinedAt || joinedAt,
    title: trip.title || "共同旅行",
    destination: trip.destination || "",
    startDate: trip.startDate || "",
    endDate: trip.endDate || "",
    color: trip.color || "sunset",
  };
  state.trips = [...state.trips.filter((candidate) => candidate.id !== trip.id), entry];
  return writeCollabState(state);
}

export function removeJoinedTrip(tripId) {
  const state = readCollabState();
  state.trips = state.trips.filter((trip) => trip.id !== tripId);
  delete state.checks[tripId];
  return writeCollabState(state);
}

export function updateTripSummary(trip) {
  const state = readCollabState();
  const entry = state.trips.find((candidate) => candidate.id === trip.id);
  if (!entry) return false;
  Object.assign(entry, { title: trip.title || "共同旅行", destination: trip.destination || "", startDate: trip.startDate || "", endDate: trip.endDate || "", color: trip.color || "sunset" });
  return writeCollabState(state);
}

export function getTripChecks(tripId) {
  return readCollabState().checks[tripId] || {};
}

export function setTripCheck(tripId, itemId, checked) {
  const state = readCollabState();
  state.checks[tripId] ||= {};
  if (checked) state.checks[tripId][itemId] = true;
  else delete state.checks[tripId][itemId];
  return writeCollabState(state);
}

export function storeTripChecks(tripId, checks) {
  const state = readCollabState();
  state.checks[tripId] = checks;
  return writeCollabState(state);
}

export function homeSummariesRefreshedToday(date) { return readCollabState().homeRefreshDate === date; }
export function markHomeSummariesRefreshed(date) { const state = readCollabState(); state.homeRefreshDate = date; return writeCollabState(state); }

export function isBetaEnabled() {
  try { return localStorage.getItem(BETA_KEY) === "1"; } catch { return false; }
}

export function enableBetaFromQuery() {
  if (new URLSearchParams(location.search).get("beta") !== "1") return;
  try { localStorage.setItem(BETA_KEY, "1"); } catch { /* Beta stays off if storage is unavailable. */ }
}

export function disableBeta() {
  try { localStorage.removeItem(BETA_KEY); return true; } catch { return false; }
}

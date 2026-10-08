export const TRIP_COLORS = Object.freeze({
  sunset: "#FF6B3D",
  sky: "#3BA7E0",
  mint: "#2EC4A6",
  rose: "#F2668B",
  gold: "#C9A227",
});

export const BASIC_PACKING = Object.freeze([
  ["財布", "valuables"], ["身分証", "valuables"], ["保険証", "valuables"], ["家の鍵", "valuables"],
  ["スマホ", "devices"], ["充電器", "devices"], ["モバイルバッテリー", "devices"],
  ["ハンカチ", "other"], ["ティッシュ", "other"], ["常備薬", "other"],
]);

export function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function createEmptyData() {
  return { schemaVersion: 1, trips: [], updatedAt: new Date().toISOString() };
}

// Optional Trip.importedFrom is { sharedAt: ISO8601, title } for trips imported from a shared link.
export function createTrip(values = {}) {
  const now = new Date().toISOString();
  return {
    id: createId(), title: "", destination: "", startDate: "", endDate: "",
    members: [], budget: null, color: "sunset", memo: "", items: [], packing: [], expenses: [],
    createdAt: now, updatedAt: now, ...values,
  };
}

export function createPackingItem(name, category) {
  return { id: createId(), name, category, checked: false };
}

export function normalizeTrip(trip) {
  if (!trip || typeof trip !== "object") return trip;
  return {
    ...trip,
    items: Array.isArray(trip.items) ? trip.items.map((item) => ({ ...item, done: typeof item.done === "boolean" ? item.done : false })) : [],
    packing: Array.isArray(trip.packing) ? trip.packing : [],
    expenses: Array.isArray(trip.expenses) ? trip.expenses : [],
    members: Array.isArray(trip.members) ? trip.members : [],
  };
}

export function durationLabel(startDate, endDate) {
  if (!isDateString(startDate) || !isDateString(endDate) || endDate < startDate) return "";
  const days = Math.round((Date.parse(`${endDate}T00:00:00`) - Date.parse(`${startDate}T00:00:00`)) / 86400000) + 1;
  return days === 1 ? "日帰り" : `${days - 1}泊${days}日`;
}

export function validateTrip(values) {
  const errors = {};
  const title = String(values.title ?? "").trim();
  if (!title) errors.title = "旅行のなまえを入れてください";
  else if ([...title].length > 40) errors.title = "40文字以内で入れてください";
  const destination = String(values.destination ?? "").trim();
  if ([...destination].length > 40) errors.destination = "40文字以内で入れてください";
  if (!isDateString(values.startDate)) errors.startDate = "出発日を入れてください";
  if (!isDateString(values.endDate)) errors.endDate = "帰る日を入れてください";
  if (isDateString(values.startDate) && isDateString(values.endDate)) {
    if (values.endDate < values.startDate) errors.endDate = "帰る日は出発日以降にしてください";
    else {
      const days = Math.round((Date.parse(`${values.endDate}T00:00:00`) - Date.parse(`${values.startDate}T00:00:00`)) / 86400000) + 1;
      if (days > 30) errors.endDate = "30日以内の旅行にしてください";
    }
  }
  const budgetText = values.budgetText;
  if (budgetText !== "" && budgetText != null && (!/^\d+$/.test(String(budgetText)) || Number(budgetText) < 0)) {
    errors.budget = "0以上の整数で入れてください";
  }
  if (!Object.hasOwn(TRIP_COLORS, values.color)) errors.color = "チケットの色を選んでください";
  if ([...(values.memo ?? "")].length > 500) errors.memo = "500文字以内で入れてください";
  if ((values.members ?? []).length > 10 || values.members?.some((member) => [...member].length > 20)) errors.members = "同行者は10人まで、各20文字以内で入れてください";
  return errors;
}

export function isDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

import { createEmptyData, normalizeTrip } from "./models.js";

export const STORAGE_KEY = "tabichike:v1";

export function migrate(data) {
  // TODO: schemaVersion が 1 より古い形式の移行が定義されたら追加する（v1では変更なし）。
  return data;
}

function showToast(message) {
  document.dispatchEvent(new CustomEvent("tabichike:toast", { detail: message }));
}

export function loadData() {
  let raw;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    showToast("データを読み込めなかったため、新しく始めました（元のデータは退避済み）");
    return createEmptyData();
  }
  if (raw == null) return createEmptyData();
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.trips) || !Number.isInteger(parsed.schemaVersion)) throw new TypeError("Invalid app data");
    const migrated = migrate(parsed);
    return { ...migrated, schemaVersion: 1, trips: migrated.trips.map(normalizeTrip) };
  } catch {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      localStorage.setItem(`${STORAGE_KEY}:broken-${timestamp}`, raw);
    } catch {
      // localStorage 自体が使えない場合も、アプリの起動は続ける。
    }
    showToast("データを読み込めなかったため、新しく始めました（元のデータは退避済み）");
    return createEmptyData();
  }
}

export function saveData(data) {
  const next = { ...data, schemaVersion: 1, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return true;
  } catch {
    showToast("保存できませんでした。データを書き出して控えを取ってください");
    return false;
  }
}

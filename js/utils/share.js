import { createId, createTrip, TRIP_COLORS, isDateString } from "../models.js";

const ITINERARY_CATEGORIES = new Set(["move", "sight", "food", "stay", "other"]);
const PACKING_CATEGORIES = new Set(["valuables", "devices", "clothes", "toiletries", "other"]);
const EXPENSE_CATEGORIES = new Set(["move", "stay", "food", "sight", "shopping", "other"]);

export function createSharePayload(trip, { includeMemo = true, includeFinance = false, sharedAt = new Date().toISOString() } = {}) {
  const sharedTrip = {
    title: trip.title,
    destination: trip.destination || "",
    startDate: trip.startDate,
    endDate: trip.endDate,
    color: trip.color,
    members: [...(trip.members || [])],
    items: (trip.items || []).map(({ date, time, endTime, title, category, place, memo }) => ({ date, time: time ?? null, endTime: endTime ?? null, title, category, place: place || "", memo: memo || "" })),
    packing: (trip.packing || []).map(({ name, category }) => ({ name, category })),
  };
  if (includeMemo && trip.memo?.trim()) sharedTrip.memo = trip.memo;
  if (includeFinance) {
    if (trip.budget != null) sharedTrip.budget = trip.budget;
    sharedTrip.expenses = (trip.expenses || []).map(({ date, title, amount, category, memo }) => ({ date: date ?? null, title, amount, category, memo: memo || "" }));
  }
  return { v: 1, sharedAt, trip: sharedTrip };
}

export async function encodeSharePayload(payload) {
  const json = JSON.stringify(payload);
  if (typeof CompressionStream === "function") {
    try {
      const stream = new Blob([json]).stream().pipeThrough(new CompressionStream("deflate-raw"));
      return `1.${bytesToBase64Url(new Uint8Array(await new Response(stream).arrayBuffer()))}`;
    } catch {
      // deflate-raw is not available in every browser; use the specified uncompressed form.
    }
  }
  return `0.${bytesToBase64Url(new TextEncoder().encode(json))}`;
}

export async function decodeSharePayload(token) {
  if (typeof token !== "string" || !/^[01]\.[A-Za-z0-9_-]+$/.test(token)) throw new TypeError("Invalid share link");
  const marker = token[0];
  let bytes = base64UrlToBytes(token.slice(2));
  if (marker === "1") {
    if (typeof DecompressionStream !== "function") throw new TypeError("Compressed share links are unsupported");
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  }
  const payload = JSON.parse(new TextDecoder().decode(bytes));
  if (!validateSharePayload(payload)) throw new TypeError("Invalid share data");
  return payload;
}

export function validateSharePayload(payload) {
  if (!hasOnlyKeys(payload, ["v", "sharedAt", "trip"]) || payload.v !== 1 || !validISODateTime(payload.sharedAt)) return false;
  const trip = payload.trip;
  if (!hasOnlyKeys(trip, ["title", "destination", "startDate", "endDate", "color", "members", "memo", "budget", "items", "packing", "expenses"])) return false;
  if (!validText(trip.title, 1, 40, true) || !validText(trip.destination, 0, 40)) return false;
  if (!isDateString(trip.startDate) || !isDateString(trip.endDate) || trip.endDate < trip.startDate || tripDays(trip.startDate, trip.endDate) > 30) return false;
  if (!Object.hasOwn(TRIP_COLORS, trip.color) || !Array.isArray(trip.members) || trip.members.length > 10 || !trip.members.every((name) => validText(name, 0, 20))) return false;
  if (Object.hasOwn(trip, "memo") && !validText(trip.memo, 0, 500)) return false;
  if (Object.hasOwn(trip, "budget") && (!Number.isInteger(trip.budget) || trip.budget < 0)) return false;
  if (!Array.isArray(trip.items) || !trip.items.every((item) => validItineraryItem(item, trip))) return false;
  if (!Array.isArray(trip.packing) || !trip.packing.every(validPackingItem)) return false;
  if (Object.hasOwn(trip, "expenses") && (!Array.isArray(trip.expenses) || !trip.expenses.every(validExpense))) return false;
  return true;
}

export function createSharedPreviewTrip(payload) {
  return {
    id: "",
    ...payload.trip,
    memo: payload.trip.memo || "",
    budget: payload.trip.budget ?? null,
    items: payload.trip.items.map((item) => ({ ...item, done: false })),
    packing: payload.trip.packing.map((item) => ({ ...item, checked: false })),
    expenses: payload.trip.expenses || [],
  };
}

export function createImportedTrip(payload) {
  const source = payload.trip;
  const trip = createTrip({
    title: source.title,
    destination: source.destination,
    startDate: source.startDate,
    endDate: source.endDate,
    color: source.color,
    members: [...source.members],
    memo: source.memo || "",
    budget: source.budget ?? null,
    items: source.items.map((item) => ({ ...item, id: createId(), done: false })),
    packing: source.packing.map((item) => ({ ...item, id: createId(), checked: false })),
    expenses: (source.expenses || []).map((item) => ({ ...item, id: createId() })),
    importedFrom: { sharedAt: payload.sharedAt, title: source.title },
  });
  return trip;
}

export function getShareTokenFromLink(value) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  const hashAt = text.indexOf("#");
  const hash = hashAt >= 0 ? text.slice(hashAt) : text;
  const match = hash.match(/^#\/s\/([^/?#]+)\/?$/);
  return match ? match[1] : null;
}

function validItineraryItem(item, trip) {
  return Boolean(hasOnlyKeys(item, ["date", "time", "endTime", "title", "category", "place", "memo"]) && isDateString(item.date) && item.date >= trip.startDate && item.date <= trip.endDate
    && (item.time === null || validTime(item.time)) && (item.endTime === null || validTime(item.endTime))
    && (!item.time || !item.endTime || item.endTime > item.time)
    && validText(item.title, 1, 40, true) && ITINERARY_CATEGORIES.has(item.category)
    && validText(item.place, 0, 60) && validText(item.memo, 0, 200));
}

function validPackingItem(item) {
  return Boolean(hasOnlyKeys(item, ["name", "category"]) && validText(item.name, 1, 30, true) && PACKING_CATEGORIES.has(item.category));
}

function validExpense(item) {
  return Boolean(hasOnlyKeys(item, ["date", "title", "amount", "category", "memo"]) && (item.date === null || isDateString(item.date))
    && validText(item.title, 1, 30, true) && Number.isInteger(item.amount) && item.amount >= 1 && item.amount <= 9999999
    && EXPENSE_CATEGORIES.has(item.category) && validText(item.memo, 0, 100));
}

function validText(value, min, max, trim = false) {
  return typeof value === "string" && (!trim || Boolean(value.trim())) && [...value].length >= min && [...value].length <= max;
}

function validTime(value) {
  if (typeof value !== "string" || !/^\d{2}:\d{2}$/.test(value)) return false;
  const [hours, minutes] = value.split(":").map(Number);
  return hours < 24 && minutes < 60;
}

function validISODateTime(value) {
  if (typeof value !== "string") return false;
  const match = value.match(/^(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/);
  return Boolean(match && isDateString(match[1]) && Number.isFinite(Date.parse(value)));
}

function hasOnlyKeys(value, keys) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).every((key) => keys.includes(key)));
}

function tripDays(start, end) {
  return Math.round((Date.parse(`${end}T00:00:00`) - Date.parse(`${start}T00:00:00`)) / 86400000) + 1;
}

function bytesToBase64Url(bytes) {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function base64UrlToBytes(value) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(base64 + "=".repeat((4 - base64.length % 4) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

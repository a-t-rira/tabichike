import { createId } from "../models.js";
import { getClient } from "./client.js";

const ITEM_FIELDS = ["date", "time", "endTime", "title", "category", "place", "memo", "done"];
const EXPENSE_FIELDS = ["date", "title", "amount", "category", "memo"];
const CHUNK_SIZE = 450;

function pick(source, fields) {
  return Object.fromEntries(fields.filter((key) => source[key] !== undefined).map((key) => [key, source[key]]));
}

function savedBy(nickname) {
  return [...String(nickname || "").trim()].slice(0, 20).join("") || "だれか";
}

function timestampToISO(value) {
  if (value && typeof value.toDate === "function") return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return typeof value === "string" ? value : "";
}

function convertDoc(snapshot) {
  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data(), updatedAt: timestampToISO(entry.data().updatedAt) }));
}

function convertTripSnapshot(snapshot) {
  if (!snapshot.exists()) return null;
  const value = snapshot.data();
  return { id: snapshot.id, ...value, createdAt: timestampToISO(value.createdAt), updatedAt: timestampToISO(value.updatedAt) };
}

function refsFor(firestore, tripId, sdk) {
  const parent = sdk.doc(firestore.db, "trips", tripId);
  return {
    parent,
    items: sdk.collection(firestore.db, "trips", tripId, "items"),
    packing: sdk.collection(firestore.db, "trips", tripId, "packing"),
    expenses: sdk.collection(firestore.db, "trips", tripId, "expenses"),
  };
}

export async function createCollaborativeTrip(trip, nickname) {
  const client = await getClient();
  const sdk = client.firestore;
  const tripRef = sdk.doc(sdk.collection(client.db, "trips"));
  const by = savedBy(nickname);
  const now = sdk.serverTimestamp();
  const header = {
    title: String(trip.title).trim().slice(0, 40), destination: String(trip.destination || "").slice(0, 40), startDate: trip.startDate, endDate: trip.endDate,
    members: Array.isArray(trip.members) ? trip.members.slice(0, 10).map((name) => String(name).slice(0, 20)) : [], budget: trip.budget == null ? null : Math.min(99999999, Math.max(0, Math.trunc(Number(trip.budget)))), color: trip.color || "sunset", memo: String(trip.memo || "").slice(0, 500),
    ownerUid: client.uid, schema: 1, createdAt: now, updatedAt: now, updatedBy: by,
  };
  await sdk.setDoc(tripRef, header);
  const refs = refsFor(client, tripRef.id, sdk);
  const writes = [];
  for (const item of trip.items || []) writes.push({ ref: sdk.doc(refs.items, item.id || createId()), data: { date: item.date, time: item.time ?? null, endTime: item.endTime ?? null, title: String(item.title || "").slice(0, 40), category: ["move", "sight", "food", "stay", "other"].includes(item.category) ? item.category : "other", place: String(item.place || "").slice(0, 60), memo: String(item.memo || "").slice(0, 200), done: Boolean(item.done), updatedAt: now, updatedBy: by } });
  for (const item of trip.packing || []) writes.push({ ref: sdk.doc(refs.packing, item.id || createId()), data: { name: String(item.name || "").slice(0, 30), category: ["valuables", "devices", "clothes", "toiletries", "other"].includes(item.category) ? item.category : "other", updatedAt: now, updatedBy: by } });
  for (const item of trip.expenses || []) writes.push({ ref: sdk.doc(refs.expenses, item.id || createId()), data: { ...(item.date !== undefined ? { date: item.date || null } : {}), title: String(item.title || "").slice(0, 30), amount: Math.min(9999999, Math.max(1, Math.trunc(Number(item.amount) || 1))), category: ["move", "stay", "food", "sight", "shopping", "other"].includes(item.category) ? item.category : "other", memo: String(item.memo || "").slice(0, 100), updatedAt: now, updatedBy: by } });
  try {
    for (let offset = 0; offset < writes.length; offset += CHUNK_SIZE) {
      const batch = sdk.writeBatch(client.db);
      writes.slice(offset, offset + CHUNK_SIZE).forEach(({ ref, data }) => batch.set(ref, data));
      await batch.commit();
    }
  } catch (error) {
    for (let offset = 0; offset < writes.length; offset += CHUNK_SIZE) {
      try {
        const batch = sdk.writeBatch(client.db);
        writes.slice(offset, offset + CHUNK_SIZE).forEach(({ ref }) => batch.delete(ref));
        await batch.commit();
      } catch { /* Keep cleanup best-effort; the source trip remains untouched. */ }
    }
    try { await sdk.deleteDoc(tripRef); } catch { /* Keep cleanup best-effort. */ }
    throw error;
  }
  return { id: tripRef.id, ownerUid: client.uid, header };
}

export async function readCollaborativeTrip(tripId) {
  const client = await getClient();
  const sdk = client.firestore;
  const refs = refsFor(client, tripId, sdk);
  const tripSnapshot = await sdk.getDoc(refs.parent);
  const trip = convertTripSnapshot(tripSnapshot);
  if (!trip) return null;
  return { ...trip, items: [], packing: [], expenses: [] };
}

export async function refreshCollaborativeSummaries(tripIds) {
  const client = await getClient();
  const sdk = client.firestore;
  const snapshots = await Promise.all(tripIds.map((id) => sdk.getDoc(sdk.doc(client.db, "trips", id))));
  return snapshots.map(convertTripSnapshot).filter(Boolean);
}

export async function watchCollaborativeTrip(tripId, onValue, onError) {
  const client = await getClient();
  const sdk = client.firestore;
  const refs = refsFor(client, tripId, sdk);
  const state = { trip: undefined, items: undefined, packing: undefined, expenses: undefined };
  let closed = false;
  const notify = () => {
    if (closed || Object.values(state).some((value) => value === undefined)) return;
    if (!state.trip) { onValue(null); return; }
    onValue({ ...state.trip, items: state.items, packing: state.packing, expenses: state.expenses });
  };
  const unsubs = [
    sdk.onSnapshot(refs.parent, (snapshot) => { state.trip = convertTripSnapshot(snapshot); notify(); }, onError),
    sdk.onSnapshot(refs.items, (snapshot) => { state.items = convertDoc(snapshot); notify(); }, onError),
    sdk.onSnapshot(refs.packing, (snapshot) => { state.packing = convertDoc(snapshot); notify(); }, onError),
    sdk.onSnapshot(refs.expenses, (snapshot) => { state.expenses = convertDoc(snapshot); notify(); }, onError),
  ];
  return () => { closed = true; unsubs.forEach((unsubscribe) => unsubscribe()); };
}

export async function saveCollaborativeItem(tripId, item, nickname) {
  const client = await getClient();
  const sdk = client.firestore;
  const refs = refsFor(client, tripId, sdk);
  const data = { ...pick(item, ITEM_FIELDS), done: Boolean(item.done), updatedAt: sdk.serverTimestamp(), updatedBy: savedBy(nickname) };
  await sdk.setDoc(sdk.doc(refs.items, item.id), data);
  await sdk.updateDoc(refs.parent, { updatedAt: sdk.serverTimestamp(), updatedBy: savedBy(nickname) });
}

export async function deleteCollaborativeItem(tripId, itemId, nickname) {
  const client = await getClient();
  const sdk = client.firestore;
  await sdk.deleteDoc(sdk.doc(client.db, "trips", tripId, "items", itemId));
  await sdk.updateDoc(sdk.doc(client.db, "trips", tripId), { updatedAt: sdk.serverTimestamp(), updatedBy: savedBy(nickname) });
}

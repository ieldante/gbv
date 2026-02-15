import type { GbvReceiptPayload, GbvSession } from "@gbv/core";

export interface GbvSessionRecord extends GbvSession {}

export interface GbvReceiptRecord {
  token: string;
  payload: GbvReceiptPayload;
}

interface MemoryStore {
  sessions: Map<string, GbvSessionRecord>;
  receipts: Map<string, GbvReceiptRecord>;
}

const globalStore = globalThis as typeof globalThis & { __GBV_MEMORY_STORE__?: MemoryStore };

function getStore(): MemoryStore {
  if (!globalStore.__GBV_MEMORY_STORE__) {
    globalStore.__GBV_MEMORY_STORE__ = {
      sessions: new Map(),
      receipts: new Map(),
    };
  }
  return globalStore.__GBV_MEMORY_STORE__;
}

export function upsertSession(record: GbvSessionRecord): void {
  getStore().sessions.set(record.sessionId, record);
}

export function getSession(sessionId: string): GbvSessionRecord | undefined {
  return getStore().sessions.get(sessionId);
}

export function markSessionUsed(sessionId: string): void {
  const store = getStore();
  const record = store.sessions.get(sessionId);
  if (!record) return;
  store.sessions.set(sessionId, { ...record, used: true });
}

export function insertReceipt(receiptId: string, record: GbvReceiptRecord): void {
  getStore().receipts.set(receiptId, record);
}

export function getReceipt(receiptId: string): GbvReceiptRecord | undefined {
  return getStore().receipts.get(receiptId);
}

export function resetMemoryStore(): void {
  const store = getStore();
  store.sessions.clear();
  store.receipts.clear();
}

// Test-only helper for deterministic expiry validation.
export function expireSessionNow(sessionId: string): void {
  const store = getStore();
  const record = store.sessions.get(sessionId);
  if (!record) return;
  store.sessions.set(sessionId, {
    ...record,
    expiresAt: new Date(Date.now() - 1000).toISOString(),
  });
}

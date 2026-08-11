import type { SimulatorInput } from "./tax/types";

const STORAGE_KEY = "freelance-tax-simulator:v1";
export const STORAGE_SCHEMA_VERSION = 1;
export const TAX_RULE_VERSION = "2026.2026-tax-reform.1";

interface StorageEnvelope {
  schemaVersion: number;
  taxRuleVersion: string;
  savedAt: string;
  input: SimulatorInput;
}

function isStoredInput(value: unknown): value is SimulatorInput {
  if (!value || typeof value !== "object") return false;
  const input = value as Partial<SimulatorInput>;
  return (
    input.year === 2026 &&
    typeof input.currentMonth === "number" &&
    Array.isArray(input.monthlyRevenue) &&
    input.monthlyRevenue.length === 12 &&
    typeof input.cumulativeRevenue === "number" &&
    typeof input.cumulativeExpenses === "number" &&
    typeof input.deductions === "object" &&
    input.deductions !== null &&
    typeof input.expenseValues === "object" &&
    input.expenseValues !== null
  );
}

function browserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadStoredInput(): SimulatorInput | null {
  const storage = browserStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StorageEnvelope>;
    if (parsed.schemaVersion !== STORAGE_SCHEMA_VERSION || !isStoredInput(parsed.input)) {
      storage.removeItem(STORAGE_KEY);
      return null;
    }
    return structuredClone(parsed.input);
  } catch {
    try {
      storage.removeItem(STORAGE_KEY);
    } catch {
      // Storage may be disabled. The in-memory React state remains authoritative.
    }
    return null;
  }
}

export function saveStoredInput(input: SimulatorInput): boolean {
  const storage = browserStorage();
  if (!storage) return false;
  const envelope: StorageEnvelope = {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    taxRuleVersion: TAX_RULE_VERSION,
    savedAt: new Date().toISOString(),
    input,
  };
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

export function clearStoredInput(): boolean {
  const storage = browserStorage();
  if (!storage) return false;
  try {
    storage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(Number.isFinite(value) ? value : 0, minimum), maximum);
}

export function nonNegative(value: number): number {
  return Math.max(0, Number.isFinite(value) ? value : 0);
}

export function floorToThousand(value: number): number {
  return Math.floor(nonNegative(value) / 1_000) * 1_000;
}

export function floorToHundred(value: number): number {
  return Math.floor(nonNegative(value) / 100) * 100;
}

export function safeRate(amount: number, base: number): number {
  return base > 0 ? amount / base : 0;
}

export function sum(values: number[]): number {
  return values.reduce((total, value) => total + nonNegative(value), 0);
}

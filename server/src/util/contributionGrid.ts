import moment from "moment";
import random from "random";

const SPACE_FONT: number[] = [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000];

const FONT_5X7: Record<string, number[]> = {
  A: [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  B: [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110],
  C: [0b01110, 0b10001, 0b10000, 0b10000, 0b10000, 0b10001, 0b01110],
  D: [0b11110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b11110],
  E: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
  F: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000],
  G: [0b01110, 0b10001, 0b10000, 0b10111, 0b10001, 0b10001, 0b01110],
  H: [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  I: [0b01110, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  J: [0b00111, 0b00010, 0b00010, 0b00010, 0b00010, 0b10010, 0b01100],
  K: [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
  L: [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
  M: [0b10001, 0b11011, 0b10101, 0b10101, 0b10001, 0b10001, 0b10001],
  N: [0b10001, 0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001],
  O: [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  P: [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
  Q: [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b10010, 0b01101],
  R: [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
  S: [0b01110, 0b10001, 0b10000, 0b01110, 0b00001, 0b10001, 0b01110],
  T: [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
  U: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  V: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
  W: [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b11011, 0b10001],
  X: [0b10001, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001, 0b10001],
  Y: [0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100, 0b00100],
  Z: [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b11111],
  " ": [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000],
  "0": [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110],
  "1": [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  "2": [0b01110, 0b10001, 0b00001, 0b00010, 0b00100, 0b01000, 0b11111],
  "3": [0b01110, 0b10001, 0b00001, 0b00110, 0b00001, 0b10001, 0b01110],
  "4": [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010],
  "5": [0b11111, 0b10000, 0b11110, 0b00001, 0b00001, 0b10001, 0b01110],
  "6": [0b01110, 0b10000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
  "7": [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
  "8": [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
  "9": [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00001, 0b01110],
};

export type Intensity = 1 | 2 | 3 | 4;

function getDayOffset(date: Date): number {
  return moment(date).day();
}

function getWeekOffset(start: Date, date: Date): number {
  const startWeek = moment(start).startOf("week");
  const currentWeek = moment(date).startOf("week");
  return currentWeek.diff(startWeek, "weeks");
}

export function textToGrid(
  text: string,
  startDate: Date,
  endDate: Date,
  intensity: Intensity = 1
): Map<string, number> {
  const schedule = new Map<string, number>();
  const upper = text.toUpperCase();
  const start = moment(startDate).startOf("week");
  const end = moment(endDate);
  const totalDays = end.diff(start, "days") + 1;

  if (totalDays <= 0) return schedule;

  for (let i = 0; i < upper.length; i++) {
    const char = upper[i] || " ";
    const fontData = FONT_5X7[char] ?? SPACE_FONT;
    const charOffset = i * 6;
    for (let row = 0; row < 7; row++) {
      const fontRow = fontData[row] || 0;
      for (let col = 0; col < 5; col++) {
        const bit = (fontRow >> (4 - col)) & 1;
        if (bit === 0) continue;

        const weekOffset = charOffset + col;
        const targetDate = moment(start).add(weekOffset, "weeks").day(row);
        const dateKey = targetDate.format("YYYY-MM-DD");

        if (targetDate.isBetween(start, end, "day", "[]")) {
          schedule.set(dateKey, intensity);
        }
      }
    }
  }

  return schedule;
}

export function randomPattern(
  startDate: Date,
  endDate: Date,
  intensity: Intensity = 1,
  density: number = 0.3
): Map<string, number> {
  const schedule = new Map<string, number>();
  const start = moment(startDate);
  const end = moment(endDate);
  const days = end.diff(start, "days") + 1;

  for (let i = 0; i < days; i++) {
    const date = moment(start).add(i, "days");
    if (random.float(0, 1) < density) {
      const commitCount = intensity;
      schedule.set(date.format("YYYY-MM-DD"), commitCount);
    }
  }

  return schedule;
}

export function applyCustomPattern(
  pattern: string,
  startDate: Date,
  endDate: Date,
  intensity: Intensity = 1
): Map<string, number> {
  const schedule = new Map<string, number>();
  const lines = pattern.split("\n").filter((l) => l.length > 0);

  if (lines.length === 0) return schedule;

  const gridHeight = lines.length;
  const gridWidth = Math.max(...lines.map((l) => l.length));

  const start = moment(startDate);
  const end = moment(endDate);
  const totalDays = end.diff(start, "days") + 1;

  for (let row = 0; row < gridHeight; row++) {
    const line = lines[row] || "";
    for (let col = 0; col < gridWidth; col++) {
      const ch = line[col];
      if (!ch || ch === " ") continue;

      const dayIndex = row;
      const weekIndex = col;

      const targetDate = moment(start).startOf("week").add(weekIndex, "weeks").day(dayIndex);

      if (targetDate.isBetween(start, end, "day", "[]")) {
        if (ch.match(/[A-Za-z0-9]/)) {
          schedule.set(targetDate.format("YYYY-MM-DD"), intensity);
        } else if (ch === "#") {
          schedule.set(targetDate.format("YYYY-MM-DD"), intensity);
        } else if (ch === "*") {
          schedule.set(targetDate.format("YYYY-MM-DD"), intensity);
        }
      }
    }
  }

  return schedule;
}

export function mergePatterns(
  ...patterns: Map<string, number>[]
): Map<string, number> {
  const merged = new Map<string, number>();
  for (const pattern of patterns) {
    for (const [date, count] of pattern) {
      merged.set(date, Math.max(merged.get(date) || 0, count));
    }
  }
  return merged;
}

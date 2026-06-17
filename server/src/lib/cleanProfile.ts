const EXCLUDED_KEYS = new Set([
  "_id",
  "__v",
  "user",
  "firebaseUID",
  "completedSteps",
  "currentStep",
  "onboardingCompleted",
  "createdAt",
  "updatedAt",
]);

export function cleanProfile(data: any, visited?: WeakSet<object>): any {
  if (
    data === null ||
    data === undefined ||
    data === ""
  ) {
    return undefined;
  }

  if (typeof data === "object") {
    if (!visited) visited = new WeakSet();

    if (visited.has(data)) return undefined;
    visited.add(data);
  }

  if (Array.isArray(data)) {
    const cleaned = data
      .map(item => cleanProfile(item, visited))
      .filter(item => item !== undefined);

    return cleaned.length > 0 ? cleaned : undefined;
  }

  if (typeof data === "object") {
    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      if (EXCLUDED_KEYS.has(key)) continue;

      const cleanedValue = cleanProfile(value, visited);

      if (cleanedValue !== undefined) {
        result[key] = cleanedValue;
      }
    }

    return Object.keys(result).length > 0
      ? result
      : undefined;
  }

  return data;
}
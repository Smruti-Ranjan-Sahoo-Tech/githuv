import { UserProfile } from "../../../models/userProfile.model";

export function cleanUserProfile(raw: Record<string, any>): Record<string, any> {
  const ignored = [
    "_id", "__v", "createdAt", "updatedAt", "user",
    "currentStep", "completedSteps", "onboardingCompleted",
    "strikeRecovery",
  ];

  const cleaned: Record<string, any> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (ignored.includes(key)) continue;
    if (value === null || value === undefined) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    if (typeof value === "object" && !Array.isArray(value)) {
      const nested = cleanUserProfile(value);
      if (Object.keys(nested).length > 0) {
        cleaned[key] = nested;
      }
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

export async function fetchUserProfileFromDB(
  firebaseUID: string
): Promise<Record<string, any> | null> {
  const profile = await UserProfile.findOne({ firebaseUID }).lean();

  if (!profile) return null;

  return cleanUserProfile(profile as Record<string, any>);
}

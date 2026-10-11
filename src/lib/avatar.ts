/**
 * URL of a member's avatar, served by /avatar/[userId]. The version (the
 * profile's updatedAt) changes whenever the profile is saved, so the response
 * can be cached by the browser forever.
 */
export function avatarUrl(userId: string, version?: Date | null) {
  return version ? `/avatar/${userId}?v=${version.getTime()}` : `/avatar/${userId}`;
}

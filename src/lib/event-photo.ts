/** Event photos are served by /event-photo/[id]; a photo never changes once uploaded. */
export function eventPhotoUrl(photoId: string) {
  return `/event-photo/${photoId}`;
}

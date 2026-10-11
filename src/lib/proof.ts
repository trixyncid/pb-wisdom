/** URL of a fee proof image, served privately by /proof/[dueId]. */
export function proofUrl(dueId: string, submittedAt?: Date | null) {
  return submittedAt ? `/proof/${dueId}?v=${submittedAt.getTime()}` : `/proof/${dueId}`;
}

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length
}

export function truncateToWordLimit(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/)
  if (words.length <= maxWords) {
    return text
  }
  return words.slice(0, maxWords).join(" ") + "..."
}

export function isWithinWordLimit(text: string, maxWords: number): boolean {
  return countWords(text) <= maxWords
}

export function getWordLimitMessage(currentWords: number, maxWords: number): string {
  const remaining = maxWords - currentWords
  if (remaining < 0) {
    return `${Math.abs(remaining)} words over limit`
  }
  return `${remaining} words remaining`
}
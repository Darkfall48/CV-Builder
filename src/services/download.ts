/**
 * Windows rejects these characters outright, and a download named with one is
 * silently dropped by the browser rather than reported.
 */
export function sanitizeFileName(value: string): string {
  return value
    .replace(/\.(docx|json)$/i, "")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.rel = "noopener"
  document.body.append(link)
  link.click()
  link.remove()
  // Firefox starts the transfer on a later tick, so revoking straight after
  // the click cancels the download it was meant to clean up after.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export function downloadText(
  text: string,
  filename: string,
  type: string,
): void {
  downloadBlob(new Blob([text], { type }), filename)
}

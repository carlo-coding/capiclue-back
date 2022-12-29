export function normalizeText(text: string) {
  return text.toLocaleLowerCase().replace(/[,\.:;-_\/]/g, '');
}

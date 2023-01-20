import { CardTypePrefixes, CardType } from "./constants";

export function wrapIndex(index: number, count: number): number {
  return ((index % count) + count) % count;
}

export function imageSizeToMBString(
  size: number,
  numDecimalPlaces: number
): string {
  /**
   * Format `size` (a size in bytes) as a string in megabytes.
   */

  const roundFactor = 10 ** numDecimalPlaces;
  let sizeMB = size / 1000000;
  sizeMB = Math.round(sizeMB * roundFactor) / roundFactor;
  return `${sizeMB} MB`;
}

export function bracket(projectSize: number): number {
  /**
   * Calculate the MPC bracket that `projectSize` falls into.
   */

  const brackets = [
    18, 36, 55, 72, 90, 108, 126, 144, 162, 180, 198, 216, 234, 396, 504, 612,
  ];
  for (let i = 0; i < brackets.length; i++) {
    if (brackets[i] >= projectSize) {
      return brackets[i];
    }
  }
  return brackets[brackets.length - 1];
}

export function processLine(line: string): [string, number] | null {
  const trimmedLine = line.replace(/\s+/g, " ").trim();
  if (trimmedLine.length == 0) {
    return null;
  }
  const re = /^([0-9]*)?x?\s?(.*)$/; // extract quantity and card name from input text
  const results = re.exec(trimmedLine);
  return [results[2].toLowerCase(), parseInt(results[1] ?? "1")];
}

export function downloadImage(imageURL: string, new_tab: boolean = true) {
  /**
   * Download an image with the given download link.
   * Note that this only works when `imageURL` has the same origin as where the link was opened from.
   */

  const element = document.createElement("a");
  element.href = imageURL;
  element.setAttribute("download", "deez.png"); // TODO: can we affect file name?
  if (new_tab) element.target = "_blank";

  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

export function downloadText(filename: string, text: string) {
  const element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text)
  );
  element.setAttribute("download", filename);

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

export function processPrefix(query: string): [string, CardType] {
  /**
   * Identify the prefix of a query. For example, `string`="t:goblin" would yield ["goblin", TOKEN].
   */

  for (const [prefix, cardType] of Object.entries(CardTypePrefixes)) {
    if (prefix != "" && query.startsWith(`${prefix}:`)) {
      return [query.slice(prefix.length + 1), cardType];
    }
  }
  return [query, CardTypePrefixes[""]];
}

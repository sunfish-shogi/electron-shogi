export enum Color {
  BLACK = "black",
  WHITE = "white",
}

export function reverseColor(color: Color): Color {
  if (color === Color.BLACK) {
    return Color.WHITE;
  }
  return Color.BLACK;
}

export function colorToSFEN(color: Color): string {
  if (color === Color.BLACK) {
    return "b";
  }
  return "w";
}

export function isValidSFENColor(sfen: string): boolean {
  return sfen === "b" || sfen === "w";
}

export function parseSFENColor(sfen: string): Color {
  return sfen === "b" ? Color.BLACK : Color.WHITE;
}

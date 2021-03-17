
export class Color {
  constructor(
    readonly r: u8,
    readonly g: u8,
    readonly b: u8
  ) {}

  toString(): string {
    return 'rgb(' +  this.r.toString() + ', ' + this.g.toString() + ', ' + this.b.toString() + ')';
  }
}

export function getPalette(size: u8): Color[] {
  const colors: Color[] = [];
  let r: u8 = 100;
  let g: u8 = 50;
  let b: u8 = 20;

  for (let i: u8 = 0; i < size; ++i) {
    colors.push(new Color(r, g, b))

    r = (r + 5) % 255;
    g = (g + 1) % 255;
    b = (b - 1) % 255;
  }

  return colors;
}

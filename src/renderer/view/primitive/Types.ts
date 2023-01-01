export class RectSize {
  constructor(public width: number, public height: number) {}
  add(size: RectSize): RectSize {
    return new RectSize(this.width + size.width, this.height + size.height);
  }
  reduce(size: RectSize): RectSize {
    return new RectSize(this.width - size.width, this.height - size.height);
  }
}

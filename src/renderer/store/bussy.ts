export class BussyStore {
  private count = 0;

  get isBussy(): boolean {
    return this.count !== 0;
  }

  retain(): void {
    this.count += 1;
  }

  release(): void {
    this.count -= 1;
  }
}

import { reactive, UnwrapNestedRefs } from "vue";

export class BussyState {
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

export function createBussyStore(): UnwrapNestedRefs<BussyState> {
  return reactive(new BussyState());
}

let store: UnwrapNestedRefs<BussyState>;

export function useBussyState(): UnwrapNestedRefs<BussyState> {
  if (!store) {
    store = createBussyStore();
  }
  return store;
}

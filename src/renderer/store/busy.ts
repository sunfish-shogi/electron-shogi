import { reactive, UnwrapNestedRefs } from "vue";

export class BusyState {
  private count = 0;

  get isBusy(): boolean {
    return this.count !== 0;
  }

  retain(): void {
    this.count += 1;
  }

  release(): void {
    this.count -= 1;
  }
}

export function createBusyStore(): UnwrapNestedRefs<BusyState> {
  return reactive(new BusyState());
}

let store: UnwrapNestedRefs<BusyState>;

export function useBusyState(): UnwrapNestedRefs<BusyState> {
  if (!store) {
    store = createBusyStore();
  }
  return store;
}

import { createErrorStore } from "@/renderer/store/error";

describe("store/error", () => {
  it("errors", () => {
    const store = createErrorStore();
    expect(store.hasError).toBeFalsy();
    expect(store.errors).toHaveLength(0);
    store.add("first error");
    expect(store.hasError).toBeTruthy();
    expect(store.errors).toHaveLength(1);
    expect(store.errors[0].message).toBe("first error");
    store.add("second error");
    expect(store.hasError).toBeTruthy();
    expect(store.errors).toHaveLength(2);
    expect(store.errors[0].message).toBe("first error");
    expect(store.errors[1].message).toBe("second error");
    store.clear();
    expect(store.hasError).toBeFalsy();
    expect(store.errors).toHaveLength(0);
  });
});

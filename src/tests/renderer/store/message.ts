import { createMessageStore } from "@/renderer/store/message";

describe("store/message", () => {
  it("message", () => {
    const store = createMessageStore();
    expect(store.hasMessage).toBeFalsy();
    store.enqueue({ text: "first message" });
    expect(store.hasMessage).toBeTruthy();
    expect(store.message.text).toBe("first message");
    expect(store.message.attachments).toBeUndefined();
    store.enqueue({
      text: "second message",
      attachments: [
        {
          type: "list",
          items: [{ text: "item1" }, { text: "item2" }],
        },
      ],
    });
    expect(store.hasMessage).toBeTruthy();
    expect(store.message.text).toBe("first message");
    expect(store.message.attachments).toBeUndefined();
    store.dequeue();
    expect(store.hasMessage).toBeTruthy();
    expect(store.message.text).toBe("second message");
    expect(store.message.attachments).toHaveLength(1);
    expect(store.message.attachments![0].type).toBe("list");
    expect(store.message.attachments![0].items).toHaveLength(2);
    expect(store.message.attachments![0].items[0].text).toBe("item1");
    expect(store.message.attachments![0].items[1].text).toBe("item2");
    store.dequeue();
    expect(store.hasMessage).toBeFalsy();
  });
});

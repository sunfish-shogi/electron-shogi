import { duplicateEngineSetting, USIEngineSetting } from "@/settings/usi";

describe("settings/usi", () => {
  it("duplicateEngineSetting", () => {
    const src: USIEngineSetting = {
      uri: "dummy",
      name: "My Test Engine",
      defaultName: "Test Engine",
      author: "Author",
      path: "/foo/bar/baz",
      options: {
        foo: {
          name: "foo",
          type: "spin",
          default: 5,
          min: 0,
          max: 10,
          vars: [],
          value: 8,
        },
      },
    };
    const out = duplicateEngineSetting(src);
    expect(out.uri).toMatch(/^es:\/\/usi-engine\/.*$/);
    expect(out.name).toBe("My Test Engine のコピー");
    expect(out.defaultName).toBe("Test Engine");
    expect(out.author).toBe("Author");
    expect(out.path).toBe("/foo/bar/baz");
    expect(out.options).toStrictEqual({
      foo: {
        name: "foo",
        type: "spin",
        default: 5,
        min: 0,
        max: 10,
        vars: [],
        value: 8,
      },
    });
    expect(out.options !== src.options).toBeTruthy();
  });
});

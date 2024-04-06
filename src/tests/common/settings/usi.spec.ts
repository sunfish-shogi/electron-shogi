import {
  duplicateEngineSetting,
  exportUSIEngineSettingForCLI,
  getUSIEngineOptionCurrentValue,
  importUSIEngineSettingForCLI,
  mergeUSIEngineSetting,
  USIEngineOption,
  USIEngineSetting,
  USIEngineSettings,
  validateUSIEngineSetting,
} from "@/common/settings/usi";

describe("settings/usi", () => {
  it("getUSIEngineOptionCurrentValue", () => {
    expect(
      getUSIEngineOptionCurrentValue({
        name: "test",
        type: "spin",
        order: 1,
        default: 5,
        min: 0,
        max: 10,
        value: 8,
      }),
    ).toBe(8);
    expect(
      getUSIEngineOptionCurrentValue({
        name: "test",
        type: "spin",
        order: 1,
        default: 5,
        min: 0,
        max: 10,
      }),
    ).toBe(5);
    expect(
      getUSIEngineOptionCurrentValue({
        name: "test",
        type: "string",
        order: 1,
        default: "foo",
        value: "bar",
      }),
    ).toBe("bar");
    expect(
      getUSIEngineOptionCurrentValue({
        name: "test",
        type: "string",
        order: 1,
        default: "foo",
      }),
    ).toBe("foo");
    expect(
      getUSIEngineOptionCurrentValue({
        name: "test",
        type: "string",
        order: 1,
      }),
    ).toBeUndefined();
    expect(
      getUSIEngineOptionCurrentValue({
        name: "test",
        type: "string",
        order: 1,
        default: "<empty>",
      }),
    ).toBe("");
    expect(
      getUSIEngineOptionCurrentValue({
        name: "test",
        type: "filename",
        order: 1,
        default: "<empty>",
      }),
    ).toBe("");
    expect(getUSIEngineOptionCurrentValue(null)).toBeUndefined();
  });

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
          order: 1,
          default: 5,
          min: 0,
          max: 10,
          value: 8,
        },
      },
      labels: {},
      enableEarlyPonder: false,
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
        order: 1,
        default: 5,
        min: 0,
        max: 10,
        value: 8,
      },
    });
    expect(out.options !== src.options).toBeTruthy();
  });

  it("mergeUSIEngineSetting", () => {
    const lhs: USIEngineSetting = {
      uri: "uri-a",
      name: "name-a",
      defaultName: "default-name-a",
      author: "author-a",
      path: "path-a",
      options: {
        foo: {
          name: "foo",
          type: "spin",
          order: 1,
          default: 5,
          min: 0,
          max: 20,
          value: 8,
        },
      },
      labels: {},
      enableEarlyPonder: false,
    };
    const rhs: USIEngineSetting = {
      uri: "uri-b",
      name: "name-b",
      defaultName: "default-name-b",
      author: "author-b",
      path: "path-b",
      options: {
        foo: {
          name: "foo",
          type: "spin",
          order: 1,
          default: 10,
          min: 0,
          max: 25,
          value: 15,
        },
      },
      labels: {
        game: true,
        mate: false,
      },
      enableEarlyPonder: false,
    };
    mergeUSIEngineSetting(lhs, rhs);
    expect(lhs).toStrictEqual({
      uri: "uri-b",
      name: "name-b",
      defaultName: "default-name-a",
      author: "author-a",
      path: "path-a",
      options: {
        foo: {
          name: "foo",
          type: "spin",
          order: 1,
          default: 5,
          min: 0,
          max: 20,
          value: 15,
        },
      },
      labels: {
        game: true,
        mate: false,
      },
      enableEarlyPonder: false,
    });
  });

  describe("validate", () => {
    const validUSIPonderOption: USIEngineOption = {
      name: "USI_Ponder",
      type: "check",
      order: 1,
      default: "true",
      value: "false",
    };
    const validUSIHashOption: USIEngineOption = {
      name: "USI_Hash",
      type: "spin",
      order: 2,
      default: 32,
      min: 1,
      value: 128,
    };
    const validStringOption: USIEngineOption = {
      name: "MyString",
      type: "string",
      order: 3,
      default: "default",
      value: "value",
    };
    const validComboOption: USIEngineOption = {
      name: "MyCombo",
      type: "combo",
      order: 4,
      default: "a",
      value: "b",
      vars: ["a", "b", "c"],
    };
    const validFilenameOption: USIEngineOption = {
      name: "MyFilename",
      type: "filename",
      order: 5,
      default: "<empty>",
      value: "/path/to/file",
    };
    const validButtonOption: USIEngineOption = {
      name: "MyButton",
      type: "button",
      order: 6,
    };

    it("ok", () => {
      expect(
        validateUSIEngineSetting({
          uri: "es://usi-engine/test",
          name: "my engine",
          defaultName: "test engine",
          author: "test author",
          path: "path/to/engine",
          options: {
            USI_Ponder: validUSIPonderOption,
            USI_Hash: validUSIHashOption,
            MyString: validStringOption,
            MyCombo: validComboOption,
            MyFilename: validFilenameOption,
            MyButton: validButtonOption,
          },
          enableEarlyPonder: false,
        }),
      ).toBeUndefined();
    });

    it("invalid-uri", () => {
      expect(
        validateUSIEngineSetting({
          uri: "es://not-usi-engine/test",
          name: "my engine",
          defaultName: "test engine",
          author: "test author",
          path: "path/to/engine",
          options: {
            USI_Ponder: validUSIPonderOption,
            USI_Hash: validUSIHashOption,
            MyString: validStringOption,
            MyCombo: validComboOption,
            MyFilename: validFilenameOption,
            MyButton: validButtonOption,
          },
          enableEarlyPonder: false,
        }),
      ).toBeInstanceOf(Error);
    });

    it("invalid-check-option", () => {
      expect(
        validateUSIEngineSetting({
          uri: "es://usi-engine/test",
          name: "my engine",
          defaultName: "test engine",
          author: "test author",
          path: "path/to/engine",
          options: {
            USI_Ponder: {
              name: "USI_Ponder",
              type: "check",
              order: 0,
              default: "true",
              value: "NOT-A-BOOLEAN",
            },
            USI_Hash: validUSIHashOption,
            MyString: validStringOption,
            MyCombo: validComboOption,
            MyFilename: validFilenameOption,
            MyButton: validButtonOption,
          },
          enableEarlyPonder: false,
        } as unknown as USIEngineSetting),
      ).toBeInstanceOf(Error);
    });

    it("invalid-spin-option", () => {
      expect(
        validateUSIEngineSetting({
          uri: "es://usi-engine/test",
          name: "my engine",
          defaultName: "test engine",
          author: "test author",
          path: "path/to/engine",
          options: {
            USI_Ponder: validUSIPonderOption,
            USI_Hash: {
              name: "USI_Hash",
              type: "spin",
              order: 0,
              default: 32,
              min: 1,
              value: "NOT-A-NUMBER",
            },
            MyString: validStringOption,
            MyCombo: validComboOption,
            MyFilename: validFilenameOption,
            MyButton: validButtonOption,
          },
          enableEarlyPonder: false,
        } as unknown as USIEngineSetting),
      ).toBeInstanceOf(Error);
    });

    it("invalid-string-option", () => {
      expect(
        validateUSIEngineSetting({
          uri: "es://usi-engine/test",
          name: "my engine",
          defaultName: "test engine",
          author: "test author",
          path: "path/to/engine",
          options: {
            USI_Ponder: validUSIPonderOption,
            USI_Hash: validUSIHashOption,
            MyString: {
              name: "MyString",
              type: "string",
              order: 0,
              default: "default",
              value: 123,
            },
            MyCombo: validComboOption,
            MyFilename: validFilenameOption,
            MyButton: validButtonOption,
          },
          enableEarlyPonder: false,
        } as unknown as USIEngineSetting),
      ).toBeInstanceOf(Error);
    });
  });

  it("USIEngineSetting", () => {
    const settings = new USIEngineSettings(
      JSON.stringify({
        engines: {
          "es://usi-engine/a": {
            uri: "es://usi-engine/a",
            name: "Engine A",
            defaultName: "engine-a",
            author: "author-a",
            path: "path-a",
            options: {},
            labels: {},
          },
        },
      }),
    );
    settings.addEngine({
      uri: "es://usi-engine/b",
      name: "Engine B",
      defaultName: "engine-b",
      author: "author-b",
      path: "path-b",
      options: {},
      labels: {},
      enableEarlyPonder: false,
    });
    expect(settings.hasEngine("es://usi-engine/a")).toBeTruthy();
    expect(settings.hasEngine("es://usi-engine/b")).toBeTruthy();
    expect(settings.hasEngine("es://usi-engine/c")).toBeFalsy();
    expect((settings.getEngine("es://usi-engine/a") as USIEngineSetting).name).toBe("Engine A");
    expect((settings.getEngine("es://usi-engine/b") as USIEngineSetting).name).toBe("Engine B");
    expect(settings.engineList).toHaveLength(2);
    expect(settings.engineList[0].name).toBe("Engine A");
    expect(settings.engineList[1].name).toBe("Engine B");
    expect(JSON.parse(settings.json).engines["es://usi-engine/a"].name).toBe("Engine A");
    expect(JSON.parse(settings.json).engines["es://usi-engine/a"].name).toBe("Engine A");
    expect(JSON.parse(settings.json).engines["es://usi-engine/c"]).toBeUndefined();
    expect(JSON.parse(settings.jsonWithIndent)).toStrictEqual(JSON.parse(settings.json));
    settings.updateEngine({
      uri: "es://usi-engine/a",
      name: "Engine A Updated",
      defaultName: "engine-a",
      author: "author-a",
      path: "path-a",
      options: {},
      labels: {},
      enableEarlyPonder: false,
    });
    expect((settings.getEngine("es://usi-engine/a") as USIEngineSetting).name).toBe(
      "Engine A Updated",
    );
    expect((settings.getEngine("es://usi-engine/b") as USIEngineSetting).name).toBe("Engine B");
    settings.removeEngine("es://usi-engine/b");
    expect(settings.hasEngine("es://usi-engine/a")).toBeTruthy();
    expect(settings.hasEngine("es://usi-engine/b")).toBeFalsy();
  });

  it("USIEngineSetting/labels", () => {
    const settings = new USIEngineSettings(
      JSON.stringify({
        engines: {
          "es://usi-engine/a": {
            labels: {
              game: true,
              research: false,
              mate: true,
            },
          },
          "es://usi-engine/b": {
            labels: {
              game: false,
            },
          },
          "es://usi-engine/c": {},
        },
      }),
    );
    const engineA = settings.getEngine("es://usi-engine/a") as USIEngineSetting;
    expect(engineA.labels).toStrictEqual({
      game: true,
      research: false,
      mate: true,
    });
    const engineB = settings.getEngine("es://usi-engine/b") as USIEngineSetting;
    expect(engineB.labels).toStrictEqual({
      game: false,
      research: true,
      mate: true,
    });
    const engineC = settings.getEngine("es://usi-engine/c") as USIEngineSetting;
    expect(engineC.labels).toStrictEqual({
      game: true,
      research: true,
      mate: true,
    });
  });

  it("USIEngineSetting/exportUSIEngineSettingForCLI", () => {
    expect(
      exportUSIEngineSettingForCLI({
        uri: "es://usi-engine/test-engine",
        name: "My Test Engine",
        defaultName: "Test Engine",
        author: "Kubo, Ryosuke",
        path: "/path/to/engine",
        options: {
          USI_Ponder: { name: "USI_Ponder", type: "check", order: 1, default: "true" },
          ClearCache: { name: "ClearCache", type: "button", order: 2 },
          BookFile: {
            name: "BookFile",
            type: "filename",
            order: 3,
            default: "book.db",
            value: "path/to/book.db",
          },
          Threads: { name: "Threads", type: "spin", order: 4, default: 1, min: 1, value: 2 },
          LogFileName: {
            name: "LogFileName",
            type: "string",
            order: 5,
            default: "log.txt",
            value: "usi.log",
          },
          JishogiRule: {
            name: "JishogiRule",
            type: "combo",
            order: 6,
            default: "standard24",
            value: "standard27",
            vars: ["standard24", "standard27", "try"],
          },
        },
        labels: {},
        enableEarlyPonder: true,
      }),
    ).toEqual({
      name: "My Test Engine",
      path: "/path/to/engine",
      options: {
        USI_Ponder: { type: "check", value: true },
        BookFile: { type: "filename", value: "path/to/book.db" },
        Threads: { type: "spin", value: 2 },
        LogFileName: { type: "string", value: "usi.log" },
        JishogiRule: { type: "combo", value: "standard27" },
      },
      enableEarlyPonder: true,
    });
  });

  it("USIEngineSetting/importUSIEngineSettingForCLI", () => {
    const result = importUSIEngineSettingForCLI({
      name: "My Test Engine",
      path: "/path/to/engine",
      options: {
        USI_Ponder: { type: "check", value: true },
        BookFile: { type: "filename", value: "path/to/book.db" },
        Threads: { type: "spin", value: 2 },
        LogFileName: { type: "string", value: "usi.log" },
        JishogiRule: { type: "combo", value: "standard27" },
      },
      enableEarlyPonder: true,
    });
    expect(result.uri).match(/^es:\/\/usi-engine\/.*$/);
    result.uri = "";
    expect(result).toEqual({
      uri: "",
      name: "My Test Engine",
      defaultName: "My Test Engine",
      author: "",
      path: "/path/to/engine",
      options: {
        USI_Ponder: { name: "USI_Ponder", type: "check", order: 0, value: "true" },
        BookFile: { name: "BookFile", type: "filename", order: 0, value: "path/to/book.db" },
        Threads: { name: "Threads", type: "spin", order: 0, value: 2 },
        LogFileName: { name: "LogFileName", type: "string", order: 0, value: "usi.log" },
        JishogiRule: {
          name: "JishogiRule",
          type: "combo",
          order: 0,
          value: "standard27",
          vars: ["standard27"],
        },
      },
      labels: {},
      enableEarlyPonder: true,
    });
  });
});

import { ArgumentsParser } from "@/command/common/arguments";

describe("command/common/arguments", () => {
  afterEach(() => {
    process.argv.length = 2;
  });

  it("parse", async () => {
    process.argv = [
      "node",
      "test-command",
      "--opt1",
      "value1",
      "--num1",
      "123",
      "--flag1",
      "arg1",
      "arg2",
    ];
    const parser = new ArgumentsParser("test-command", "<arg1> <arg2>");
    const opt1 = parser.value("opt1", "option 1", "default1");
    const opt2 = parser.value("opt2", "option 2", "default2");
    const num1 = parser.number("num1", "number 1", 1);
    const num2 = parser.number("num2", "number 2", 2);
    const flag1 = parser.flag("flag1", "flag 1");
    const flag2 = parser.flag("flag2", "flag 2");
    parser.parse();
    expect(opt1()).toBe("value1");
    expect(opt2()).toBe("default2");
    expect(num1()).toBe(123);
    expect(num2()).toBe(2);
    expect(flag1()).toBeTruthy();
    expect(flag2()).toBeFalsy();
    expect(parser.args).toEqual(["arg1", "arg2"]);
  });

  it("not number", async () => {
    process.argv = ["node", "test-command", "--num1", "foo"];
    const parser = new ArgumentsParser("test-command", "<arg1> <arg2>");
    parser.number("num1", "number 1", 1);
    try {
      parser.parse();
      throw new Error("should not reach here");
    } catch {
      // ok
    }
  });

  it("restrictions: min: ok", async () => {
    process.argv = ["node", "test-command", "--num1", "100"];
    const parser = new ArgumentsParser("test-command", "<arg1> <arg2>");
    parser.number("num1", "number 1", 1, { min: 100, max: 200 });
    parser.parse();
  });

  it("restrictions: min: error", async () => {
    process.argv = ["node", "test-command", "--num1", "99"];
    const parser = new ArgumentsParser("test-command", "<arg1> <arg2>");
    parser.number("num1", "number 1", 1, { min: 100, max: 200 });
    try {
      parser.parse();
      throw new Error("should not reach here");
    } catch {
      // ok
    }
  });

  it("restrictions: max: ok", async () => {
    process.argv = ["node", "test-command", "--num1", "200"];
    const parser = new ArgumentsParser("test-command", "<arg1> <arg2>");
    parser.number("num1", "number 1", 1, { min: 100, max: 200 });
    parser.parse();
  });

  it("restrictions: max: error", async () => {
    process.argv = ["node", "test-command", "--num1", "201"];
    const parser = new ArgumentsParser("test-command", "<arg1> <arg2>");
    parser.number("num1", "number 1", 1, { min: 100, max: 200 });
    try {
      parser.parse();
      throw new Error("should not reach here");
    } catch {
      // ok
    }
  });

  it("unknown option", async () => {
    process.argv = ["node", "test-command", "--opt", "foo"];
    const parser = new ArgumentsParser("test-command", "<arg1> <arg2>");
    try {
      parser.parse();
      throw new Error("should not reach here");
    } catch {
      // ok
    }
  });

  it("bare args", async () => {
    process.argv = ["node", "test-command", "--", "--opt", "foo"];
    const parser = new ArgumentsParser("test-command", "<arg1> <arg2>");
    parser.parse();
    expect(parser.args).toEqual(["--opt", "foo"]);
  });

  it("help", async () => {
    const parser = new ArgumentsParser("test-command", "<arg1> <arg2>");
    parser.value("opt1", "option 1", "default1");
    parser.value("opt2", "option 2", "default2");
    parser.flag("flag1", "flag 1");
    parser.flag("flag2", "flag 2");
    expect(parser.help).toBe(
      "Usage: test-command [options] <arg1> <arg2>\n" +
        "\n" +
        "OPTIONS:\n" +
        "  --opt1 VALUE\n" +
        "      option 1\n" +
        "      (default: default1)\n" +
        "  --opt2 VALUE\n" +
        "      option 2\n" +
        "      (default: default2)\n" +
        "  --flag1\n" +
        "      flag 1\n" +
        "  --flag2\n" +
        "      flag 2\n",
    );
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { LoggerService } from "./LoggerService.js";

const createCoreStub = () => {
  const calls = {
    info: [],
    warning: [],
    error: [],
  };

  return {
    calls,
    info(message) {
      calls.info.push(message);
    },
    warning(message) {
      calls.warning.push(message);
    },
    error(message) {
      calls.error.push(message);
    },
  };
};

describe("LoggerService", () => {
  it("delegates to the provided core methods", () => {
    const stub = createCoreStub();
    const logger = new LoggerService(stub);

    logger.info("info message");
    logger.warning("warning message");
    logger.error("error message");

    assert.deepStrictEqual(stub.calls.info, ["info message"]);
    assert.deepStrictEqual(stub.calls.warning, ["warning message"]);
    assert.deepStrictEqual(stub.calls.error, ["error message"]);
  });
});

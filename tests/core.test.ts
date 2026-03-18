import { describe, it, expect } from "vitest";
import { Nexusflow } from "../src/core.js";
describe("Nexusflow", () => {
  it("init", () => { expect(new Nexusflow().getStats().ops).toBe(0); });
  it("op", async () => { const c = new Nexusflow(); await c.process(); expect(c.getStats().ops).toBe(1); });
  it("reset", async () => { const c = new Nexusflow(); await c.process(); c.reset(); expect(c.getStats().ops).toBe(0); });
});

import { describe, expect, it } from "vitest";

import { isValidPassword, isValidUsername } from "../server/trial-messaging";

describe("private messaging account security", () => {
  it("accepts supported username and password formats", () => {
    expect(isValidUsername("ahmad_01")).toBe(true);
    expect(isValidUsername("أحمد-١")).toBe(true);
    expect(isValidUsername("ab")).toBe(false);
    expect(isValidUsername("name with space")).toBe(false);
    expect(isValidPassword("securepass1")).toBe(true);
    expect(isValidPassword("short")).toBe(false);
  });

  it("keeps the health check public but protects conversations with an account session", async () => {
    const health = await fetch("http://127.0.0.1:3000/v1/health");
    const conversations = await fetch("http://127.0.0.1:3000/v1/conversations");

    expect(health.status).toBe(200);
    expect(conversations.status).toBe(401);
  });
});

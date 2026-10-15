import { describe, expect, it } from "vitest";
import getRoleHomePath from "@/features/navigation/services/role-home-service";

describe("getRoleHomePath", () => {
  it.each([
    ["owner", "/owner"],
    ["admin", "/admin"],
    ["technician", "/technician/tickets"],
  ] as const)("envia el rol %s a %s", (role, expectedPath) => {
    expect(getRoleHomePath(role)).toBe(expectedPath);
  });
});

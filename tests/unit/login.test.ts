import { describe, expect, it } from "vitest";
import { isStaffAddress, staffSignIn } from "@/lib/login";

const danny = { email: "danny@go-ipt.com", login_email: "danny.personal@example.com" };
const anibal = { email: "anibalperez1000@gmail.com", login_email: null };

describe("staff sign-in address", () => {
  it("typing the sign-in address signs in Danny's account and sends the link there", () => {
    expect(staffSignIn([danny, anibal], "danny.personal@example.com")).toEqual({
      account: "danny@go-ipt.com",
      sendTo: "danny.personal@example.com",
    });
  });

  it("typing the contact email still works, but the link goes to the sign-in address", () => {
    expect(staffSignIn([danny, anibal], "danny@go-ipt.com")).toEqual({
      account: "danny@go-ipt.com",
      sendTo: "danny.personal@example.com",
    });
  });

  it("staff without a sign-in address get the link at their own email", () => {
    expect(staffSignIn([danny, anibal], "anibalperez1000@gmail.com")).toEqual({
      account: "anibalperez1000@gmail.com",
      sendTo: "anibalperez1000@gmail.com",
    });
  });

  it("works before the login_email column exists", () => {
    expect(staffSignIn([{ email: "danny@go-ipt.com" }], "danny@go-ipt.com")).toEqual({
      account: "danny@go-ipt.com",
      sendTo: "danny@go-ipt.com",
    });
  });

  it("anyone else is not staff", () => {
    expect(staffSignIn([danny, anibal], "cliente@example.com")).toBeNull();
  });
});

describe("staff addresses are never customers", () => {
  it("a staff email counts as staff", () => {
    expect(isStaffAddress([danny, anibal], "danny@go-ipt.com")).toBe(true);
    expect(isStaffAddress([danny, anibal], "anibalperez1000@gmail.com")).toBe(true);
  });

  it("a staff sign-in address counts as staff too", () => {
    expect(isStaffAddress([danny, anibal], "danny.personal@example.com")).toBe(true);
  });

  it("works before the login_email column exists", () => {
    expect(isStaffAddress([{ email: "danny@go-ipt.com" }], "danny@go-ipt.com")).toBe(true);
  });

  it("anyone else can be a customer", () => {
    expect(isStaffAddress([danny, anibal], "cliente@example.com")).toBe(false);
  });
});

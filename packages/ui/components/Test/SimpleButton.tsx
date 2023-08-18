"use client";

import Cookie from "js-cookie";
import { APP_COOKIE } from "../../utils/constants/main";

export function SimpleCookies() {
  return (
    <>
      <button
        className="btn btn-sm btn-accent"
        onClick={() => {
          Cookie.set(APP_COOKIE, "true");
        }}
      >
        Add Cookie
      </button>
      <button
        className="btn btn-sm btn-accent"
        onClick={() => {
          Cookie.remove(APP_COOKIE);
        }}
      >
        Rmove Cookie
      </button>
    </>
  );
}

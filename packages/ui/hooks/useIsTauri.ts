import { clipboard } from "@tauri-apps/api";
import { useEffect, useState } from "react";

export function useIsTauri() {
  const [isTauri, setIsTauri] = useState(false);

  useEffect(() => {
    if (typeof window !== undefined && "__TAURI__" in window) {
      setIsTauri(true);
    }
  }, []);

  return isTauri;
}

export function useClipboard() {
  const [clipboard, setClipboard] = useState(navigator.clipboard);

  useEffect(() => {
    // BUG: This cannot be combined with the useIsTauri hook above
    if (typeof window !== undefined && "__TAURI__" in window) {
      setClipboard(clipboard);
    }
  }, []);

  return clipboard;
}

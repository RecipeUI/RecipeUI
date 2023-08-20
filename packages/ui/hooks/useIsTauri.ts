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

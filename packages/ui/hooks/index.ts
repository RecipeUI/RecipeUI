import { useScreen } from "usehooks-ts";

export function useIsMobile() {
  const screen = useScreen();
  return screen && screen.width < 640;
}

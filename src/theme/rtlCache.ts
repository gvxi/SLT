import createCache from "@emotion/cache";
import rtlPlugin from "stylis-plugin-rtl";
import { prefixer } from "stylis";
import type { Direction } from "@mui/material/styles";

export function createEmotionCache(direction: Direction) {
  if (direction === "rtl") {
    return createCache({
      key: "muirtl",
      stylisPlugins: [prefixer, rtlPlugin],
    });
  }
  return createCache({ key: "mui" });
}

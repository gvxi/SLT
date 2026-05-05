import { Font } from "@react-pdf/renderer";

// Registered once at module level — ES module cache ensures this runs exactly
// once per app lifetime regardless of how many PDF document modules import it.
// Re-registering the same family resets @react-pdf/renderer's internal font
// instance state (clears `id` fields) and causes a crash at render time.
Font.register({
  family: "Cairo",
  fonts: [
    { src: "/fonts/Cairo-Regular.ttf", fontWeight: 400, fontStyle: "normal" },
    { src: "/fonts/Cairo-Bold.ttf",    fontWeight: 700, fontStyle: "normal" },
  ],
});

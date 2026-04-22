"use client";

import { Snackbar, Alert } from "@mui/material";
import { useToastStore } from "@/store/toastStore";

export default function ToastContainer() {
  const { toasts, remove } = useToastStore();

  return (
    <>
      {toasts.map((t, i) => (
        <Snackbar
          key={t.id}
          open
          autoHideDuration={3500}
          onClose={() => remove(t.id)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          sx={{ bottom: { xs: `${72 + i * 56}px`, sm: `${16 + i * 56}px` } }}
        >
          <Alert
            severity={t.severity}
            onClose={() => remove(t.id)}
            variant="filled"
            sx={{ fontSize: 13, minWidth: 260 }}
          >
            {t.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
}

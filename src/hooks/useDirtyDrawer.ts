"use client";
/**
 * useDirtyDrawer — persists an in-progress drawer form to localStorage so
 * data isn't lost on accidental close, and shows a confirm dialog if the
 * user tries to close with unsaved changes.
 *
 * Usage:
 *   const { isDirty, markDirty, markClean, guardedClose, DiscardDialog } = useDirtyDrawer(key);
 *   - Call markDirty() whenever the form has unsaved changes.
 *   - Call markClean() after a successful save.
 *   - Use guardedClose instead of onClose so the dialog fires when dirty.
 *   - Render <DiscardDialog /> anywhere inside the component tree.
 */

import { useState, useCallback, useEffect, useRef } from "react";

interface UseDirtyDrawerReturn {
  isDirty: boolean;
  markDirty: () => void;
  markClean: () => void;
  guardedClose: () => void;
  /** Call this to imperatively show the dialog */
  showDiscardDialog: boolean;
  confirmDiscard: () => void;
  cancelDiscard: () => void;
}

export function useDirtyDrawer(
  storageKey: string,
  onConfirmClose: () => void,
): UseDirtyDrawerReturn {
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const onConfirmCloseRef = useRef(onConfirmClose);
  useEffect(() => { onConfirmCloseRef.current = onConfirmClose; }, [onConfirmClose]);

  const markDirty = useCallback(() => {
    setIsDirty(true);
    try {
      localStorage.setItem(`${storageKey}:dirty`, "1");
    } catch { /* ignore */ }
  }, [storageKey]);

  const markClean = useCallback(() => {
    setIsDirty(false);
    try {
      localStorage.removeItem(`${storageKey}:dirty`);
    } catch { /* ignore */ }
  }, [storageKey]);

  // Restore dirty flag on mount (e.g. after page refresh)
  useEffect(() => {
    try {
      if (localStorage.getItem(`${storageKey}:dirty`) === "1") {
        setIsDirty(true);
      }
    } catch { /* ignore */ }
  }, [storageKey]);

  const guardedClose = useCallback(() => {
    if (isDirty) {
      setShowDiscardDialog(true);
    } else {
      onConfirmCloseRef.current();
    }
  }, [isDirty]);

  const confirmDiscard = useCallback(() => {
    setShowDiscardDialog(false);
    markClean();
    onConfirmCloseRef.current();
  }, [markClean]);

  const cancelDiscard = useCallback(() => {
    setShowDiscardDialog(false);
  }, []);

  return { isDirty, markDirty, markClean, guardedClose, showDiscardDialog, confirmDiscard, cancelDiscard };
}

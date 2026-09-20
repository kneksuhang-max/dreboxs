import { useEffect, useRef } from "react";
import { useAppStore } from "../store/useAppStore";
import { addLog } from "../db/dexie";

interface UseAutoLockOptions {
  isPinEnabled: boolean;
  autoLockMinutes: number; // 0 or negative disables auto-lock
}

export const useAutoLock = ({
  isPinEnabled,
  autoLockMinutes,
}: UseAutoLockOptions) => {
  const { isPinLocked, setIsPinLocked, showToast } = useAppStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    // If PIN is not enabled or autoLock is disabled (e.g. 0), do nothing
    if (!isPinEnabled || autoLockMinutes <= 0 || isPinLocked) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const timeoutMs = autoLockMinutes * 60 * 1000;

    const resetTimer = () => {
      lastActivityRef.current = Date.now();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        // Trigger auto-lock
        setIsPinLocked(true);
        showToast(
          `Aplikasi otomatis terkunci setelah ${autoLockMinutes} menit tidak aktif.`,
          "info",
        );
        addLog(
          "SECURITY",
          "security",
          `Auto-lock terpicu: inaktivitas ${autoLockMinutes} menit.`,
        );
      }, timeoutMs);
    };

    // Initialize timer
    resetTimer();

    // Listen to user activity events
    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    // Throttle event listeners to prevent performance overhead
    let throttleTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleUserActivity = () => {
      if (!throttleTimeout) {
        resetTimer();
        throttleTimeout = setTimeout(() => {
          throttleTimeout = null;
        }, 1000); // 1s throttle
      }
    };

    events.forEach((ev) => {
      window.addEventListener(ev, handleUserActivity, { passive: true });
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (throttleTimeout) clearTimeout(throttleTimeout);
      events.forEach((ev) => {
        window.removeEventListener(ev, handleUserActivity);
      });
    };
  }, [isPinEnabled, autoLockMinutes, isPinLocked, setIsPinLocked, showToast]);
};

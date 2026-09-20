import React, { useState, useEffect, useRef } from "react";
import { Lock, Delete, ShieldCheck, KeyRound, AlertCircle } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { animateModalIn } from "../../utils/animations";

interface PinLockScreenProps {
  correctPin: string;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({ correctPin }) => {
  const [enteredPin, setEnteredPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const { setIsPinLocked, showToast } = useAppStore();
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      animateModalIn(cardRef.current);
    }
  }, []);

  const handleDigit = (digit: string) => {
    if (enteredPin.length < 6) {
      const next = enteredPin + digit;
      setEnteredPin(next);
      setErrorMsg("");

      // Auto verify when reached minimum 4 digits and matches
      if (next === correctPin) {
        setIsPinLocked(false);
        showToast("PIN Terverifikasi. Akses dibuka.", "success");
      } else if (next.length === correctPin.length) {
        setErrorMsg("PIN salah. Coba lagi.");
        setTimeout(() => setEnteredPin(""), 500);
      }
    }
  };

  const handleBackspace = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setErrorMsg("");
  };

  const handleClear = () => {
    setEnteredPin("");
    setErrorMsg("");
  };

  // Keyboard support for convenience
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "Escape") {
        handleClear();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enteredPin, correctPin]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm p-4">
      <div
        ref={cardRef}
        className="w-full max-w-sm border border-zinc-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6"
      >
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900">
            <Lock className="h-5 w-5" />
          </div>
          <h2 className="mt-3 font-mono text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            DREBOXS TERKUNCI
          </h2>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            PIN harus dimasukkan dulu baru bisa membuka website DreBoXs
          </p>
        </div>

        {/* PIN Dots Indicator */}
        <div className="my-6 flex justify-center gap-3">
          {Array.from({ length: 6 }).map((_, idx) => {
            const isFilled = idx < enteredPin.length;
            const isTarget = idx < correctPin.length;
            if (
              !isTarget &&
              idx >= Math.max(correctPin.length, enteredPin.length)
            ) {
              return null;
            }
            return (
              <div
                key={idx}
                className={`flex h-4 w-4 items-center justify-center border transition-all ${
                  isFilled
                    ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100"
                    : "border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                }`}
              />
            );
          })}
        </div>

        {/* Error message */}
        {errorMsg ? (
          <div className="mb-4 flex items-center justify-center gap-1.5 border border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-800 p-2 text-center text-xs font-mono text-zinc-900 dark:text-zinc-100">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{errorMsg}</span>
          </div>
        ) : (
          <div className="mb-4 h-8 flex items-center justify-center text-xs font-mono text-zinc-400 dark:text-zinc-500">
            [Ketik nomor atau klik tombol keypad]
          </div>
        )}

        {/* Numeric Keypad - Ultra Minimalist JetBrains Mono */}
        <div className="grid grid-cols-3 gap-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num)}
              className="flex h-12 items-center justify-center border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono text-base font-semibold text-zinc-900 dark:text-zinc-100 hover:border-zinc-900 dark:hover:border-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 active:bg-zinc-900 active:text-white"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="flex h-12 items-center justify-center border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono text-xs text-zinc-500 dark:text-zinc-400 hover:border-zinc-900 dark:hover:border-zinc-200 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            RESET
          </button>
          <button
            type="button"
            onClick={() => handleDigit("0")}
            className="flex h-12 items-center justify-center border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono text-base font-semibold text-zinc-900 dark:text-zinc-100 hover:border-zinc-900 dark:hover:border-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 active:bg-zinc-900 active:text-white"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="flex h-12 items-center justify-center border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-200 hover:text-zinc-900 dark:hover:text-zinc-100"
            title="Hapus Digit Terakhir"
          >
            <Delete className="h-4 w-4" />
          </button>
        </div>

        {/* Manual Verify button if 4+ digits */}
        {enteredPin.length >= 4 && (
          <button
            type="button"
            onClick={() => {
              if (enteredPin === correctPin) {
                setIsPinLocked(false);
                showToast("Akses Berhasil", "success");
              } else {
                setErrorMsg("PIN tidak sesuai");
                setTimeout(() => setEnteredPin(""), 500);
              }
            }}
            className="mt-4 flex w-full h-10 items-center justify-center gap-2 border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 font-mono text-xs uppercase text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Verifikasi PIN</span>
          </button>
        )}

        {/* Demo fallback reminder */}
        <div className="mt-6 border-t border-zinc-100 dark:border-zinc-800 pt-3 text-center text-[11px] text-zinc-400 dark:text-zinc-500">
          <div className="flex items-center justify-center gap-1">
            <KeyRound className="h-3 w-3" />
            <span>
              PIN Terdaftar:{" "}
              <code className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
                {correctPin}
              </code>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

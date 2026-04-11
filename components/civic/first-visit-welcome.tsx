"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const welcomeStorageKey = "namma-odia-welcome-seen-v1";

function hasSeenWelcome() {
  try {
    return window.localStorage.getItem(welcomeStorageKey) === "1";
  } catch {
    return false;
  }
}

function markWelcomeSeen() {
  try {
    window.localStorage.setItem(welcomeStorageKey, "1");
  } catch {
    // The overlay should still dismiss when storage is unavailable.
  }
}

export function FirstVisitWelcome() {
  const [visible, setVisible] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasSeenWelcome()) {
      setVisible(true);
    }
  }, []);

  const dismiss = useCallback(() => {
    markWelcomeSeen();
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!visible) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        dismiss();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [visible, dismiss]);

  if (!visible) {
    return null;
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      tabIndex={-1}
      onClick={dismiss}
      className="fixed inset-0 z-[1000] flex cursor-pointer items-center justify-center bg-black/55 px-5 backdrop-blur-[3px]"
    >
      <div className="w-full max-w-[340px] rounded-md bg-white px-6 py-6 text-left shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/namma-odia-logo.png"
          alt="Namma Odia"
          className="mb-5 h-9 w-auto object-contain"
        />
        <h1 id="welcome-title" className="text-[17px] font-black leading-8 tracking-wide text-slate-950">
          Bhubaneswar has a garbage problem.
        </h1>
        <p className="mt-3 text-[13px] font-semibold leading-6 text-slate-600">
          Report it. Photograph it. Track who is responsible.
        </p>
        <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-400">
          Every dump is mapped to the responsible BMC ward, MLA, and MP. When enough citizens report,
          it becomes impossible to ignore.
        </p>
        <div className="mt-5 text-center text-[10px] font-bold text-slate-300">
          4 wards · 2 MLAs · 1 MP · Bhubaneswar
        </div>
        <div className="mt-4 text-center text-[10px] font-bold text-slate-300">
          Tap anywhere to continue
        </div>
      </div>
    </div>
  );
}

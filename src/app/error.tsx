"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-[560px] flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="font-display text-3xl">This page didn’t load</h1>
      <p className="text-muted">Check your connection and try again. Your cart is saved on this device.</p>
      <button onClick={reset} className="h-11 rounded-[12px] bg-brand px-6 font-semibold text-on-brand">Try again</button>
    </div>
  );
}

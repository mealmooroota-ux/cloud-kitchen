"use client";
// One place to load and configure GSAP, so every animated component behaves the same on phones.

let ready: Promise<{ gsap: typeof import("gsap").gsap; ScrollTrigger: typeof import("gsap/ScrollTrigger").ScrollTrigger }> | null = null;

export function loadGsap() {
  if (!ready) {
    ready = Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
      gsap.registerPlugin(ScrollTrigger);
      // Phones: the address bar showing/hiding changes the viewport height. Don't recalculate every
      // trigger for that (it causes the jump/jitter on iOS and Android); real resizes still refresh.
      ScrollTrigger.config({ ignoreMobileResize: true });
      watchLayout(ScrollTrigger);
      return { gsap, ScrollTrigger };
    });
  }
  return ready;
}

/**
 * When the page height changes for reasons ScrollTrigger can't see (images loading, fonts swapping,
 * the 3D section switching layout), trigger positions go stale and pinned sections start in the wrong place.
 * Watch the document height and refresh once it settles.
 */
function watchLayout(ScrollTrigger: typeof import("gsap/ScrollTrigger").ScrollTrigger) {
  if (typeof ResizeObserver === "undefined") return;
  let last = document.documentElement.scrollHeight;
  let t: ReturnType<typeof setTimeout> | undefined;
  const ro = new ResizeObserver(() => {
    clearTimeout(t);
    t = setTimeout(() => {
      const h = document.documentElement.scrollHeight;
      if (Math.abs(h - last) < 2) return;
      ScrollTrigger.refresh();
      last = document.documentElement.scrollHeight;
    }, 180);
  });
  ro.observe(document.body);
  if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh()).catch(() => {});
}

/** Touch-first or small screen: skip scroll-scrubbed decoration and expensive filters. */
export function isLowPowerMotion() {
  return window.matchMedia("(pointer: coarse), (max-width: 767px)").matches;
}

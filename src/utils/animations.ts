import gsap from "gsap";

/**
 * Animate container entry with ultra minimalist fade & subtle slide
 */
export const animatePageIn = (target: HTMLElement | string | null) => {
  if (!target) return;
  gsap.fromTo(
    target,
    { opacity: 0, y: 8 },
    {
      opacity: 1,
      y: 0,
      duration: 0.28,
      ease: "power2.out",
      clearProps: "all",
    },
  );
};

/**
 * Animate list or card elements with subtle stagger
 */
export const animateStaggerIn = (
  targets: HTMLElement[] | NodeListOf<Element> | string,
) => {
  if (!targets) return;
  gsap.fromTo(
    targets,
    { opacity: 0, y: 10 },
    {
      opacity: 1,
      y: 0,
      duration: 0.25,
      stagger: 0.04,
      ease: "power1.out",
      clearProps: "all",
    },
  );
};

/**
 * Animate modal dialog in
 */
export const animateModalIn = (modalEl: HTMLElement | null) => {
  if (!modalEl) return;
  gsap.fromTo(
    modalEl,
    { opacity: 0, scale: 0.98, y: 6 },
    {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.22,
      ease: "power2.out",
    },
  );
};

/**
 * Animate mobile drawer slide from right
 */
export const animateDrawerIn = (drawerEl: HTMLElement | null) => {
  if (!drawerEl) return;
  gsap.fromTo(
    drawerEl,
    { x: "100%" },
    {
      x: "0%",
      duration: 0.28,
      ease: "power3.out",
    },
  );
};

export default gsap;

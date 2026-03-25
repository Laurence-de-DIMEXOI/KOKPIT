import confetti from "canvas-confetti";

export function celebrerVente() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.3 },
    colors: ["#F4B400", "#4C9DB0", "#ffffff", "#F2BB16"],
    disableForReducedMotion: true,
  });
}

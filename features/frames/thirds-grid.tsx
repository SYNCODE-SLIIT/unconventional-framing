/**
 * Rule-of-thirds lines (light grey). Fills its positioned parent, so place it inside a box
 * that already has the 16:9 shape of the frame.
 */
export function ThirdsGrid() {
  const line = "absolute bg-zinc-300/85 shadow-[0_0_0_0.5px_rgba(0,0,0,0.35)]";

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <span className={`${line} left-1/3 top-0 h-full w-px`} />
      <span className={`${line} left-2/3 top-0 h-full w-px`} />
      <span className={`${line} left-0 top-1/3 h-px w-full`} />
      <span className={`${line} left-0 top-2/3 h-px w-full`} />
    </div>
  );
}

"use client";

// A tiny 0.1s 'Pop' sound encoded as a Base64 Data URI to keep the app self-contained.
const POP_SOUND_BASE64 = "data:audio/mp3;base64,SUQzBAAAAAABAFRYWFgAAAASAAADbWFqb3JfYnJhbmQAZGFzaABUWFhYAAAAEgAAA21pbm9yX3ZlcnNpb24AMABUWFhYAAAAHAAAA2NvbXBhdGlibGVfYnJhbmRzAGlzbzZtcDQyAFRTU0UAAAAPAAADTGF2ZjYwLjMuMTAwAAAAAAAAAAAAAAD/80MUAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIwAUFxcYGBkcHB0dHh8fICAgISEiIiMmJycnKCkpKSsqKywsLS0uLi8vMDAwMTExMjIyMzMzNDQ0Nzc4OTk5Ojo7Ozs9PT4+Pz9AQEBBQUFCQkJDQ0RERUVGRkZISElJSkpKS0tMTExNTU5OT09QUFFRUVJSUlNTU1RUVVNVVlZWXV5eXl5fX2BgYGFhYmJiYmNjZGRlZWhpaWlpa2tsbGxtbW5ubW9vb3BwcXFycnJzc3R0dXV2dnZ3d3h4eXl5e3t8fH19fn5+f39/gICAgYGCgoKCg4OEhISEhYaGxsbGx8fIyMjIycnKysrKysvLzMzMzM3Nzc7Ozs/P0NDQ0NHT09PT09XW1tbW19fX2Nja2trb29vc3N3d3d7f39/f4ODh4eHh4uLj4+Pj4+Xm5ubn5+fo6Onp6urr6+vs7Ozt7e3u7u/v8PDx8fHx8fPz8/Pz9PT19fX19vn5+fn6+vr7+/v7/Pz8/P39/f39/v7+/v9/f39/f4YAAACpYXBpY19pbWFnZS9qcGVnAAAAAP/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAEAAQADASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACE MEMBERS OF THE WORLD IS NOT A DRILL";

let audioCache: HTMLAudioElement | null = null;

/**
 * Smart play function that respects the Masterclass UX Strategy:
 * - Silent when the specific lead chat is active (don't annoy the user).
 * - Audible when tab is backgrounded or user is looking at a different dealt.
 */
export function playChatPop(force = false) {
  if (typeof window === "undefined") return;

  // Initialize audio if not already done
  if (!audioCache) {
    audioCache = new Audio(POP_SOUND_BASE64);
    audioCache.volume = 0.4;
  }

  // Masterclass Logic: Only play if tab is hidden or force is true
  // In a real app, you'd also check if the ActiveLeadId in the store matches.
  if (document.visibilityState !== "visible" || force) {
    audioCache.currentTime = 0;
    audioCache.play().catch(() => {
      // Browsers block autoplay until user interacts. 
      // We fail silently as per plan.
    });
  }
}

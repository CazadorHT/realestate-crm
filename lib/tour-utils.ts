/**
 * 🛠️ Guided Tour Positioning Utilities
 */

interface Rect {
  right: number;
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
}

export interface TooltipPosition {
  top: number;
  left: number;
  x: string;
  y: number;
  opacity: number;
  scale: number;
  width: string;
  position: "absolute" | "fixed";
  isAbove: boolean;
  side: "top" | "bottom" | "left" | "right";
}

export function calculateTooltipPosition(
  targetRect: Rect,
  windowWidth: number,
  windowHeight: number,
  isMobile: boolean,
): TooltipPosition {
  const spacing = 12;
  const tooltipWidth = isMobile ? Math.min(windowWidth - 40, 380) : 380;
  const halfWidth = tooltipWidth / 2;
  const tooltipHeight = 250;

  // 🚀 SPECIAL CASE: If the target is very large, center it
  if (targetRect.height > windowHeight * 0.8) {
    return {
      top: windowHeight / 2,
      left: windowWidth / 2,
      x: "-50%",
      y: -50,
      opacity: 1,
      scale: 1,
      width: isMobile ? `calc(100vw - 40px)` : "380px",
      position: "fixed",
      isAbove: false,
      side: "bottom",
    };
  }

  let top = targetRect.bottom + spacing;
  let left = targetRect.left + targetRect.width / 2;
  let isAbove = false;

  // 🛑 Smart Collision Detection
  // 1. If it hits the BOTTOM, try to move to TOP
  if (top + tooltipHeight > windowHeight - 20) {
    const topSpace = targetRect.top - tooltipHeight - spacing;
    
    if (topSpace > 20) {
      // There is space on top
      top = topSpace;
      isAbove = true;
    } else {
      // 2. No space on top OR bottom
      // On Mobile, we NEVER move to the side, we just pick the side with more space
      if (isMobile) {
        const spaceAbove = targetRect.top;
        const spaceBelow = windowHeight - targetRect.bottom;
        isAbove = spaceAbove > spaceBelow;
        top = isAbove ? Math.max(20, targetRect.top - tooltipHeight - spacing) : Math.min(windowHeight - tooltipHeight - 20, targetRect.bottom + spacing);
      } else {
        // Desktop: Move to the RIGHT side
        return {
          top: Math.max(20, targetRect.top),
          left: Math.min(windowWidth - 20 - halfWidth, targetRect.right + spacing + halfWidth),
          x: "-50%",
          y: 0,
          opacity: 1,
          scale: 1,
          width: isMobile ? `calc(100vw - 40px)` : "380px",
          position: "absolute",
          isAbove: false,
          side: "right",
        };
      }
    }
  }

  // 3. Keep within horizontal bounds (Center on mobile)
  if (isMobile) {
    left = windowWidth / 2;
  } else {
    if (left - halfWidth < 20) {
      left = halfWidth + 20;
    } else if (left + halfWidth > windowWidth - 20) {
      left = windowWidth - halfWidth - 20;
    }
  }

  return {
    top,
    left,
    x: "-50%",
    y: 0,
    opacity: 1,
    scale: 1,
    width: isMobile ? `calc(100vw - 40px)` : "380px",
    position: "absolute",
    isAbove,
    side: isAbove ? "top" : "bottom",
  };
}


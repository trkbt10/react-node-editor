/**
 * @file Mobile detection utilities
 */

/**
 * Detect if the current device is a mobile device
 * Based on user agent and touch capability
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  // Check for touch capability
  const nav = navigator;
  const legacyMsMaxTouchPoints = (nav as unknown as { msMaxTouchPoints?: number }).msMaxTouchPoints;
  const hasLegacyTouchSupport = typeof legacyMsMaxTouchPoints === "number" && legacyMsMaxTouchPoints > 0;
  const hasTouchScreen = "ontouchstart" in window || nav.maxTouchPoints > 0 || hasLegacyTouchSupport;

  // Check user agent for mobile devices
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const isMobileUserAgent = mobileRegex.test(navigator.userAgent);

  return hasTouchScreen && isMobileUserAgent;
};

/**
 * Detect if the device is iOS (iPhone, iPad, iPod)
 */
export const isIOS = (): boolean => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

/**
 * Detect if the device is Android
 */
export const isAndroid = (): boolean => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  return /Android/i.test(navigator.userAgent);
};

/**
 * Get the current viewport width
 */
export const getViewportWidth = (): number => {
  if (typeof window === "undefined") {
    return 0;
  }

  return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
};

/**
 * Get the current viewport height
 */
export const getViewportHeight = (): number => {
  if (typeof window === "undefined") {
    return 0;
  }

  return window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
};

/**
 * Check if viewport is in mobile size range (width < 768px)
 */
export const isMobileViewport = (): boolean => {
  return getViewportWidth() < 768;
};

/**
 * Check if viewport is in tablet size range (768px <= width < 1024px)
 */
export const isTabletViewport = (): boolean => {
  const width = getViewportWidth();
  return width >= 768 && width < 1024;
};

/**
 * Check if viewport is in desktop size range (width >= 1024px)
 */
export const isDesktopViewport = (): boolean => {
  return getViewportWidth() >= 1024;
};

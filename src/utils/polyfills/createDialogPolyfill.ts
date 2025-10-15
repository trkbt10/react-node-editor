/**
 * @file Minimal polyfill for HTMLDialogElement.showModal()
 */

let applied = false;

const TOP_LAYER_Z_INDEX = "2147483647";

type PolyfilledDialog = HTMLDialogElement & {
  __polyfillBackdrop?: HTMLDivElement;
  __polyfillOriginalPosition?: string;
  __polyfillOriginalZIndex?: string;
};

const isBrowserEnvironment = typeof window !== "undefined" && typeof document !== "undefined";

/**
 * Ensure `HTMLDialogElement.showModal` exists, providing a minimal fallback when missing.
 */
export function ensureDialogPolyfill(): void {
  if (applied || !isBrowserEnvironment) {
    return;
  }

  if (typeof window.HTMLDialogElement !== "function") {
    return;
  }

  const dialogProto = window.HTMLDialogElement.prototype as PolyfilledDialog;

  if (typeof dialogProto.showModal === "function") {
    applied = true;
    return;
  }

  const originalClose = dialogProto.close ?? function close(this: PolyfilledDialog): void {
    if (this.hasAttribute("open")) {
      this.removeAttribute("open");
    }
  };

  dialogProto.showModal = function showModal(this: PolyfilledDialog): void {
    if (!this.isConnected) {
      document.body.appendChild(this);
    }

    if (this.hasAttribute("open")) {
      return;
    }

    const backdrop = document.createElement("div");
    backdrop.dataset.dialogBackdrop = "true";
    backdrop.style.position = "fixed";
    backdrop.style.inset = "0";
    backdrop.style.background = "transparent";
    backdrop.style.pointerEvents = "none";
    backdrop.style.zIndex = TOP_LAYER_Z_INDEX;
    document.body.appendChild(backdrop);
    this.__polyfillBackdrop = backdrop;

    this.__polyfillOriginalPosition = this.style.position;
    this.__polyfillOriginalZIndex = this.style.zIndex;

    if (!this.style.position) {
      this.style.position = "fixed";
    }

    this.style.zIndex = TOP_LAYER_Z_INDEX;

    this.setAttribute("open", "");

    if (typeof this.focus === "function") {
      this.focus();
    }
  };

  dialogProto.close = function close(this: PolyfilledDialog, returnValue?: string): void {
    originalClose.call(this, returnValue);
    if (this.__polyfillBackdrop && this.__polyfillBackdrop.isConnected) {
      document.body.removeChild(this.__polyfillBackdrop);
      this.__polyfillBackdrop = undefined;
    }
    if (this.__polyfillOriginalPosition !== undefined) {
      this.style.position = this.__polyfillOriginalPosition;
      this.__polyfillOriginalPosition = undefined;
    }
    if (this.__polyfillOriginalZIndex !== undefined) {
      this.style.zIndex = this.__polyfillOriginalZIndex;
      this.__polyfillOriginalZIndex = undefined;
    }
  };

  applied = true;
}

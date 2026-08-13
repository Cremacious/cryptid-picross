/**
 * Structural subset of expo-router's `Router` — just the members `safeBack` needs.
 * Typing it structurally keeps the helper trivially testable with a plain mock and
 * avoids coupling to expo-router's exported type names.
 */
export interface BackRouter<Href = string> {
  canGoBack: () => boolean;
  back: () => void;
  replace: (href: Href) => void;
}

/**
 * Go back if there is history to pop, otherwise replace with a sensible parent route.
 *
 * Reaching a screen via `router.replace` (or by loading/reloading its URL directly on
 * web) leaves no entry to pop, so an unconditional `router.back()` fires expo-router's
 * "GO_BACK was not handled by any navigator" warning. Falling back to an explicit route
 * keeps the back control working from any entry point.
 */
export function safeBack<Href>(router: BackRouter<Href>, fallback: Href): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback);
  }
}

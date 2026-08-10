/**
 * Decouples stores from the saveManager. Stores call notifyChange() after a
 * mutation; saveManager registers the real persist handler via setChangeHandler.
 * This one-way indirection avoids a store <-> saveManager import cycle.
 */
type ChangeHandler = () => void;

let handler: ChangeHandler = () => {};

export function setChangeHandler(fn: ChangeHandler): void {
  handler = fn;
}

export function notifyChange(): void {
  handler();
}

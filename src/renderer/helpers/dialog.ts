export function showModalDialog(dialog: HTMLDialogElement, onCancel?: () => void): void {
  dialog.addEventListener("cancel", (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    onCancel?.();
  });
  dialog.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onCancel?.();
    }
  });
  dialog.addEventListener("copy", (event: ClipboardEvent) => {
    event.stopPropagation();
  });
  dialog.addEventListener("paste", (event: ClipboardEvent) => {
    event.stopPropagation();
  });
  dialog.showModal();
}

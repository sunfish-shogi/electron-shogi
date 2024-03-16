interface Dialog extends HTMLElement {
  showModal(): void;
}

export function showModalDialog(dialog: Dialog, onCancel?: () => void): void {
  dialog.addEventListener("cancel", (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    onCancel?.();
  });
  dialog.addEventListener("copy", (event: ClipboardEvent) => {
    event.stopPropagation();
  });
  dialog.addEventListener("paste", (event: ClipboardEvent) => {
    event.stopPropagation();
  });
  dialog.showModal();
}

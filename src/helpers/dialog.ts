interface Dialog extends HTMLElement {
  showModal(): void;
}

export function showModalDialog(dialog: Dialog): void {
  dialog.addEventListener("cancel", (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
  });
  dialog.addEventListener("copy", (event: ClipboardEvent) => {
    event.stopPropagation();
  });
  dialog.addEventListener("paste", (event: ClipboardEvent) => {
    event.stopPropagation();
  });
  dialog.showModal();
}

interface FormItem extends HTMLElement {
  value: string;
}

export function getFormItemByID(id: string): FormItem | null {
  return document.getElementById(id) as FormItem | null;
}

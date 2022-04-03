function shouldPreventArrowKeyEventHandling(): boolean {
  const activeElement = document.activeElement;
  return (
    activeElement instanceof HTMLTextAreaElement ||
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLSelectElement
  );
}

interface KeyEventHandler {
  onArrowUp?(): void;
  onArrowDown?(): void;
  onArrowLeft?(): void;
  onArrowRight?(): void;
}

function resolveHandlerFunc(
  key: string,
  handler: KeyEventHandler
): (() => void) | undefined {
  if (!shouldPreventArrowKeyEventHandling()) {
    switch (key) {
      case "ArrowUp":
        return handler.onArrowUp;
      case "ArrowDown":
        return handler.onArrowDown;
      case "ArrowLeft":
        return handler.onArrowLeft;
      case "ArrowRight":
        return handler.onArrowRight;
    }
  }
}

export function handleKeyDownEvent(handler: KeyEventHandler): void {
  document.addEventListener("keydown", (event: KeyboardEvent) => {
    const f = resolveHandlerFunc(event.key, handler);
    if (f) {
      event.preventDefault();
      f();
    }
  });
}

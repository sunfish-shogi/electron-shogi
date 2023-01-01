const preloadedImages: { [path: string]: HTMLImageElement } = {};

export default function preloadImage(path: string): void {
  if (preloadedImages[path]) {
    return;
  }
  const img = document.createElement("img");
  img.src = path;
  preloadedImages[path] = img;
}

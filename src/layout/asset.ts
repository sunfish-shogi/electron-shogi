const preloadedImages: { [path: string]: HTMLImageElement } = {};

export default function preloadImage(path: string): void {
  if (preloadedImages[path]) {
    return;
  }
  console.log("preload image:", path);
  const img = document.createElement("img");
  img.src = path;
  preloadedImages[path] = img;
}

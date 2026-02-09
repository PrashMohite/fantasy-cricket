self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("fantasy-v1").then(cache => {
      return cache.addAll([
        "/fantasy-cricket/",
        "/fantasy-cricket/index.html",
        "/fantasy-cricket/css/style.css",
        "/fantasy-cricket/js/config.js"
      ]);
    })
  );
});

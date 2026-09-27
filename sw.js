// Service worker: uygulama dosyalarını telefona kaydeder,
// böylece internet olmadan da açılabilir.
// Uygulamada büyük bir değişiklik yaptığında sürüm numarasını artır.
const ONBELLEK = "kuponsuz-v5";

const DOSYALAR = [
  "./",
  "./index.html",
  "./style.css",
  "./mesajlar.js",
  "./app.js",
  "./durtu.js",
  "./yoklama.js",
  "./ozet.js",
  "./tanisma.js",
  "./manifest.json",
  "./ikon-192.png",
  "./ikon-512.png"
];

// Kurulurken dosyaları kaydet
self.addEventListener("install", function (olay) {
  olay.waitUntil(
    caches.open(ONBELLEK).then(function (onbellek) {
      return onbellek.addAll(DOSYALAR);
    })
  );
  self.skipWaiting();
});

// Eski sürümlerin kayıtlarını temizle
self.addEventListener("activate", function (olay) {
  olay.waitUntil(
    caches.keys().then(function (adlar) {
      return Promise.all(
        adlar.filter(ad => ad !== ONBELLEK).map(ad => caches.delete(ad))
      );
    })
  );
  self.clients.claim();
});

// Önce internetten en güncel hali almayı dene,
// internet yoksa kayıtlı kopyayı kullan
self.addEventListener("fetch", function (olay) {
  if (olay.request.method !== "GET") return;

  olay.respondWith(
    fetch(olay.request)
      .then(function (yanit) {
        const kopya = yanit.clone();
        caches.open(ONBELLEK).then(onbellek => onbellek.put(olay.request, kopya));
        return yanit;
      })
      .catch(function () {
        return caches.match(olay.request);
      })
  );
});

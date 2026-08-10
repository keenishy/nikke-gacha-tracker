const CACHE_NAME = 'nikke-gacha-v1';
const urlsToCache = [
  './',
  './index.html',
  './css/style.css',
  './js/main.js',
  './js/ui.js',
  './js/db.js',
  './js/state.js',
  './js/firebase.js',
  './js/pwa.js',
  './fire.png',
  './water.png',
  './wind.png',
  './iron.png',
  './electric.png'
];

// 1. 설치될 때 파일들을 캐시(저장)합니다.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting(); // 업데이트 시 대기하지 않고 즉시 적용
});

// 2. 새로운 버전이 활성화될 때, 옛날 캐시(찌꺼기)를 날려버립니다.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. 네트워크 우선(Network First) 전략 
// 무조건 인터넷(깃허브)에서 최신본을 먼저 가져오고, 오프라인일 때만 저장된 캐시를 씁니다.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
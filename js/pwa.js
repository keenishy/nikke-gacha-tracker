export function initPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((registration) => {
          console.log('✅ PWA 서비스 워커 등록 성공:', registration.scope);
          
          // 💡 실시간 업데이트 감지 기능
          // 깃허브에 새 코드를 올리면 앱이 알아채고 자동으로 새로고침해서 최신 버전을 보여줍니다.
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 새로운 업데이트가 발견되었습니다! 화면을 새로고침합니다.');
                window.location.reload();
              }
            });
          });
        })
        .catch((error) => {
          console.log('❌ PWA 서비스 워커 등록 실패:', error);
        });
    });
  }
}
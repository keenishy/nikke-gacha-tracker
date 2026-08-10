import { ui } from "./ui.js";
import { dbService } from "./db.js";
import { state } from "./state.js";
import { initPWA } from "./pwa.js";

// 모듈화된 함수들을 HTML 인라인 이벤트(onclick)에서 쓸 수 있도록 window 객체에 할당
window.ui = ui;
window.dbService = dbService;

// 문서 로드 완료 시 초기 렌더링 및 PWA 가동
window.onload = function() {
    ui.renderPage(state.currentPage);
    initPWA(); // 수정 완료: PWA(서비스 워커) 실행 
};

// 속성 메뉴 바깥 클릭 시 닫기
document.addEventListener('click', function(e) { 
    if (!e.target.closest('.custom-select-wrapper')) { 
        const opts = document.getElementById('attrOptions'); 
        if(opts) opts.classList.remove('show'); 
    } 
});

// DB 저장 버튼 이벤트 연동
document.getElementById('btnSaveToDB').addEventListener('click', () => {
    dbService.saveRecord();
});
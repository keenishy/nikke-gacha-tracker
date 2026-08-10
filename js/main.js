import { ui } from "./ui.js";
import { dbService } from "./db.js";
import { state } from "./state.js";
import { initPWA } from "./pwa.js";
import { stats } from "./stats.js"; // 💡 통계 모듈 추가

window.ui = ui;
window.dbService = dbService;
window.stats = stats; // 💡 HTML에서 접근할 수 있게 연결

window.onload = function() {
    ui.renderPage(state.currentPage);
    initPWA(); 
};

document.addEventListener('click', function(e) { 
    if (!e.target.closest('.custom-select-wrapper')) { 
        const opts = document.getElementById('attrOptions'); 
        if(opts) opts.classList.remove('show'); 
    } 
});

document.getElementById('btnSaveToDB').addEventListener('click', () => {
    dbService.saveRecord();
});
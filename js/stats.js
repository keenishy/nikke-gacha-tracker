import { state } from "./state.js";

export const stats = {
    render(mode, btn) {
        // 탭 버튼 활성화 처리
        document.querySelectorAll('#view-stats .acc-btn').forEach(el => el.classList.remove('active'));
        if(btn) btn.classList.add('active');

        const container = document.getElementById('statsContainer');
        container.innerHTML = '';

        if (state.allHistoryRecords.length === 0) {
            container.innerHTML = `<p style="text-align:center; padding:20px; color:var(--text-muted);">기록된 가챠 데이터가 없습니다.</p>`;
            return;
        }

        // 전체 데이터 계산용 객체
        let globalStats = { pulls: 0, pickup: 0, spook: 0, pilgrim: 0, goldTicket: 0 };
        
        // 계정별 데이터 계산용 객체
        let accountStats = {};
        state.ACCOUNT_LIST.forEach(acc => {
            accountStats[acc] = { pulls: 0, pickup: 0, spook: 0, pilgrim: 0, goldTicket: 0 };
        });

        // 💡 배너별 데이터 계산용 객체 추가
        let bannerStats = {};

        // 모든 기록을 돌며 합산
        state.allHistoryRecords.forEach(record => {
            let maxPullNum = 0;
            const pulls = record.pullRecords || {};
            
            // 총 가챠 횟수 계산
            Object.keys(pulls).forEach(p => {
                if (Number(p) > maxPullNum) maxPullNum = Number(p);
            });

            // 💡 배너 정보 기준으로 묶기 위한 키값 생성 (이름 + 날짜)
            let bannerKey = (record.bannerInfo.nameKor || '이름 없는 배너') + "||" + (record.bannerInfo.dateStart || '');
            if (!bannerStats[bannerKey]) {
                bannerStats[bannerKey] = { 
                    name: record.bannerInfo.nameKor || '이름 없는 배너',
                    date: record.bannerInfo.dateStart || '',
                    pulls: 0, pickup: 0, spook: 0, pilgrim: 0, goldTicket: 0 
                };
            }
            
            if (accountStats[record.account]) {
                accountStats[record.account].pulls += maxPullNum;
                globalStats.pulls += maxPullNum;
            }
            bannerStats[bannerKey].pulls += maxPullNum; // 해당 배너의 가챠 횟수 합산

            // 세부 SSR 내역 합산
            Object.values(pulls).forEach(pData => {
                if (pData.details && pData.details.length > 0) {
                    pData.details.forEach(det => {
                        if (det.type === 'pickup') { 
                            accountStats[record.account].pickup++; 
                            globalStats.pickup++; 
                            bannerStats[bannerKey].pickup++; // 배너별 합산 추가
                        }
                        if (det.type === 'spook') { 
                            accountStats[record.account].spook++; 
                            globalStats.spook++; 
                            bannerStats[bannerKey].spook++; // 배너별 합산 추가
                        }
                        if (det.type === 'pilgrim') { 
                            accountStats[record.account].pilgrim++; 
                            globalStats.pilgrim++; 
                            bannerStats[bannerKey].pilgrim++; // 배너별 합산 추가
                        }
                        if (det.type === 'goldTicket') {
                            const count = Number(det.name) || 1;
                            accountStats[record.account].goldTicket += count;
                            globalStats.goldTicket += count;
                            bannerStats[bannerKey].goldTicket += count; // 배너별 합산 추가
                        }
                    });
                }
            });
        });

        // 카드 생성 함수 (디자인)
        const createStatCard = (title, data, subtitle = "") => {
            const totalSSR = data.pickup + data.spook + data.pilgrim;
            const ssrRate = data.pulls > 0 ? ((totalSSR / data.pulls) * 100).toFixed(2) : 0;
            
            return `
              <div class="card" style="margin-bottom: 15px;">
                <div style="border-bottom: 2px solid var(--border); padding-bottom: 10px; margin-bottom: 15px;">
                    <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-main);">${title}</h3>
                    ${subtitle ? `<div style="font-size:0.8rem; color:#888; margin-top:4px;">📅 ${subtitle}</div>` : ''}
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                  <div style="flex: 1; min-width: 120px; background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0;">
                    <div style="font-size: 0.8rem; color: #64748b; font-weight: bold;">총 가챠 횟수</div>
                    <div style="font-size: 1.5rem; color: var(--text-main); font-weight: bold; margin-top: 5px;">${data.pulls}회</div>
                  </div>
                  <div style="flex: 1; min-width: 120px; background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0;">
                    <div style="font-size: 0.8rem; color: #64748b; font-weight: bold;">SSR 획득률</div>
                    <div style="font-size: 1.5rem; color: var(--primary); font-weight: bold; margin-top: 5px;">${ssrRate}%</div>
                  </div>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 15px;">
                  <span style="flex: 1; text-align: center; color:#e67e22; background:#fff3e0; padding:8px; border-radius:6px; font-weight:bold; font-size:0.9rem;">픽업 ${data.pickup}</span>
                  <span style="flex: 1; text-align: center; color:#9b59b6; background:#f4eaff; padding:8px; border-radius:6px; font-weight:bold; font-size:0.9rem;">픽뚫 ${data.spook}</span>
                  <span style="flex: 1; text-align: center; color:#3498db; background:#e1f5fe; padding:8px; border-radius:6px; font-weight:bold; font-size:0.9rem;">필그림 ${data.pilgrim}</span>
                </div>
                ${data.goldTicket > 0 ? `<div style="margin-top: 10px; font-size: 0.85rem; color: #888; text-align: right;">※ 골드 마일리지 누적 사용: ${data.goldTicket}장</div>` : ''}
              </div>
            `;
        };

        // 선택된 모드에 따라 화면 그리기
        if (mode === 'ALL') {
            container.innerHTML = createStatCard('🌟 모든 계정 통합 통계', globalStats);
        } else if (mode === 'EACH') {
            let htmlStr = '';
            state.ACCOUNT_LIST.forEach(acc => {
                if(accountStats[acc].pulls > 0) { // 가챠 기록이 있는 계정만 표시
                    htmlStr += createStatCard(acc, accountStats[acc]);
                }
            });
            if (htmlStr === '') {
                htmlStr = `<p style="text-align:center; padding:20px; color:var(--text-muted);">가챠 기록이 있는 계정이 없습니다.</p>`;
            }
            container.innerHTML = htmlStr;
        } else if (mode === 'BANNER') {
            // 💡 배너별 모드일 때 그리기
            let htmlStr = '';
            const bannerArray = Object.values(bannerStats);
            
            if (bannerArray.length === 0) {
                htmlStr = `<p style="text-align:center; padding:20px; color:var(--text-muted);">가챠 기록이 있는 배너가 없습니다.</p>`;
            } else {
                bannerArray.forEach(bData => {
                    if(bData.pulls > 0) { // 진행 횟수가 있는 배너만 출력
                        htmlStr += createStatCard(`✨ ${bData.name} <span style="font-size:0.8rem; color:#888; font-weight:normal;">(7계정 총합)</span>`, bData, bData.date);
                    }
                });
                if (htmlStr === '') {
                    htmlStr = `<p style="text-align:center; padding:20px; color:var(--text-muted);">진행된 가챠 기록이 없습니다.</p>`;
                }
            }
            container.innerHTML = htmlStr;
        }
    }
};
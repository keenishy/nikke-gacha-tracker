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

        // 픽업 일정별 데이터 계산용 객체
        let pickupStats = {};

        // 모든 기록을 돌며 합산
        state.allHistoryRecords.forEach(record => {
            let maxPullNum = 0;
            const pulls = record.pullRecords || {};
            
            // 총 가챠 횟수 계산
            Object.keys(pulls).forEach(p => {
                if (Number(p) > maxPullNum) maxPullNum = Number(p);
            });

            // 픽업 일정별 키 생성 (이름 + 날짜)
            let bannerInfo = record.bannerInfo || {};
            let pName = (bannerInfo.nameKor || '').trim() || '이름 없는 픽업';
            let pDate = (bannerInfo.dateStart || '').trim() || '기간 미입력';
            let pickupKey = pName + "___" + pDate;
            
            if (!pickupStats[pickupKey]) {
                pickupStats[pickupKey] = { 
                    name: pName,
                    date: pDate,
                    total: { pulls: 0, pickup: 0, spook: 0, pilgrim: 0, goldTicket: 0 },
                    accounts: {}
                };
                state.ACCOUNT_LIST.forEach(acc => {
                    pickupStats[pickupKey].accounts[acc] = { pulls: 0, pickup: 0, spook: 0, pilgrim: 0, goldTicket: 0 };
                });
            }
            
            if (accountStats[record.account]) {
                accountStats[record.account].pulls += maxPullNum;
                globalStats.pulls += maxPullNum;
            }
            
            pickupStats[pickupKey].total.pulls += maxPullNum;
            if (pickupStats[pickupKey].accounts[record.account] !== undefined) {
                pickupStats[pickupKey].accounts[record.account].pulls += maxPullNum;
            }

            // 💡 SSR 합산을 도와주는 헬퍼 함수
            const addCount = (type, count) => {
                if (!count || isNaN(count)) return;
                if (accountStats[record.account]) accountStats[record.account][type] += count;
                globalStats[type] += count;
                pickupStats[pickupKey].total[type] += count;
                if (pickupStats[pickupKey].accounts[record.account] !== undefined) {
                    pickupStats[pickupKey].accounts[record.account][type] += count;
                }
            };

            // 세부 SSR 내역 합산
            Object.values(pulls).forEach(pData => {
                // 1. 신규 기록 방식 (버튼으로 꼼꼼하게 누른 데이터)
                if (pData.details && pData.details.length > 0) {
                    pData.details.forEach(det => {
                        let t = det.type;
                        let count = (t === 'goldTicket') ? (Number(det.name) || 1) : 1;
                        if (t === 'pickup' || t === 'spook' || t === 'pilgrim' || t === 'goldTicket') {
                            addCount(t, count);
                        }
                    });
                } 
                // 2. 💡 구버전 방식 (엑셀에서 이관된 데이터: 세부 분류 없이 숫자로만 저장된 경우)
                else {
                    if (pData.pickup > 0) addCount('pickup', pData.pickup);
                    if (pData.spook > 0) addCount('spook', pData.spook);
                    if (pData.pilgrim > 0) addCount('pilgrim', pData.pilgrim);
                    if (pData.goldTicket > 0) addCount('goldTicket', pData.goldTicket);
                }
            });
        });

        // 카드 생성 함수 (디자인) - 기존 (전체/계정별)
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
        } else if (mode === 'PICKUP') {
            let htmlStr = '';
            const pickupArray = Object.values(pickupStats);
            
            // 이름순이나 최근 등록순 등 원하는 정렬이 있다면 이 부분에 추가할 수 있습니다.
            
            if (pickupArray.length === 0) {
                htmlStr = `<p style="text-align:center; padding:20px; color:var(--text-muted);">가챠 기록이 있는 픽업 일정이 없습니다.</p>`;
            } else {
                pickupArray.forEach(pData => {
                    if(pData.total.pulls > 0) { 
                        const tData = pData.total;
                        const totalSSR = tData.pickup + tData.spook + tData.pilgrim;
                        const ssrRate = tData.pulls > 0 ? ((totalSSR / tData.pulls) * 100).toFixed(2) : 0;
                        
                        let tableRows = '';
                        state.ACCOUNT_LIST.forEach(acc => {
                            const aData = pData.accounts[acc];
                            if(aData.pulls > 0 || aData.goldTicket > 0) {
                                let accShort = acc.replace(/^\d\s/, '');
                                const accTotalSSR = aData.pickup + aData.spook + aData.pilgrim;
                                const accSsrRate = aData.pulls > 0 ? ((accTotalSSR / aData.pulls) * 100).toFixed(2) : 0;

                                tableRows += `
                                    <tr style="border-bottom:1px solid #f0f2f5;">
                                        <td style="padding:8px 5px; font-weight:bold; color:var(--text-main);">${accShort}</td>
                                        <td style="padding:8px 5px;">${aData.pulls}</td>
                                        <td style="padding:8px 5px; color:#e67e22;">${aData.pickup}</td>
                                        <td style="padding:8px 5px; color:#9b59b6;">${aData.spook}</td>
                                        <td style="padding:8px 5px; color:#3498db;">${aData.pilgrim}</td>
                                        <td style="padding:8px 5px; color:var(--primary); font-weight:bold;">${accSsrRate}%</td>
                                        <td style="padding:8px 5px; color:#e67e22; font-size:0.75rem;">${aData.goldTicket > 0 ? aData.goldTicket+'장' : '-'}</td>
                                    </tr>
                                `;
                            }
                        });

                        htmlStr += `
                          <div class="card" style="margin-bottom: 20px;">
                            <div style="border-bottom: 2px solid var(--primary); padding-bottom: 10px; margin-bottom: 15px;">
                                <h3 style="margin: 0; font-size: 1.15rem; color: var(--text-main);">✨ [픽업] ${pData.name}</h3>
                                ${pData.date ? `<div style="font-size:0.8rem; color:#888; margin-top:4px;">📅 일정: ${pData.date}</div>` : ''}
                            </div>
                            
                            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 15px; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
                              <div style="flex:1; text-align:center;">
                                <div style="font-size:0.75rem; color:#64748b;">7계정 총 가챠</div>
                                <div style="font-weight:bold; color:var(--text-main); font-size:1.1rem;">${tData.pulls}회</div>
                              </div>
                              <div style="flex:1; text-align:center; border-left:1px solid #e2e8f0;">
                                <div style="font-size:0.75rem; color:#64748b;">총 픽업</div>
                                <div style="font-weight:bold; color:#e67e22; font-size:1.1rem;">${tData.pickup}돌파</div>
                              </div>
                              <div style="flex:1; text-align:center; border-left:1px solid #e2e8f0;">
                                <div style="font-size:0.75rem; color:#64748b;">평균 SSR 확률</div>
                                <div style="font-weight:bold; color:var(--primary); font-size:1.1rem;">${ssrRate}%</div>
                              </div>
                            </div>

                            <div style="font-size:0.85rem; font-weight:bold; color:var(--text-main); margin-bottom:8px;">📊 각 계정별 결과</div>
                            <div class="table-responsive" style="margin-top:0; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                                <table style="width:100%; border-collapse:collapse; text-align:center; font-size:0.85rem; min-width:300px;">
                                    <thead style="background:#f8fafc; color:var(--text-muted); font-size:0.75rem;">
                                        <tr>
                                            <th style="padding:8px 5px;">계정</th>
                                            <th style="padding:8px 5px;">진행횟수</th>
                                            <th style="padding:8px 5px;">픽업</th>
                                            <th style="padding:8px 5px;">픽뚫</th>
                                            <th style="padding:8px 5px;">필그림</th>
                                            <th style="padding:8px 5px;">SSR확률</th>
                                            <th style="padding:8px 5px;">골티사용</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${tableRows}
                                    </tbody>
                                </table>
                            </div>
                          </div>
                        `;
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
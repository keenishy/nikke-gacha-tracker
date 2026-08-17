import { state } from "./state.js";
import { dbService } from "./db.js";

export const ui = {
    renderPullCell(cellData) {
        if (!cellData) return `<div style="color:#cbd5e1; font-weight:bold; font-size:0.8rem;">-</div>`;

        let memoText = cellData.memo || "";
        let isBlank = cellData.isBlank || cellData.isAllBlue || cellData.isAllPurple || memoText.toLowerCase() === 'x';
        if (isBlank && memoText === "") memoText = "꽝";
        if (isBlank && memoText.toLowerCase() === "x") memoText = "꽝";

        let cellHTML = "";

        if (cellData.details && cellData.details.length > 0) {
            cellData.details.forEach(det => {
                let tCol = '#e67e22', bCol = '#fff3e0', bdCol = '#ffe0b2';
                if (det.type === 'spook') { tCol = '#9b59b6'; bCol = '#f4eaff'; bdCol = '#ebd4ff'; }
                else if (det.type === 'pilgrim') { tCol = '#3498db'; bCol = '#e1f5fe'; bdCol = '#b3e5fc'; }
                if (det.isDust) { bCol = '#e8f5e9'; bdCol = '#a5d6a7'; }

                let dName = (det.name || "").trim();
                if (dName === "") { dName = det.type === 'pickup' ? '픽업' : det.type === 'spook' ? '픽뚫' : det.type === 'pilgrim' ? '필그림' : '골티'; }
                
                cellHTML += `<div style="background:${bCol}; border:1px solid ${bdCol}; color:${tCol}; font-size:0.75rem; font-weight:bold; padding:2px 1px; border-radius:4px; margin-bottom:2px; word-break:break-all; white-space:normal; line-height:1.2; text-align:center;">${dName}</div>`;
            });
            if (memoText.trim() !== "") {
                cellHTML += `<div style="color:#64748b; font-size:0.7rem; margin-top:2px; word-break:break-all; white-space:normal; line-height:1.2; text-align:center;">${memoText}</div>`;
            }
        } else {
            if (isBlank) {
                cellHTML = `<div style="color:#cbd5e1; font-weight:bold; font-size:0.8rem;">-</div>`;
            } else {
                let tCol = 'var(--text-main)', bCol = 'transparent', bdCol = 'transparent';
                
                if (cellData.pilgrim > 0) { tCol = '#3498db'; bCol = '#e1f5fe'; bdCol = '#b3e5fc'; }
                else if (cellData.pickup > 0) { tCol = '#e67e22'; bCol = '#fff3e0'; bdCol = '#ffe0b2'; }
                else if (cellData.spook > 0) { tCol = '#9b59b6'; bCol = '#f4eaff'; bdCol = '#ebd4ff'; }
                else if (cellData.goldTicket > 0) { tCol = '#e67e22'; bCol = '#fff3e0'; bdCol = '#ffe0b2'; }
                if (cellData.isDust) { bCol = '#e8f5e9'; bdCol = '#a5d6a7'; }

                if (memoText.trim() === "" && tCol !== 'var(--text-main)') {
                    memoText = cellData.pilgrim > 0 ? '필그림' : cellData.pickup > 0 ? '픽업' : cellData.spook > 0 ? '픽뚫' : '골티';
                }

                if (tCol !== 'var(--text-main)') {
                    cellHTML += `<div style="background:${bCol}; border:1px solid ${bdCol}; color:${tCol}; font-size:0.75rem; font-weight:bold; padding:2px 1px; border-radius:4px; word-break:break-all; white-space:normal; line-height:1.2; text-align:center;">${memoText}</div>`;
                } else {
                    cellHTML += `<div style="color:var(--text-main); font-weight:bold; font-size:0.75rem; line-height:1.2; word-break:break-all; white-space:normal; text-align:center;">${memoText}</div>`;
                }
            }
        }
        return cellHTML;
    },

    renderPage(page) {
        const container = document.getElementById('pullContainer'); container.innerHTML = '';
        let startPull = (page - 1) * state.pullsPerPage + 10; let endPull = page * state.pullsPerPage;
        document.getElementById('pageIndicator').innerText = `${startPull}~${endPull}회 구간`;

        for (let i = startPull; i <= endPull; i += 10) {
            if (!state.pullData[i]) state.pullData[i] = { details: [], memo: "", isBlank: false, isAllBlue: false, isAllPurple: false };
            const data = state.pullData[i]; const isBlankState = data.isBlank || data.isAllBlue || data.isAllPurple;

            let detailsHTML = '';
            if (data.details && data.details.length > 0) {
                data.details.forEach((det, idx) => {
                    let badgeClass = det.type;
                    let badgeText = det.type === 'pickup' ? '픽업' : det.type === 'spook' ? '픽뚫' : det.type === 'pilgrim' ? '필그림' : '골티';
                    let dustHTML = det.type !== 'goldTicket' ? `<label style="font-size:0.8rem; color:#888; display:flex; align-items:center; gap:2px;"><input type="checkbox" ${det.isDust ? 'checked' : ''} onchange="window.ui.updateDetail(${i}, ${idx}, 'isDust', this.checked)">가루</label>` : '';
                    
                    let placeholderText = det.type === 'goldTicket' ? '몇 장?' : '누구?';
                    
                    detailsHTML += `
                      <div class="detail-row">
                        <span class="detail-badge ${badgeClass}">${badgeText}</span>
                        <input type="text" class="detail-input" placeholder="${placeholderText}" value="${det.name}" oninput="window.ui.updateDetail(${i}, ${idx}, 'name', this.value)">
                        ${dustHTML}
                        <button class="btn-remove" onclick="window.ui.removeDetail(${i}, ${idx})">❌</button>
                      </div>
                    `;
                });
            }

            const card = document.createElement('div'); card.className = `pull-card ${isBlankState ? 'is-blank' : ''}`; card.id = `card_${i}`;
            card.innerHTML = `
              <div class="pull-card-top">
                <div class="badge">${i}회</div>
                <div class="checkbox-group">
                  <label><input type="checkbox" ${data.isBlank ? 'checked' : ''} onchange="window.ui.toggleCheck(${i}, 'isBlank', this.checked)">꽝</label>
                  <label><input type="checkbox" ${data.isAllBlue ? 'checked' : ''} onchange="window.ui.toggleCheck(${i}, 'isAllBlue', this.checked)">올블루</label>
                  <label><input type="checkbox" ${data.isAllPurple ? 'checked' : ''} onchange="window.ui.toggleCheck(${i}, 'isAllPurple', this.checked)">올퍼플</label>
                </div>
              </div>
              <div class="add-buttons">
                <button class="add-btn pickup" onclick="window.ui.addDetail(${i}, 'pickup')">+ 픽업</button>
                <button class="add-btn spook" onclick="window.ui.addDetail(${i}, 'spook')">+ 픽뚫</button>
                <button class="add-btn pilgrim" onclick="window.ui.addDetail(${i}, 'pilgrim')">+ 필그림</button>
                <button class="add-btn gold" onclick="window.ui.addDetail(${i}, 'goldTicket')">+ 골티</button>
              </div>
              <div id="details_${i}" style="margin-bottom:8px;">${detailsHTML}</div>
              <div class="pull-card-bottom"><span style="font-size: 0.8rem; font-weight: bold; color: var(--text-muted); white-space:nowrap;">기타 메모</span><input type="text" placeholder="" value="${data.memo}" oninput="window.ui.updateMemo(${i}, this.value)"></div>
            `;
            container.appendChild(card);
        }
        this.renderPagination();
    },

    renderPagination() {
        const pageContainer = document.getElementById('paginationContainer'); pageContainer.innerHTML = '';
        for (let p = 1; p <= state.totalPages; p++) {
            const btn = document.createElement('button'); btn.className = `page-btn ${p === state.currentPage ? 'active' : ''}`; btn.innerText = p;
            btn.onclick = () => { state.currentPage = p; this.renderPage(state.currentPage); }; 
            pageContainer.appendChild(btn);
        }
    },

    renderHistory() {
        const historyContainer = document.getElementById('historyContainer');
        historyContainer.innerHTML = '';

        if (state.currentHistoryAccount === 'ALL') {
            let orderedBanners = [];
            let bannerMap = {};
            
            state.allHistoryRecords.forEach(data => {
                let key = (data.bannerInfo.nameKor || '무명') + "||" + (data.bannerInfo.dateStart || '');
                if(!bannerMap[key]) {
                    bannerMap[key] = { info: data.bannerInfo, accounts: {} };
                    orderedBanners.push(key); 
                }
                bannerMap[key].accounts[data.account] = data;
            });

            if(orderedBanners.length === 0) {
                historyContainer.innerHTML = `<p style="text-align:center; padding:20px; color:var(--text-muted);">저장된 기록이 없습니다.</p>`;
                return;
            }

            orderedBanners.forEach(key => {
                const group = bannerMap[key];
                const bInfo = group.info;
                let dateStr = bInfo.dateStart || "";
                
                const card = document.createElement('div');
                card.className = 'card';
                card.style.marginBottom = '0';
                card.style.padding = '15px';
                
                let headerHTML = `
                  <div style="border-bottom: 2px solid var(--border); padding-bottom: 10px; margin-bottom: 10px;">
                    <h3 style="margin:0 0 6px 0; font-size:1.1rem; color:var(--text-main);">✨ ${bInfo.nameKor || '이름 없는 배너'}</h3>
                    <div style="font-size:0.8rem; color:var(--text-muted); display:flex; align-items:center; flex-wrap:wrap; gap:5px;">
                      ${dateStr ? `<span>📅 ${dateStr}</span>` : ''}
                      <span style="background:#f4f6f8; padding:2px 6px; border-radius:4px; margin-left:5px;">${bInfo.bannerType || '분류 없음'}</span>
                    </div>
                  </div>
                `;

                let maxPullNum = 0;
                state.ACCOUNT_LIST.forEach(acc => {
                    if(group.accounts[acc] && group.accounts[acc].pullRecords) {
                        Object.keys(group.accounts[acc].pullRecords).forEach(p => {
                            if(Number(p) > maxPullNum) maxPullNum = Number(p);
                        });
                    }
                });

                if (maxPullNum === 0) {
                    card.innerHTML = headerHTML + `<div style="text-align:center; padding:20px; color:#aaa; font-size:0.9rem; font-weight:bold; background:#f8fafc; border-radius:8px; border:1px dashed #e2e8f0; margin-top:10px;">아직 진행된 가챠 기록이 없습니다.</div>`;
                    historyContainer.appendChild(card);
                    return;
                }

                let tableHTML = `<div class="table-responsive"><table class="gacha-table"><thead><tr><th class="sticky-col">계정명</th>`;
                for(let i=10; i<=maxPullNum; i+=10) { tableHTML += `<th>${i}회</th>`; }
                tableHTML += `</tr></thead><tbody>`;

                state.ACCOUNT_LIST.forEach(acc => {
                    let accShort = acc.replace(/^\d\s/, ''); 
                    tableHTML += `<tr><td class="sticky-col">${accShort}</td>`;
                    
                    const pulls = group.accounts[acc] ? (group.accounts[acc].pullRecords || {}) : {};
                    
                    // 💡 핵심 로직: 해당 계정이 실제로 진행한 '최대 가챠 횟수'를 파악합니다.
                    let accMaxPullNum = 0;
                    Object.keys(pulls).forEach(p => {
                        if (Number(p) > accMaxPullNum) accMaxPullNum = Number(p);
                    });
                    
                    for(let i=10; i<=maxPullNum; i+=10) {
                        if (i > accMaxPullNum) {
                            // 💡 진행하지 않은 구간: 아예 기호 없이 어두운 회색으로 비워둡니다.
                            tableHTML += `<td style="background-color: #f1f5f9; border: 1px solid #e2e8f0;"></td>`;
                        } else {
                            // 💡 진행은 했으나 SSR을 못 먹은 구간(또는 먹은 구간): '-' 또는 데이터 렌더링
                            let cellHTML = this.renderPullCell(pulls[i]);
                            tableHTML += `<td>${cellHTML}</td>`;
                        }
                    }
                    tableHTML += `</tr>`;
                });

                tableHTML += `</tbody></table></div>`;
                card.innerHTML = headerHTML + tableHTML;
                historyContainer.appendChild(card);
            });
            return;
        }

        const filteredRecords = state.allHistoryRecords.filter(data => data.account === state.currentHistoryAccount);

        if(filteredRecords.length === 0) {
            historyContainer.innerHTML = `<p style="text-align:center; padding:20px; color:var(--text-muted);">[${state.currentHistoryAccount}] 계정에는 저장된 기록이 없습니다.</p>`;
            return;
        }

        filteredRecords.forEach(data => {
            let maxPullNum = 0;
            let totalGoldTickets = 0; 
            let totalPickup = 0;   
            let totalSpook = 0;    
            let totalPilgrim = 0;  
            let pullDetailsHTML = "";
            let oldGoldTicketText = []; 
            
            const pulls = data.pullRecords || {};
            const pullKeys = Object.keys(pulls);

            if (pullKeys.length > 0) {
                pullDetailsHTML = `<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap:8px; margin-top:10px; max-height:350px; overflow-y:auto; padding-right:5px; border-top:1px dashed var(--border); padding-top:10px;">`;
                const sortedPulls = pullKeys.map(Number).sort((a,b) => a - b);
                let hasValidPulls = false;

                sortedPulls.forEach(pull => {
                    const pData = pulls[pull];
                    let memoText = pData.memo || "";
                    
                    if(pull > maxPullNum) maxPullNum = pull;
                    hasValidPulls = true;
                    
                    const isBlank = pData.isBlank || pData.isAllBlue || pData.isAllPurple || memoText.toLowerCase() === 'x';
                    if (isBlank && memoText === "") memoText = "꽝";
                    if (isBlank && memoText.toLowerCase() === "x") memoText = "꽝";

                    if (!pData.details || pData.details.length === 0) {
                        if(memoText.includes("골티") || memoText.includes("마일리지")) oldGoldTicketText.push(memoText);
                    } else {
                        pData.details.forEach(det => {
                            if (det.type === 'pickup') { totalPickup++; }
                            if (det.type === 'spook') { totalSpook++; }
                            if (det.type === 'pilgrim') { totalPilgrim++; }
                            if (det.type === 'goldTicket') { totalGoldTickets += (Number(det.name) || 1); }
                        });
                    }

                    let blockBg = isBlank ? "#f8f9fa" : "#ffffff";
                    let blockBorder = isBlank ? "1px dashed #e2e8f0" : "1px solid #e2e8f0";
                    
                    let cellHTML = this.renderPullCell(pData);
                    
                    pullDetailsHTML += `
                      <div style="background:${blockBg}; border:${blockBorder}; border-radius:8px; padding:10px 5px; box-shadow:0 1px 2px rgba(0,0,0,0.02); display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:80px; text-align:center;">
                        <div style="font-weight:bold; color:#64748b; margin-bottom:8px; font-size:0.8rem;">${pull}회</div>
                        <div style="width:100%;">${cellHTML}</div>
                      </div>
                    `;
                });
                
                pullDetailsHTML += `</div>`;
                if (!hasValidPulls) pullDetailsHTML = ""; 
            }

            if (pullDetailsHTML === "") {
                pullDetailsHTML = `<div style="padding:15px; text-align:center; color:var(--text-muted); background:#f8f9fa; border-radius:8px; margin-top:10px; font-size:0.9rem; font-weight:bold;">가챠 기록이 없습니다. (스킵 또는 진행 전)</div>`;
            }

            let ssrStatsHTML = "";
            if (totalPickup > 0) ssrStatsHTML += `<span style="color:#e67e22; border:1px solid #ffe0b2; background:#fff3e0; padding:2px 6px; border-radius:4px; margin-right:5px; font-weight:bold; font-size:0.75rem;">픽업 ${totalPickup}</span>`;
            if (totalSpook > 0) ssrStatsHTML += `<span style="color:#9b59b6; border:1px solid #ebd4ff; background:#f4eaff; padding:2px 6px; border-radius:4px; margin-right:5px; font-weight:bold; font-size:0.75rem;">픽뚫 ${totalSpook}</span>`;
            if (totalPilgrim > 0) ssrStatsHTML += `<span style="color:#3498db; border:1px solid #b3e5fc; background:#e1f5fe; padding:2px 6px; border-radius:4px; margin-right:5px; font-weight:bold; font-size:0.75rem;">필그림 ${totalPilgrim}</span>`;

            let finalGoldBadge = "";
            if (totalGoldTickets > 0 || oldGoldTicketText.length > 0) {
                let texts = [];
                if (totalGoldTickets > 0) texts.push(`골드티켓 ${totalGoldTickets}장 사용`);
                if (oldGoldTicketText.length > 0) texts.push(...oldGoldTicketText);
                finalGoldBadge = `<span style="color:#e67e22; font-weight:bold; margin-left:5px; background:#fff3e0; padding:2px 6px; border-radius:4px; font-size:0.75rem;">${texts.join(' / ')}</span>`;
            }

            let dateStr = data.bannerInfo.dateStart || "";
            let attrBadge = data.bannerInfo.attribute ? `<span style="background:#f4f6f8; padding:2px 6px; border-radius:4px; margin-right:5px; font-size:0.7rem; border:1px solid #e2e8f0;">${data.bannerInfo.attribute}</span>` : '';

            const card = document.createElement('div');
            card.className = 'card';
            card.style.marginBottom = '0';
            
            card.innerHTML = `
              <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div style="width: 100%;">
                  <h3 style="margin:0; font-size:1.1rem; color:var(--text-main);">${data.bannerInfo.nameKor || '이름 없는 배너'}</h3>
                  ${dateStr ? `<div style="font-size:0.8rem; color:#888; margin-bottom:8px; margin-top:4px;">${dateStr}</div>` : ''}
                  
                  <div style="display:flex; align-items:center; flex-wrap:wrap; gap:5px; margin-bottom:6px;">
                    <span style="background:#f4f6f8; padding:2px 6px; border-radius:4px; font-size:0.75rem; color:var(--text-muted); margin-right:5px; border:1px solid #e2e8f0;">${data.bannerInfo.bannerType || '분류 없음'}</span>
                    ${attrBadge}
                    <span style="font-size:0.75rem; color:var(--text-muted); margin-right:5px; margin-left:5px;">${maxPullNum > 0 ? `총 <strong>${maxPullNum}</strong>회 진행` : '총 <strong>0</strong>회 진행'}</span>
                    ${finalGoldBadge}
                  </div>
                  <div style="display:flex; flex-wrap:wrap; gap:5px;">
                    ${ssrStatsHTML}
                  </div>
                </div>
              </div>
              ${pullDetailsHTML}
              <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:15px; border-top:1px dashed #eee; padding-top:12px;">
                <button onclick="window.ui.editRecord('${data.id}')" style="padding:6px 12px; background:#f8f9fa; border:1px solid #ddd; border-radius:6px; cursor:pointer; font-weight:bold; color:#555; transition:0.2s;">수정</button>
                <button onclick="window.ui.deleteRecord('${data.id}')" style="padding:6px 12px; background:#fff0f0; border:1px solid #ffcdd2; border-radius:6px; cursor:pointer; font-weight:bold; color:#e74c3c; transition:0.2s;">삭제</button>
              </div>
            `;
            historyContainer.appendChild(card);
        });
    },

    switchView(viewName) {
        document.querySelectorAll('.module-view').forEach(el => el.classList.remove('active'));
        document.getElementById('view-' + viewName).classList.add('active');
        
        document.querySelectorAll('.tab-btn-input, .tab-btn-history, .tab-btn-stats').forEach(el => el.classList.remove('active'));
        
        if (viewName === 'input') {
            document.querySelectorAll('.tab-btn-input').forEach(el => el.classList.add('active'));
        } else if (viewName === 'history') {
            document.querySelectorAll('.tab-btn-history').forEach(el => el.classList.add('active'));
            dbService.loadHistory();
        } else if (viewName === 'stats') {
            document.querySelectorAll('.tab-btn-stats').forEach(el => el.classList.add('active'));
            import("./db.js").then(mod => {
                mod.dbService.loadHistory().then(() => {
                    const firstBtn = document.querySelector('#view-stats .acc-btn');
                    if(window.stats) window.stats.render('ALL', firstBtn);
                });
            });
        }
    },

    clearForm() {
        state.currentEditId = null;
        document.getElementById('editStatusBadge').style.display = 'none';
        document.getElementById('btnSaveToDB').innerText = "데이터베이스에 저장하기";
        document.getElementById('btnSaveToDB').style.background = "var(--primary)";
        
        document.getElementById('nameKor').value = "";
        document.getElementById('bannerType').value = "";
        document.getElementById('dateStart').value = "";
        this.selectAttr('fire', '작열', 'fire.png'); 
        
        const inputBtns = document.querySelectorAll('#view-input .acc-btn');
        inputBtns.forEach(el => el.classList.remove('active'));
        document.querySelector('#view-input .btn-all').classList.add('active');
        
        state.pullData = {};
        state.currentPage = 1;
        this.renderPage(state.currentPage);
    },

    clearPullsOnly() {
        state.pullData = {};
        state.currentPage = 1;
        this.renderPage(state.currentPage);
    },

    toggleAttrMenu(e) { e.stopPropagation(); document.getElementById('attrOptions').classList.toggle('show'); },
    selectAttr(val, text, imgSrc) {
        document.getElementById('selectedAttrText').innerText = text; document.getElementById('selectedAttrIcon').src = imgSrc;
        const colors = { 'fire': 'var(--attr-fire)', 'wind': 'var(--attr-wind)', 'iron': 'var(--attr-iron)', 'electric': 'var(--attr-electric)', 'water': 'var(--attr-water)' };
        document.getElementById('nameKor').style.borderLeftColor = colors[val]; 
        document.getElementById('attrOptions').classList.remove('show');
    },

    selectAccount(btn, accName) {
        const inputBtns = document.querySelectorAll('#view-input .acc-btn');
        inputBtns.forEach(el => el.classList.remove('active')); btn.classList.add('active');
    },
    addDetail(pull, type) {
        if(!state.pullData[pull]) state.pullData[pull] = { details: [], memo: "", isBlank: false, isAllBlue: false, isAllPurple: false };
        if(!state.pullData[pull].details) state.pullData[pull].details = [];
        state.pullData[pull].details.push({ type: type, name: "", isDust: false });
        this.renderPage(state.currentPage);
    },
    removeDetail(pull, index) {
        state.pullData[pull].details.splice(index, 1);
        this.renderPage(state.currentPage);
    },
    updateDetail(pull, index, key, val) { state.pullData[pull].details[index][key] = val; },
    updateMemo(pull, text) {
        if(!state.pullData[pull]) state.pullData[pull] = { details: [], memo: "", isBlank: false, isAllBlue: false, isAllPurple: false };
        state.pullData[pull].memo = text;
    },
    toggleCheck(pull, key, isChecked) {
        if(!state.pullData[pull]) state.pullData[pull] = { details: [], memo: "", isBlank: false, isAllBlue: false, isAllPurple: false };
        state.pullData[pull][key] = isChecked;
        const card = document.getElementById(`card_${pull}`);
        if (state.pullData[pull].isBlank || state.pullData[pull].isAllBlue || state.pullData[pull].isAllPurple) { card.classList.add('is-blank'); } else { card.classList.remove('is-blank'); }
    },
    filterHistory(accName, btn) {
        document.querySelectorAll('#view-history .acc-btn').forEach(el => el.classList.remove('active'));
        btn.classList.add('active');
        state.currentHistoryAccount = accName;
        if (state.allHistoryRecords.length > 0) { this.renderHistory(); } 
        else { dbService.loadHistory(); }
    },
    editRecord(docId) {
        state.savedScrollPosition = document.querySelector('.main-content').scrollTop;

        const targetData = state.allHistoryRecords.find(r => r.id === docId);
        if (!targetData) return;

        state.currentEditId = docId;

        document.getElementById('nameKor').value = targetData.bannerInfo.nameKor || "";
        document.getElementById('dateStart').value = targetData.bannerInfo.dateStart || "";
        document.getElementById('bannerType').value = targetData.bannerInfo.bannerType || "";
        
        const attrText = targetData.bannerInfo.attribute || "작열";
        const attrMap = {
            '작열': { val: 'fire', icon: 'fire.png' },
            '풍압': { val: 'wind', icon: 'wind.png' },
            '철갑': { val: 'iron', icon: 'iron.png' },
            '전격': { val: 'electric', icon: 'electric.png' },
            '수냉': { val: 'water', icon: 'water.png' }
        };
        const attrInfo = attrMap[attrText] || attrMap['작열'];
        this.selectAttr(attrInfo.val, attrText, attrInfo.icon);

        document.querySelectorAll('#view-input .acc-btn').forEach(btn => {
            if(btn.innerText === targetData.account) { btn.classList.add('active'); }
            else { btn.classList.remove('active'); }
        });

        let clonedRecords = JSON.parse(JSON.stringify(targetData.pullRecords || {}));
        for(let key in clonedRecords) {
            if(!clonedRecords[key].details) clonedRecords[key].details = [];
        }
        state.pullData = clonedRecords;

        document.getElementById('editStatusBadge').style.display = 'inline-block';
        document.getElementById('btnSaveToDB').innerText = "수정 완료 (업데이트 후 보관소 복귀)";
        document.getElementById('btnSaveToDB').style.background = "#2ecc71"; 
        
        this.switchView('input');
        state.currentPage = 1;
        this.renderPage(state.currentPage);
        window.scrollTo(0, 0); 
    },
    deleteRecord(docId) {
        dbService.deleteRecord(docId);
    }
};
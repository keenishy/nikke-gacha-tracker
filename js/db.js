import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db } from "./firebase.js";
import { state } from "./state.js";
import { ui } from "./ui.js";

export const dbService = {
    async saveRecord() {
        try {
            const activeAccount = document.querySelector('#view-input #accountBar .acc-btn.active').innerText;
            
            const bannerData = {
                nameKor: document.getElementById('nameKor').value,
                nameEng: "", 
                attribute: document.getElementById('selectedAttrText').innerText,
                maker: "", 
                weapon: "", 
                bannerType: document.getElementById('bannerType').value,
                storyName: "", 
                dateStart: document.getElementById('dateStart').value,
                dateEnd: ""
            };

            let cleanedPullData = {};
            for (const [pull, pData] of Object.entries(state.pullData)) {
                if ((pData.details && pData.details.length > 0) || pData.memo.trim() !== "" || pData.isBlank || pData.isAllBlue || pData.isAllPurple) {
                    cleanedPullData[pull] = pData;
                }
            }

            const record = { account: activeAccount, bannerInfo: bannerData, pullRecords: cleanedPullData };

            if (state.currentEditId) {
                // 수정 모드일 때는 저장 후 보관소로 돌아가며 전체를 비웁니다.
                await updateDoc(doc(db, "gacha_records", state.currentEditId), record);
                ui.clearForm();
                ui.switchView('history');
            } else {
                // 💡 새 기록 저장 시: 뽑기 기록만 비우고 기본 정보는 유지합니다.
                record.createdAt = serverTimestamp();
                await addDoc(collection(db, "gacha_records"), record);
                alert(`[${activeAccount}] 저장 완료! 다음 계정의 기록을 이어서 작성할 수 있습니다.`);
                ui.clearPullsOnly(); 
            }
        } catch (e) {
            console.error("Error saving document: ", e);
            alert("저장 중 오류가 발생했습니다.");
        }
    },

    async loadHistory() {
        const historyContainer = document.getElementById('historyContainer');
        historyContainer.innerHTML = '<p style="text-align:center; padding:20px; color:var(--text-muted); font-weight:bold;">데이터를 불러오는 중입니다... ⏳</p>';

        try {
            const querySnapshot = await getDocs(collection(db, "gacha_records"));
            state.allHistoryRecords = [];
            querySnapshot.forEach(doc => state.allHistoryRecords.push({ id: doc.id, ...doc.data() }));

            if (state.allHistoryRecords.length === 0) {
                historyContainer.innerHTML = '<p style="text-align:center; padding:20px; color:var(--text-muted);">저장된 기록이 없습니다.</p>';
                return;
            }

            state.allHistoryRecords.sort((a, b) => {
                function getSortScore(doc) {
                    let text = (doc.bannerInfo.dateStart || "") + " ";
                    if (doc.pullRecords && doc.pullRecords["10"]) text += (doc.pullRecords["10"].memo || "") + " ";
                    let match = text.match(/(202\d)\s*[년\.\-]\s*(\d{1,2})\s*[월\.\-]\s*(\d{1,2})/);
                    if (match) return parseInt(match[1]) * 10000 + parseInt(match[2]) * 100 + parseInt(match[3]);
                    match = text.match(/(202\d)\s*[년\.\-]\s*(\d{1,2})/);
                    if (match) return parseInt(match[1]) * 10000 + parseInt(match[2]) * 100;
                    match = text.match(/(202\d)/);
                    if (match) return parseInt(match[1]) * 10000;
                    return 0;
                }
                let scoreA = getSortScore(a);
                let scoreB = getSortScore(b);
                if (scoreA !== scoreB) return scoreB - scoreA;
                let tA = a.createdAt ? a.createdAt.toMillis() : 0;
                let tB = b.createdAt ? b.createdAt.toMillis() : 0;
                if (scoreA === 0 && scoreB === 0) return tA - tB;
                return tB - tA;
            });

            ui.renderHistory();

            if (state.savedScrollPosition !== null) {
                setTimeout(() => {
                    document.querySelector('.main-content').scrollTop = state.savedScrollPosition;
                    state.savedScrollPosition = null;
                }, 50);
            }
        } catch (e) {
            console.error(e);
            historyContainer.innerHTML = '<p style="text-align:center; padding:20px; color:#e74c3c; font-weight:bold;">데이터를 불러오는 중 오류가 발생했습니다.</p>';
        }
    },

    async deleteRecord(docId) {
        if (!confirm("정말 이 기록을 삭제하시겠습니까?\n(삭제 후에는 복구할 수 없습니다)")) return;
        state.savedScrollPosition = document.querySelector('.main-content').scrollTop;
        try {
            await deleteDoc(doc(db, "gacha_records", docId));
            this.loadHistory();
        } catch (e) { console.error(e); alert("삭제 중 오류가 발생했습니다."); }
    }
};
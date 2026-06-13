// =========================================================================
// 0. IMPORT TRỰC TIẾP TỪ CDN FIREBASE VÀ CONFIG GỐC
// =========================================================================
import { db } from "/js/firebase-config.js";
import { 
    collection, addDoc, updateDoc, doc, onSnapshot, query, where 
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// Tham chiếu tới các bộ sưu tập trên Cloud Firestore
const payMethodCollection = collection(db, "payment_methods");
const transactionCollection = collection(db, "transactions");

// Bộ nhớ đệm dữ liệu cục bộ đồng bộ từ Firebase
let paymentMethods = [];
let transactions = [];

document.addEventListener("DOMContentLoaded", () => {
    initBalancePage();
    listenToFirebaseData(); // Kích hoạt lắng nghe biến động Realtime từ Cloud
});

// =========================================================================
// 1. LẮNG NGHE DỮ LIỆU THỜI GIAN THỰC TỪ FIREBASE (REALTIME)
// =========================================================================
function listenToFirebaseData() {
    // A. Lắng nghe danh sách Tài khoản / Ví hoạt động
    const qMethod = query(payMethodCollection, where("status", "!=", "DELETED"));
    onSnapshot(qMethod, (snapshot) => {
        paymentMethods = [];
        snapshot.forEach((doc) => {
            paymentMethods.push({ id: doc.id, ...doc.data() });
        });
        renderAccountListAndTotal();
        renderBalanceHistoryTable();
    }, (err) => console.error("Lỗi Realtime tải tài khoản:", err));

    // B. Lắng nghe danh sách Giao dịch hoạt động
    const qTx = query(transactionCollection, where("status", "!=", "DELETED"));
    onSnapshot(qTx, (snapshot) => {
        transactions = [];
        snapshot.forEach((doc) => {
            transactions.push({ id: doc.id, ...doc.data() });
        });
        renderAccountListAndTotal(); // Vẽ lại để cập nhật số tiền trong Option Select Box
        renderBalanceHistoryTable();
    }, (err) => console.error("Lỗi Realtime tải sổ cái:", err));
}

// =========================================================================
// 2. KHỞI TẠO LOGIC VÀ XỬ LÝ SỰ KIỆN FORM ĐIỀU CHỈNH SỐ DƯ
// =========================================================================
function initBalancePage() {
    const selectMethod = document.getElementById("select-balance-method");
    const amountInput = document.getElementById("input-balance-amount");
    const formAdjust = document.getElementById("form-adjust-balance");

    if (!selectMethod) return;

    // Định dạng tiền tệ tự động gõ dấu chấm (.) ngăn lỗi nhập liệu trên di động
    if (amountInput) {
        amountInput.oninput = function() {
            let value = this.value.replace(/\D/g, "");
            if (!value) { this.value = ""; return; }
            this.value = new Intl.NumberFormat("vi-VN").format(parseInt(value, 10));
        };
    }

    // Xử lý sự kiện Submit Form cập nhật số dư thực tế lên Cloud
    if (formAdjust) {
        formAdjust.onsubmit = async function(e) {
            e.preventDefault();

            const targetMethodId = selectMethod.value;
            const rawAmount = amountInput.value.replace(/\./g, "");
            const newAmount = parseFloat(rawAmount) || 0;
            const note = document.getElementById("input-balance-note").value.trim();
            const todayIso = new Date().toISOString().split('T')[0];

            if (newAmount < 0) { alert("Số dư không được là số âm!"); return; }

            // Tìm tài khoản mục tiêu trong bộ nhớ cache
            const currentMethod = paymentMethods.find(pm => pm.id === targetMethodId);
            if (!currentMethod) { alert("Không tìm thấy thông tin tài khoản!"); return; }

            const oldAmount = currentMethod.balance;
            const targetMethodName = currentMethod.name;
            const delta = newAmount - oldAmount;

            if (delta !== 0) {
                const txType = delta > 0 ? "INCOME" : "EXPENSE";
                const absoluteDelta = Math.abs(delta);
                const nowIso = new Date().toISOString();

                try {
                    // Bước A: Cập nhật số dư mới của Ví lên Firebase
                    const methodDocRef = doc(db, "payment_methods", targetMethodId);
                    await updateDoc(methodDocRef, { 
                        balance: newAmount, 
                        updateDate: nowIso 
                    });

                    // Bước B: Tự động ghi vết dòng giao dịch điều chỉnh hệ thống vào Sổ Cái Cloud
                    await addDoc(transactionCollection, {
                        type: txType,
                        amount: absoluteDelta,
                        main_category_id: "cat_adjust_system", // Định danh danh mục hệ thống tự sinh
                        sub_category_name: "Điều chỉnh số dư",
                        method_id: targetMethodId,
                        date: todayIso,
                        note: `[Hệ thống điều chỉnh] ${note}`,
                        status: "ACTIVE",
                        createDate: nowIso
                    });

                    // Làm sạch form sau khi tác vụ hoàn thành
                    formAdjust.reset();
                    alert(`Đã cập nhật số dư ví "${targetMethodName}" thành công lên máy chủ!`);

                } catch (err) {
                    console.error("Lỗi đồng bộ dữ liệu lên Firebase:", err);
                    alert("Gặp lỗi kết nối máy chủ, không thể cập nhật số dư!");
                }
            } else {
                alert("Số dư mới trùng với số dư hiện tại, không có biến động nguồn vốn.");
            }
        };
    }
}

// =========================================================================
// 3. HÀM ĐỔ DANH SÁCH VÀ TÍNH TỔNG TÀI SẢN KHẢ DỤNG
// =========================================================================
function renderAccountListAndTotal() {
    const listContainer = document.getElementById("list-account-balances-detail");
    const selectMethod = document.getElementById("select-balance-method");
    const totalAllEl = document.getElementById("txt-total-all-wallets");

    if (!listContainer || !selectMethod) return;

    // Lưu lại giá trị option đang được chọn trước đó để tránh bị nhảy mất tiêu khi realtime render
    const currentSelectedValue = selectMethod.value;

    listContainer.innerHTML = "";
    selectMethod.innerHTML = "";
    let grandTotal = 0;

    if (paymentMethods.length === 0) {
        listContainer.innerHTML = `<div style="text-align:center; padding:20px; color:#95a5a6;">Chưa thiết lập tài khoản thanh toán nào.</div>`;
        if (totalAllEl) totalAllEl.textContent = "0 ₫";
        return;
    }

    paymentMethods.forEach(pm => {
        grandTotal += pm.balance;

        // Định dạng cấu trúc giao diện Badge
        let badgeClass = "bg-bank";
        let typeName = "Ngân hàng";
        if (pm.category_code === "CASH") { badgeClass = "bg-cash"; typeName = "Tiền mặt"; }
        if (pm.category_code === "CREDIT") { badgeClass = "bg-credit"; typeName = "Tín dụng"; }

        const formattedMoney = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pm.balance);

        // Đổ dữ liệu hiển thị ra khối danh sách tài sản bên phải
        listContainer.innerHTML += `
            <div class="account-item-row">
                <div class="account-info-meta">
                    <span class="account-title">${pm.name}</span>
                    <span class="badge-type ${badgeClass}">${typeName}</span>
                </div>
                <div style="font-weight: 700; font-size: 16px; color: #2c3e50;">${formattedMoney}</div>
            </div>
        `;

        // Gắn danh sách lựa chọn vào Select Box của Form bên trái
        const option = document.createElement("option");
        option.value = pm.id;
        option.textContent = `${pm.name} (Hiện tại: ${formattedMoney})`;
        selectMethod.appendChild(option);
    });

    // Giữ nguyên lựa chọn cũ của người dùng sau khi vẽ lại dữ liệu
    if (currentSelectedValue && paymentMethods.some(pm => pm.id === currentSelectedValue)) {
        selectMethod.value = currentSelectedValue;
    }

    // Ép hiển thị Tổng tiền lớn lên Banner tổng tài sản trên cùng
    if (totalAllEl) {
        totalAllEl.textContent = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(grandTotal);
    }
}

// =========================================================================
// 4. HÀM ĐỔ LỊCH SỬ BIẾN ĐỘNG (LẤY TỪ GIAO DỊCH GẦN NHẤT CỦA CÁC TÀI KHOẢN)
// =========================================================================
function renderBalanceHistoryTable() {
    const tbody = document.getElementById("table-balance-history-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    // Sắp xếp các giao dịch hoạt động theo ngày mới nhất lên đầu
    let activeTx = [...transactions];
    activeTx.sort((a, b) => b.date.localeCompare(a.date));

    // Giới hạn hiển thị đúng 5 dòng biến động gần đây nhất
    let displayTx = activeTx.slice(0, 5);

    if (displayTx.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center" style="color:#95a5a6; padding: 15px;">Chưa ghi nhận biến động số dư nào gần đây.</td></tr>`;
        return;
    }

    displayTx.forEach(t => {
        const methodObj = paymentMethods.find(m => m.id === t.method_id);
        const methodName = methodObj ? methodObj.name : "Không rõ";

        const formattedAmount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(t.amount);
        const colorStyle = t.type === "EXPENSE" ? "color: #c0392b;" : "color: #27ae60;";
        const prefixSign = t.type === "EXPENSE" ? "-" : "+";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${t.date}</td>
            <td><span style="font-weight:600; color:#34495e;">${methodName}</span></td>
            <td><span style="font-size:12px; color:#57606f;">${t.note || 'Ghi chép giao dịch'}</span></td>
            <td style="text-align: right; font-weight: 700; ${colorStyle}">${prefixSign}${formattedAmount}</td>
        `;
        tbody.appendChild(tr);
    });
}
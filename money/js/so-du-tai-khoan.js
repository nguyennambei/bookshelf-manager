// =========================================================================
// 1. ĐỌC DỮ LIỆU ĐỒNG BỘ TỪ LOCALSTORAGE ĐÃ CÓ CỦA SỔ CÁI
// =========================================================================
let paymentMethods = JSON.parse(localStorage.getItem("classic_payment_methods")) || [];
let transactions = JSON.parse(localStorage.getItem("classic_transactions")) || [];

document.addEventListener("DOMContentLoaded", () => {
    initBalancePage();
});

function initBalancePage() {
    const selectMethod = document.getElementById("select-balance-method");
    const amountInput = document.getElementById("input-balance-amount");
    const formAdjust = document.getElementById("form-adjust-balance");

    if (!selectMethod) return;

    // Vẽ giao diện ban đầu
    renderAccountListAndTotal();
    renderBalanceHistoryTable();

    // Định dạng tiền tệ tự động gõ dấu chấm (.)
    if (amountInput) {
        amountInput.oninput = function() {
            let value = this.value.replace(/\D/g, "");
            if (!value) { this.value = ""; return; }
            this.value = new Intl.NumberFormat("vi-VN").format(parseInt(value, 10));
        };
    }

    // Xử lý sự kiện Submit Form cập nhật số dư thực tế
    if (formAdjust) {
        formAdjust.onsubmit = function(e) {
            e.preventDefault();

            const targetMethodId = selectMethod.value;
            const rawAmount = amountInput.value.replace(/\./g, "");
            const newAmount = parseFloat(rawAmount) || 0;
            const note = document.getElementById("input-balance-note").value.trim();
            const todayIso = new Date().toISOString().split('T')[0];

            if (newAmount < 0) { alert("Số dư không được là số âm!"); return; }

            // Tìm tài khoản cần cập nhật số dư thực tế
            let oldAmount = 0;
            let targetMethodName = "";
            paymentMethods = paymentMethods.map(pm => {
                if (pm.id === targetMethodId) {
                    oldAmount = pm.balance;
                    targetMethodName = pm.name;
                    return { ...pm, balance: newAmount };
                }
                return pm;
            });

            // Tự động sinh một giao dịch điều chỉnh hệ thống ghi vào Sổ Cái để lưu vết lịch sử
            const delta = newAmount - oldAmount;
            if (delta !== 0) {
                const txType = delta > 0 ? "INCOME" : "EXPENSE";
                const absoluteDelta = Math.abs(delta);
                
                // Đẩy dòng log biến động này lên đầu bảng Sổ Cái
                transactions.unshift({
                    id: "tx_adjust_" + Date.now(),
                    type: txType,
                    amount: absoluteDelta,
                    main_category_id: "cat_adjust_system", // Danh mục đặc biệt do hệ thống tự sinh
                    sub_category_name: "Điều chỉnh số dư",
                    method_id: targetMethodId,
                    date: todayIso,
                    note: `[Hệ thống điều chỉnh] ${note}`,
                    status: "ACTIVE"
                });

                // Đồng bộ ngược lại LocalStorage chung của ứng dụng
                localStorage.setItem("classic_payment_methods", JSON.stringify(paymentMethods));
                localStorage.setItem("classic_transactions", JSON.stringify(transactions));

                // Làm sạch form
                formAdjust.reset();
                
                // Vẽ lại giao diện đồng bộ mới nhất
                renderAccountListAndTotal();
                renderBalanceHistoryTable();
                
                alert(`Đã cập nhật số dư ví "${targetMethodName}" thành công!`);
            } else {
                alert("Số dư mới trùng với số dư hiện tại, không có biến động nguồn vốn.");
            }
        };
    }
}

// =========================================================================
// 2. HÀM ĐỔ DANH SÁCH VÀ TÍNH TỔNG TÀI SẢN KHẢ DỤNG
// =========================================================================
function renderAccountListAndTotal() {
    const listContainer = document.getElementById("list-account-balances-detail");
    const selectMethod = document.getElementById("select-balance-method");
    const totalAllEl = document.getElementById("txt-total-all-wallets");

    if (!listContainer || !selectMethod) return;

    listContainer.innerHTML = "";
    selectMethod.innerHTML = "";
    let grandTotal = 0;

    // Lọc tài khoản hoạt động
    const activeMethods = paymentMethods.filter(pm => pm.status !== "DELETED");

    if (activeMethods.length === 0) {
        listContainer.innerHTML = `<div style="text-align:center; padding:20px; color:#95a5a6;">Chưa thiết lập tài khoản thanh toán nào.</div>`;
        if (totalAllEl) totalAllEl.textContent = "0 ₫";
        return;
    }

    activeMethods.forEach(pm => {
        grandTotal += pm.balance;

        // Định dạng badge
        let badgeClass = "bg-bank";
        let typeName = "Ngân hàng";
        if (pm.category_code === "CASH") { badgeClass = "bg-cash"; typeName = "Tiền mặt"; }
        if (pm.category_code === "CREDIT") { badgeClass = "bg-credit"; typeName = "Tín dụng"; }

        const formattedMoney = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pm.balance);

        // Đổ ra cột danh sách chi tiết bên phải
        listContainer.innerHTML += `
            <div class="account-item-row">
                <div class="account-info-meta">
                    <span class="account-title">${pm.name}</span>
                    <span class="badge-type ${badgeClass}">${typeName}</span>
                </div>
                <div style="font-weight: 700; font-size: 16px; color: #2c3e50;">${formattedMoney}</div>
            </div>
        `;

        // Gắn vào ô Select Box của Form bên trái
        selectMethod.innerHTML += `<option value="${pm.id}">${pm.name} (Hiện tại: ${formattedMoney})</option>`;
    });

    // Ép hiển thị Tổng tiền lớn lên Banner trên cùng
    if (totalAllEl) {
        totalAllEl.textContent = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(grandTotal);
    }
}

// =========================================================================
// 3. HÀM ĐỔ LỊCH SỬ BIẾN ĐỘNG (LẤY TỪ GIAO DỊCH GẦN NHẤT CỦA TÀI KHOẢN ĐÓ)
// =========================================================================
function renderBalanceHistoryTable() {
    const tbody = document.getElementById("table-balance-history-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    // Lọc ra các giao dịch đang hoạt động và sắp xếp ngày mới nhất lên đầu
    let activeTx = transactions.filter(t => t.status !== "DELETED");
    activeTx.sort((a, b) => b.date.localeCompare(a.date));

    // Giới hạn hiển thị 5 dòng biến động gần đây nhất cho gọn giao diện
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
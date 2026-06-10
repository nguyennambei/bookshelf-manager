// =========================================================================
// 1. KHỞI TẠO DỮ LIỆU ĐỒNG BỘ LOCALSTORAGE (CÓ SẴN DATA MẪU TRỰC QUAN)
// =========================================================================
let categories = JSON.parse(localStorage.getItem("classic_categories")) || [
    { id: "cat_1", name: "Ăn uống", type: "EXPENSE", subCategories: ["Ăn sáng", "Ăn trưa", "Cà phê & Hẹn hò"], status: "ACTIVE" },
    { id: "cat_2", name: "Di chuyển", type: "EXPENSE", subCategories: ["Xăng xe", "Sửa xe & Bảo dưỡng"], status: "ACTIVE" },
    { id: "cat_3", name: "Tiền lương", type: "INCOME", subCategories: ["Lương chính thức", "Thưởng & Freelance"], status: "ACTIVE" }
];

let paymentCategories = JSON.parse(localStorage.getItem("classic_payment_categories")) || [
    { id: "p_cat_1", code: "CASH", name: "Tiền mặt", display: 'badge-cash' , status: "ACTIVE" },
    { id: "p_cat_2", code: "BANK", name: "Tài khoản ngân hàng", display: 'badge-bank' , status: "ACTIVE" }
];

let paymentMethods = JSON.parse(localStorage.getItem("classic_payment_methods")) || [
    { id: "pm_1", name: "Tiền mặt ví chính", balance: 2000000, category_code: "CASH", status: "ACTIVE", display: 'badge-cash' },
    { id: "pm_2", name: "Vietcombank", balance: 15000000, category_code: "BANK", status: "ACTIVE", display: 'badge-bank'  }
];

let transactions = JSON.parse(localStorage.getItem("classic_transactions")) || [
    { id: "tx_sample_1", type: "EXPENSE", amount: 45000, main_category_id: "cat_1", sub_category_name: "Ăn sáng", method_id: "pm_1", date: "2026-06-10", note: "Bát phở bò nóng", status: "ACTIVE" },
    { id: "tx_sample_2", type: "INCOME", amount: 12000000, main_category_id: "cat_3", sub_category_name: "Lương chính thức", method_id: "pm_2", date: "2026-06-05", note: "Tinh tinh lương tháng", status: "ACTIVE" }
];

// Cấu hình phân trang mặc định cho Sổ cái
let currentPage = 1;
let rowsPerPage = 5;

document.addEventListener("DOMContentLoaded", () => {
    // Lưu ngược lại LocalStorage nếu máy khách trống dữ liệu mẫu ban đầu
    if (!localStorage.getItem("classic_categories")) localStorage.setItem("classic_categories", JSON.stringify(categories));
    if (!localStorage.getItem("classic_payment_categories")) localStorage.setItem("classic_payment_categories", JSON.stringify(paymentCategories));
    if (!localStorage.getItem("classic_payment_methods")) localStorage.setItem("classic_payment_methods", JSON.stringify(paymentMethods));
    if (!localStorage.getItem("classic_transactions")) localStorage.setItem("classic_transactions", JSON.stringify(transactions));

    initTransactionFormLogic();
});

// =========================================================================
// 2. ĐIỀU KHIỂN BIẾN ĐỘNG FORM & SỰ KIỆN LỒNG NHAU
// =========================================================================
function initTransactionFormLogic() {
    const dateField = document.getElementById("input-tx-date");
    if (dateField && !dateField.value) {
        dateField.value = new Date().toISOString().split('T')[0];
    }

    const typeSelect = document.getElementById("input-tx-type");
    const mainCatSelect = document.getElementById("input-tx-cat-main");
    const subCatSelect = document.getElementById("input-tx-cat-sub");
    const methodSelect = document.getElementById("input-tx-method");
    const amountInput = document.getElementById("input-tx-amount"); // Ô nhập số tiền dạng chuỗi định dạng
    const rowsSelect = document.getElementById("select-rows-per-page"); // Bộ chọn giới hạn dòng hiển thị
    const btnSubmit = document.getElementById("btn-submit-transaction");
    const btnCancel = document.getElementById("btn-tx-cancel");

    if (!typeSelect || !mainCatSelect || !subCatSelect || !methodSelect || !amountInput) return;

    // Ép hiển thị đồng bộ dữ liệu lên giao diện lúc vừa nạp trang
    renderTxMethodOptions(methodSelect);
    renderTxMainCatOptions(typeSelect.value, mainCatSelect);
    renderTxSubCatOptions(mainCatSelect.value, subCatSelect);
    renderTransactionTable();

    // --- SỰ KIỆN 1: TỰ ĐỘNG CHÈN DẤU CHẤM PHÂN CÁCH KHI GÕ SỐ TIỀN ---
    amountInput.oninput = function() {
        formatCurrencyInput(this);
    };

    // --- SỰ KIỆN 2: THAY ĐỔI CHI/THU -> LỌC LẠI DANH MỤC CHÍNH & CON ---
    typeSelect.onchange = function() {
        renderTxMainCatOptions(this.value, mainCatSelect);
        renderTxSubCatOptions(mainCatSelect.value, subCatSelect);
    };

    // --- SỰ KIỆN 3: THAY ĐỔI MỤC CHÍNH -> LỌC CÁC MỤC CON TƯƠNG ỨNG ---
    mainCatSelect.onchange = function() {
        renderTxSubCatOptions(this.value, subCatSelect);
    };

    // --- SỰ KIỆN 4: THAY ĐỔI SỐ LƯỢNG DÒNG HIỂN THỊ TRÊN MỘT TRANG ---
    if (rowsSelect) {
        rowsSelect.value = rowsPerPage; // Đồng bộ trạng thái giao diện với giá trị logic
        rowsSelect.onchange = function() {
            rowsPerPage = parseInt(this.value, 10);
            currentPage = 1; // Đưa về trang đầu tiên để tránh lỗi hiển thị lệch trang
            renderTransactionTable();
        };
    }

    // --- SỰ KIỆN 5: LƯU MỚI HOẶC CẬP NHẬT GIAO DỊCH VÀO SỔ CÁI ---
    if (btnSubmit) {
        btnSubmit.onclick = null;
        btnSubmit.onclick = function(e) {
            if (e) e.preventDefault();

            const editId = document.getElementById("edit-tx-id").value;
            const type = typeSelect.value;
            
            // Chuyển đổi dữ liệu: Xóa bỏ các dấu chấm phân cách trước khi ép kiểu số thực
            const rawAmount = amountInput.value.replace(/\./g, "");
            const amount = parseFloat(rawAmount) || 0;

            const mainCatId = mainCatSelect.value;
            const subCatName = subCatSelect.value;
            const methodId = methodSelect.value;
            const txDate = dateField.value;
            const note = document.getElementById("input-tx-note").value.trim();
            const nowIso = new Date().toISOString();

            if (amount <= 0) { alert("Vui lòng nhập số tiền lớn hơn 0!"); return; }
            if (!mainCatId || !subCatName) { alert("Vui lòng thiết lập cấu hình thể loại trước!"); return; }

            if (editId) {
                // Sửa: Thực hiện hoàn trả lại dòng tiền cũ trong ví thanh toán trước
                const oldTx = transactions.find(t => t.id === editId);
                if (oldTx) revertWalletBalance(oldTx.method_id, oldTx.type, oldTx.amount);

                // Ghi đè dữ liệu mới
                transactions = transactions.map(t => 
                    t.id === editId ? { ...t, type, amount, main_category_id: mainCatId, sub_category_name: subCatName, method_id: methodId, date: txDate, note, updateDate: nowIso } : t
                );
                applyWalletBalance(methodId, type, amount);
            } else {
                // Thêm mới: Đẩy giao dịch mới nhất lên vị trí đầu mảng
                transactions.unshift({ id: "tx_" + Date.now(), type, amount, main_category_id: mainCatId, sub_category_name: subCatName, method_id: methodId, date: txDate, note, createDate: nowIso, updateDate: nowIso, status: "ACTIVE" });
                applyWalletBalance(methodId, type, amount);
            }

            // Đồng bộ dữ liệu xuống bộ nhớ máy khách
            localStorage.setItem("classic_transactions", JSON.stringify(transactions));
            localStorage.setItem("classic_payment_methods", JSON.stringify(paymentMethods));

            // Đưa toàn bộ form về trạng thái trống ban đầu
            document.getElementById("form-transaction").reset();
            document.getElementById("edit-tx-id").value = "";
            document.getElementById("transaction-form-title").textContent = "Ghi Chép Giao Dịch Mới";
            if (btnCancel) btnCancel.style.display = "none";
            dateField.value = new Date().toISOString().split('T')[0];

            renderTxMainCatOptions(typeSelect.value, mainCatSelect);
            renderTxSubCatOptions(mainCatSelect.value, subCatSelect);
            renderTransactionTable();
            alert("Đã ghi sổ cái giao dịch và cập nhật số dư thành công!");
        };
    }

    if (btnCancel) {
        btnCancel.onclick = function() {
            document.getElementById("edit-tx-id").value = "";
            document.getElementById("transaction-form-title").textContent = "Ghi Chép Giao Dịch Mới";
            this.style.display = "none";
            document.getElementById("form-transaction").reset();
            dateField.value = new Date().toISOString().split('T')[0];
            renderTxMainCatOptions(typeSelect.value, mainCatSelect);
            renderTxSubCatOptions(mainCatSelect.value, subCatSelect);
        };
    }
}

// =========================================================================
// 3. ĐỔ DỮ LIỆU ĐỘNG VÀO CÁC Ô CHỌN SELECT BOX
// =========================================================================
function renderTxMethodOptions(selectEl) {
    if (!selectEl) return;
    const activeMethods = paymentMethods.filter(pm => pm.status !== "DELETED");
    selectEl.innerHTML = "";
    activeMethods.forEach(pm => {
        selectEl.innerHTML += `<option value="${pm.id}">${pm.name}</option>`;
    });
}

function renderTxMainCatOptions(type, selectEl) {
    if (!selectEl) return;
    const filtered = categories.filter(c => c.type === type && c.status !== "DELETED");
    selectEl.innerHTML = "";
    filtered.forEach(c => {
        selectEl.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    });
}

function renderTxSubCatOptions(mainCatId, selectEl) {
    if (!selectEl) return;
    selectEl.innerHTML = "";
    const catObj = categories.find(c => c.id === mainCatId);
    if (catObj && catObj.subCategories && catObj.subCategories.length > 0) {
        catObj.subCategories.forEach(sub => {
            selectEl.innerHTML += `<option value="${sub}">${sub}</option>`;
        });
    } else {
        selectEl.innerHTML += `<option value="Khác">Khác</option>`;
    }
}

// =========================================================================
// 4. KHỞI TẠO BẢNG SỔ CÁI VÀ LOGIC PHÂN TRANG ĐỘNG
// =========================================================================
function renderTransactionTable() {
    const tbody = document.getElementById("table-transaction-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    const activeTx = transactions.filter(t => t.status !== "DELETED");

    if (activeTx.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color: #95a5a6; padding: 20px;">Sổ cái chưa ghi nhận giao dịch nào.</td></tr>`;
        return;
    }

    // Thực hiện cắt mảng dữ liệu phục vụ hiển thị theo trang cụ thể
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedTx = activeTx.slice(startIndex, endIndex);

    paginatedTx.forEach(t => {
        const tr = document.createElement("tr");
        
        const methodObj = paymentMethods.find(m => m.id === t.method_id);
        const methodName = methodObj ? methodObj.name : "Không rõ";
        const methodDisplay =  methodObj ? methodObj.display : "undefined";

        const mainCatObj = categories.find(c => c.id === t.main_category_id);
        const mainCatName = mainCatObj ? mainCatObj.name : "Không rõ";

        const formattedAmount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(t.amount);
        const colorStyle = t.type === "EXPENSE" ? "color: #c0392b;" : "color: #27ae60;";
        const prefixSign = t.type === "EXPENSE" ? "-" : "+";

        tr.innerHTML = `
            <td>${t.date}</td>
            <td><span class="account-badge ${methodDisplay}">${methodName}</span></td>
            <td><strong>${mainCatName}</strong> <small style="color:#7f8c8d; display:block;">(${t.sub_category_name})</small></td>
            <td><span style="color:#57606f; font-size:13px;">${t.note || '---'}</span></td>
            <td style="text-align: right; font-weight: 700; ${colorStyle}">${prefixSign}${formattedAmount}</td>
            <td class="text-center">
                <button class="btn-action edit" onclick="editTransaction('${t.id}')">Sửa</button>
                <button class="btn-action delete" onclick="deleteTransaction('${t.id}')">Xóa</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    renderPaginationControls(activeTx.length);
}

function renderPaginationControls(totalItems) {
    const pContainer = document.getElementById("tx-pagination");
    if (!pContainer) return;
    pContainer.innerHTML = "";

    const totalPages = Math.ceil(totalItems / rowsPerPage);
    if (totalPages <= 1) return; // Nếu tổng dữ liệu nằm vừa trong 1 trang thì ẩn thanh phân trang

    // Nút tắt quay lại trang trước (Previous)
    const btnPrev = document.createElement("button");
    btnPrev.textContent = "«";
    btnPrev.className = "btn-page-nav";
    btnPrev.disabled = currentPage === 1;
    btnPrev.style.margin = "0 3px";
    btnPrev.style.padding = "3px 8px";
    btnPrev.onclick = () => { if (currentPage > 1) { currentPage--; renderTransactionTable(); } };
    pContainer.appendChild(btnPrev);

    // Vòng lặp in các nút số trang cụ thể
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        btn.style.margin = "0 3px";
        btn.style.padding = "3px 8px";
        btn.style.cursor = "pointer";
        
        if (i === currentPage) {
            btn.style.background = "#2c3e50";
            btn.style.color = "#fff";
            btn.style.fontWeight = "bold";
            btn.style.border = "1px solid #2c3e50";
        } else {
            btn.style.background = "#fff";
            btn.style.color = "#333";
            btn.style.border = "1px solid #ccc";
        }
        
        btn.onclick = () => { currentPage = i; renderTransactionTable(); };
        pContainer.appendChild(btn);
    }

    // Nút tắt tiến đến trang sau (Next)
    const btnNext = document.createElement("button");
    btnNext.textContent = "»";
    btnNext.className = "btn-page-nav";
    btnNext.disabled = currentPage === totalPages;
    btnNext.style.margin = "0 3px";
    btnNext.style.padding = "3px 8px";
    btnNext.onclick = () => { if (currentPage < totalPages) { currentPage++; renderTransactionTable(); } };
    pContainer.appendChild(btnNext);
}

// =========================================================================
// 5. THAO TÁC HÀM SỬA / XÓA LÊN TOÀN CỤC CỬA SỔ WINDOW
// =========================================================================
window.editTransaction = function(id) {
    const t = transactions.find(tx => tx.id === id);
    if (!t) return;

    document.getElementById("edit-tx-id").value = t.id;
    document.getElementById("input-tx-type").value = t.type;
    
    // Đổ số tiền lên trường nhập và ép hiển thị dấu chấm phân tách ngay lập tức
    const amountInput = document.getElementById("input-tx-amount");
    amountInput.value = new Intl.NumberFormat("vi-VN").format(t.amount);
    
    const mainCatSelect = document.getElementById("input-tx-cat-main");
    const subCatSelect = document.getElementById("input-tx-cat-sub");
    
    renderTxMainCatOptions(t.type, mainCatSelect);
    mainCatSelect.value = t.main_category_id;
    
    renderTxSubCatOptions(t.main_category_id, subCatSelect);
    subCatSelect.value = t.sub_category_name;

    document.getElementById("input-tx-method").value = t.method_id;
    document.getElementById("input-tx-date").value = t.date;
    document.getElementById("input-tx-note").value = t.note;

    document.getElementById("transaction-form-title").textContent = "Sửa Giao Dịch Sổ Cái";
    document.getElementById("btn-tx-cancel").style.display = "inline-block";
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteTransaction = function(id) {
    if (confirm("Bạn có chắc chắn muốn xóa giao dịch này? Số dư tài khoản ví liên quan sẽ tự động hoàn tác tăng/giảm tương ứng.")) {
        const t = transactions.find(tx => tx.id === id);
        if (t) {
            revertWalletBalance(t.method_id, t.type, t.amount);
            transactions = transactions.filter(tx => tx.id !== id);
            
            localStorage.setItem("classic_transactions", JSON.stringify(transactions));
            localStorage.setItem("classic_payment_methods", JSON.stringify(paymentMethods));
            
            renderTransactionTable();
        }
    }
};

// =========================================================================
// 6. TIỆN ÍCH CHÈN ĐỊNH DẠNG CHUỖI TIỀN TỆ & BIẾN ĐỘNG SỐ DƯ VÍ
// =========================================================================
function formatCurrencyInput(inputEl) {
    let value = inputEl.value.replace(/\D/g, "");
    if (!value) {
        inputEl.value = "";
        return;
    }
    inputEl.value = new Intl.NumberFormat("vi-VN").format(parseInt(value, 10));
}

function applyWalletBalance(methodId, type, amount) {
    paymentMethods = paymentMethods.map(pm => {
        if (pm.id === methodId) {
            const newBalance = type === "EXPENSE" ? (pm.balance - amount) : (pm.balance + amount);
            return { ...pm, balance: newBalance };
        }
        return pm;
    });
}

function revertWalletBalance(methodId, type, amount) {
    paymentMethods = paymentMethods.map(pm => {
        if (pm.id === methodId) {
            const newBalance = type === "EXPENSE" ? (pm.balance + amount) : (pm.balance - amount);
            return { ...pm, balance: newBalance };
        }
        return pm;
    });
}
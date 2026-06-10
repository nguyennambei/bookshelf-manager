document.addEventListener("DOMContentLoaded", () => {
    initAccountLogic();
});

function initAccountLogic() {
    // Khởi tạo LocalStorage ban đầu
    if (!localStorage.getItem("classic_payment_categories")) localStorage.setItem("classic_payment_categories", JSON.stringify(paymentCategories));
    if (!localStorage.getItem("classic_payment_methods")) localStorage.setItem("classic_payment_methods", JSON.stringify(paymentMethods));

    paymentCategories = JSON.parse(localStorage.getItem("classic_payment_categories"));
    paymentMethods = JSON.parse(localStorage.getItem("classic_payment_methods"));

    // Vẽ toàn bộ bảng và ô chọn ban đầu
    refreshAllInterfaces();

    // Các phần tử DOM cần thao tác
    const btnSubmitAcc = document.getElementById("btn-submit-account");
    const btnCancelAcc = document.getElementById("btn-account-cancel");
    const btnSubmitPCat = document.getElementById("btn-submit-paycat");
    
    // Điều khiển Modal Pop-up nhóm tài khoản
    const modal = document.getElementById("payment-cat-modal");
    const btnOpenModal = document.getElementById("btn-open-cat-modal");
    const btnCloseModal = document.getElementById("btn-close-cat-modal");

    if (btnOpenModal && modal) btnOpenModal.onclick = () => { modal.style.display = "block"; resetPayCatForm(); };
    if (btnCloseModal && modal) btnCloseModal.onclick = () => { modal.style.display = "none"; resetPayCatForm(); };

    // --- LUỒNG 1: LƯU TÀI KHOẢN/VÍ CỤ THỂ ---
    if (btnSubmitAcc) {
        btnSubmitAcc.onclick = null;
        btnSubmitAcc.onclick = function(e) {
            if (e) e.preventDefault();
            const editId = document.getElementById("edit-account-id").value;
            const name = document.getElementById("input-account-name").value.trim();
            const categoryCode = document.getElementById("select-account-category").value;
            const balance = parseFloat(document.getElementById("input-account-balance").value) || 0;
            const nowIso = new Date().toISOString();
            const methodObj = paymentCategories.find(m => m.code === categoryCode);
            const methodDisplay =  methodObj ? methodObj.display : "undefined";

            if (!name) { alert("Vui lòng nhập tên ví!"); return; }

            if (editId) {
                paymentMethods = paymentMethods.map(pm => pm.id === editId ? { ...pm, name, category_code: categoryCode, balance, updateDate: nowIso } : pm);
                resetAccountForm();
            } else {
                paymentMethods.push({ id: "pm_" + Date.now(), name, balance, category_code: categoryCode, createDate: nowIso, updateDate: nowIso, display: methodDisplay, status: "ACTIVE" });
                resetAccountForm();
            }
            localStorage.setItem("classic_payment_methods", JSON.stringify(paymentMethods));
            refreshAllInterfaces();
            alert("Đã lưu tài khoản thành công!");
        };
    }

    if (btnCancelAcc) btnCancelAcc.onclick = () => resetAccountForm();

    // --- LUỒNG 2: LƯU NHÓM TÀI KHOẢN (PAYMENT CATEGORY) ---
    if (btnSubmitPCat) {
        btnSubmitPCat.onclick = null;
        btnSubmitPCat.onclick = function(e) {
            if (e) e.preventDefault();
            const editId = document.getElementById("edit-paycat-id").value;
            const code = document.getElementById("input-paycat-code").value.trim().toUpperCase();
            const name = document.getElementById("input-paycat-name").value.trim();
            const nowIso = new Date().toISOString();

            if (!code || !name) { alert("Vui lòng nhập đầy đủ thông tin nhóm!"); return; }

            if (editId) {
                paymentCategories = paymentCategories.map(c => c.id === editId ? { ...c, code, name, updateDate: nowIso } : c);
            } else {
                // Kiểm tra trùng mã Code
                if (paymentCategories.some(c => c.code === code && c.status !== "DELETED")) { alert("Mã Nhóm này đã tồn tại!"); return; }
                paymentCategories.push({ id: "p_cat_" + Date.now(), code, name, createDate: nowIso, updateDate: nowIso, status: "ACTIVE" });
            }

            localStorage.setItem("classic_payment_categories", JSON.stringify(paymentCategories));
            refreshAllInterfaces();
            if (modal) modal.style.display = "none";
            resetPayCatForm();
            alert("Đã lưu nhóm tài khoản thành công!");
        };
    }
}

// =========================================================================
// 3. CÁC HÀM ĐỒNG BỘ VÀ LÀM SẠCH GIAO DIỆN
// =========================================================================
function refreshAllInterfaces() {
    renderCategoryOptions();
    renderAccountTable();
    renderPayCatTable();
}

function resetAccountForm() {
    document.getElementById("edit-account-id").value = "";
    document.getElementById("account-form-title").textContent = "Thêm Tài Khoản Mới";
    const btnCancel = document.getElementById("btn-account-cancel");
    if (btnCancel) btnCancel.style.display = "none";
    const form = document.getElementById("form-account");
    if (form) form.reset();
}

function resetPayCatForm() {
    document.getElementById("edit-paycat-id").value = "";
    document.getElementById("modal-cat-title").textContent = "Thêm Nhóm Tài Khoản Mới";
    document.getElementById("input-paycat-code").disabled = false;
    const form = document.getElementById("form-paycat");
    if (form) form.reset();
}

function renderCategoryOptions() {
    const selectBox = document.getElementById("select-account-category");
    if (!selectBox) return;
    const activeCats = paymentCategories.filter(c => c.status !== "DELETED");
    selectBox.innerHTML = "";
    activeCats.forEach(cat => {
        selectBox.innerHTML += `<option value="${cat.code}">${cat.name}</option>`;
    });
}

function renderAccountTable() {
    const tbody = document.getElementById("table-account-body");
    if (!tbody) return;
    tbody.innerHTML = "";
    paymentMethods.filter(pm => pm.status !== "DELETED").forEach(pm => {
        const catObj = paymentCategories.find(c => c.code === pm.category_code);
        const catName = catObj ? catObj.name : pm.category_code;
        const formattedBalance = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pm.balance);
        
        tbody.innerHTML += `
            <tr>
                <td><span class="account-badge badge-${pm.category_code.toLowerCase()}">${catName}</span></td>
                <td><strong style="color: #2c3e50; font-size: 14px;">${pm.name}</strong></td>
                <td style="font-weight: 600; color: ${pm.balance >= 0 ? '#27ae60' : '#c0392b'}; text-align: right;">${formattedBalance}</td>
                <td class="text-center" style="white-space: nowrap;">
                    <button class="btn-action edit" onclick="editAccount('${pm.id}')">Sửa</button>
                    <button class="btn-action delete" onclick="deleteAccount('${pm.id}')">Xóa</button>
                </td>
            </tr>`;
    });
}

function renderPayCatTable() {
    const tbody = document.getElementById("table-paycat-body");
    if (!tbody) return;
    tbody.innerHTML = "";
    paymentCategories.filter(c => c.status !== "DELETED").forEach(c => {
        tbody.innerHTML += `
            <tr>
                <td><code style="background: #f1f2f6; padding: 2px 6px; border-radius: 4px; font-weight: bold; color: #e44d26;">${c.code}</code></td>
                <td><strong style="color: #2c3e50; font-size: 14px;">${c.name}</strong></td>
                <td class="text-center" style="white-space: nowrap;">
                    <button class="btn-action edit" onclick="editPayCat('${c.id}')">Sửa</button>
                    <button class="btn-action delete" onclick="deletePayCat('${c.id}')">Xóa</button>
                </td>
            </tr>`;
    });
}

// Thao tác chỉnh sửa/xóa đối với ví cụ thể
function editAccount(id) {
    const pm = paymentMethods.find(p => p.id === id);
    if (!pm) return;
    document.getElementById("edit-account-id").value = pm.id;
    document.getElementById("input-account-name").value = pm.name;
    document.getElementById("select-account-category").value = pm.category_code;
    document.getElementById("input-account-balance").value = pm.balance;
    document.getElementById("account-form-title").textContent = "Sửa Thông Tin Tài Khoản";
    document.getElementById("btn-account-cancel").style.display = "inline-block";
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteAccount(id) {
    if (confirm("Xác nhận xóa tài khoản này?")) {
        paymentMethods = paymentMethods.map(pm => pm.id === id ? { ...pm, status: "DELETED", updateDate: new Date().toISOString() } : pm);
        localStorage.setItem("classic_payment_methods", JSON.stringify(paymentMethods));
        refreshAllInterfaces();
    }
}

// Thao tác chỉnh sửa/xóa đối với Nhóm lớn (Pop-up)
window.editPayCat = function(id) {
    const c = paymentCategories.find(item => item.id === id);
    if (!c) return;
    document.getElementById("edit-paycat-id").value = c.id;
    document.getElementById("input-paycat-code").value = c.code;
    document.getElementById("input-paycat-code").disabled = true; // Khóa trường mã code khi sửa
    document.getElementById("input-paycat-name").value = c.name;
    document.getElementById("modal-cat-title").textContent = "Sửa Nhóm Tài Khoản";
    document.getElementById("payment-cat-modal").style.display = "block";
}

window.deletePayCat = function(id) {
    const c = paymentCategories.find(item => item.id === id);
    if (!c) return;

    // Kiểm tra xem có ví con nào đang thuộc nhóm này không trước khi cho phép xóa
    const hasChild = paymentMethods.some(pm => pm.category_code === c.code && pm.status !== "DELETED");
    if (hasChild) {
        alert(`Không thể xóa! Hiện tại đang có tài khoản ví cụ thể sử dụng nhóm [${c.name}]. Bạn cần xóa hoặc đổi nhóm của các ví đó trước.`);
        return;
    }

    if (confirm(`Bạn chắc chắn muốn xóa nhóm tài khoản [${c.name}]?`)) {
        paymentCategories = paymentCategories.map(item => item.id === id ? { ...item, status: "DELETED", updateDate: new Date().toISOString() } : item);
        localStorage.setItem("classic_payment_categories", JSON.stringify(paymentCategories));
        refreshAllInterfaces();
    }
}
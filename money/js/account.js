// --- CẬP NHẬT LẠI FILE js/account.js ---

let accounts = JSON.parse(localStorage.getItem("classic_accounts")) || [
    { id: "acc_1", name: "Ví cá nhân (Tiền mặt)", type: "cash", balance: 1420000 },
    { id: "acc_2", name: "Vietcombank (VCB) - Thẻ lương", type: "bank", balance: 24500000 },
    { id: "acc_3", name: "Techcombank (TCB) - Quỹ tiết kiệm", type: "bank", balance: 50000000 },
    { id: "acc_4", name: "UOB Credit Card (Thẻ tín dụng)", type: "credit", balance: 50000000 },
    { id: "acc_5", name: "HSBC Visa Platinum (Thẻ tín dụng)", type: "credit", balance: 30000000 }
];

function initAccountLogic() {
    if (!localStorage.getItem("classic_accounts")) {
        localStorage.setItem("classic_accounts", JSON.stringify(accounts));
    }

    renderAccountSummary();
    renderAccountSelects();
    renderAccountTable(); // Hàm này chịu trách nhiệm vẽ bảng ở trang Cài đặt

    const form = document.getElementById("form-account");
    const cancelBtn = document.getElementById("btn-acc-cancel");
    
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const editId = document.getElementById("edit-acc-id").value;
            const type = document.getElementById("input-acc-type").value;
            const name = document.getElementById("input-acc-name").value.trim();
            const balance = parseFloat(document.getElementById("input-acc-balance").value) || 0;

            if (editId) {
                accounts = accounts.map(acc => acc.id === editId ? { ...acc, name, type, balance } : acc);
                document.getElementById("edit-acc-id").value = "";
                document.getElementById("account-form-title").textContent = "Thêm Tài Khoản Mới";
                if(cancelBtn) cancelBtn.style.display = "none";
            } else {
                accounts.push({ id: "acc_" + Date.now(), name, type, balance });
            }
            saveAccounts();
            form.reset();
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            document.getElementById("edit-acc-id").value = "";
            document.getElementById("account-form-title").textContent = "Thêm Tài Khoản Mới";
            cancelBtn.style.display = "none";
            form.reset();
        });
    }
}

function saveAccounts() {
    localStorage.setItem("classic_accounts", JSON.stringify(accounts));
    renderAccountSummary();
    renderAccountSelects();
    renderAccountTable();
}

// THAY ĐỔI Ở ĐÂY: Thêm kiểm tra "if (!gridContainer)" để tránh lỗi ở trang cài đặt
function renderAccountSummary() {
    const gridContainer = document.querySelector(".account-summary-grid");
    if (!gridContainer) return; // Nếu không ở trang chủ (không có grid này), thoát ra không chạy tiếp

    gridContainer.innerHTML = "";
    accounts.forEach(acc => {
        const card = document.createElement("div");
        card.className = "summary-card";
        const formatted = new Intl.NumberFormat('vi-VN').format(acc.balance) + "đ";
        let badgeClass = acc.type === "cash" ? "badge-cash" : (acc.type === "bank" ? "badge-bank" : "badge-credit");
        let badgeText = acc.type === "cash" ? "Tiền mặt" : (acc.type === "bank" ? "Ngân hàng" : "Tín dụng");

        card.innerHTML = `
            <span class="badge ${badgeClass}">${badgeText}</span>
            <h4>${acc.name}</h4>
            <p class="balance-amount ${acc.balance < 0 ? 'txt-red' : ''}">${formatted}</p>
        `;
        gridContainer.appendChild(card);
    });
}

// THAY ĐỔI Ở ĐÂY: Thêm kiểm tra "if (!txAccountSelect)"
function renderAccountSelects() {
    const txAccountSelect = document.getElementById("tx-account");
    if (!txAccountSelect) return; // Nếu không ở trang chủ, thoát ra

    txAccountSelect.innerHTML = "";
    accounts.forEach(acc => {
        const option = document.createElement("option");
        option.value = acc.id;
        option.textContent = acc.name;
        txAccountSelect.appendChild(option);
    });
}

// HÀM VẼ BẢNG: Đảm bảo ID chính xác
function renderAccountTable() {
    const tbody = document.getElementById("table-account-body");
    if (!tbody) return; // Nếu không ở trang cài đặt tài khoản, thoát ra
    
    tbody.innerHTML = "";

    accounts.forEach(acc => {
        const tr = document.createElement("tr");
        const typeLabel = acc.type === "cash" ? "Tiền mặt" : (acc.type === "bank" ? "Ngân hàng" : "Tín dụng");
        const formattedBal = new Intl.NumberFormat('vi-VN').format(acc.balance) + "đ";

        tr.innerHTML = `
            <td><strong>${acc.name}</strong></td>
            <td>${typeLabel}</td>
            <td class="text-right ${acc.balance < 0 ? 'txt-red' : ''}">${formattedBal}</td>
            <td class="text-center">
                <button class="btn-action edit" onclick="editAccount('${acc.id}')">Sửa</button>
                <button class="btn-action delete" onclick="deleteAccount('${acc.id}')">Xóa</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function editAccount(id) {
    const acc = accounts.find(a => a.id === id);
    if (!acc) return;

    document.getElementById("edit-acc-id").value = acc.id;
    document.getElementById("input-acc-type").value = acc.type;
    document.getElementById("input-acc-name").value = acc.name;
    document.getElementById("input-acc-balance").value = acc.balance;

    document.getElementById("account-form-title").textContent = "Sửa Cấu Hình Tài Khoản";
    const cancelBtn = document.getElementById("btn-acc-cancel");
    if(cancelBtn) cancelBtn.style.display = "inline-block";
}

function deleteAccount(id) {
    if (confirm("Bạn có chắc chắn muốn xóa tài khoản này khỏi hệ thống sổ cái?")) {
        accounts = accounts.filter(a => a.id !== id);
        saveAccounts();
    }
}
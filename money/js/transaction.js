// Dữ liệu giao dịch gốc
let transactions = JSON.parse(localStorage.getItem("classic_transactions")) || [
    { id: "tx_mock_1", date: "2026-06-05", accountId: "acc_2", categoryId: "cat_8", title: "Nhận lương công ty tháng 05", amount: 18500000, type: "income" },
    { id: "tx_mock_2", date: "2026-06-08", accountId: "acc_2", categoryId: "cat_9", title: "Thanh toán dự án Freelance Web", amount: 4500000, type: "income" },
    { id: "tx_mock_3", date: "2026-06-01", accountId: "acc_3", categoryId: "cat_5", title: "Hóa đơn tiền điện sinh hoạt gia đình", amount: 1350000, type: "expense" },
    { id: "tx_mock_4", date: "2026-06-02", accountId: "acc_2", categoryId: "cat_6", title: "Cước Internet cáp quang Viettel", amount: 275000, type: "expense" },
    { id: "tx_mock_5", date: "2026-06-02", accountId: "acc_1", categoryId: "cat_7", title: "Tiền nước & Phí quản lý chung cư", amount: 480000, type: "expense" },
    { id: "tx_mock_6", date: "2026-06-09", accountId: "acc_1", categoryId: "cat_1", title: "Ăn trưa bún đậu mắm tôm cùng công ty", amount: 55000, type: "expense" },
    { id: "tx_mock_7", date: "2026-06-08", accountId: "acc_1", categoryId: "cat_2", title: "Cà phê Starbucks tiếp khách hàng", amount: 115000, type: "expense" },
    { id: "tx_mock_8", date: "2026-06-07", accountId: "acc_2", categoryId: "cat_3", title: "Đổ đầy bình xăng xe máy", amount: 80000, type: "expense" },
    { id: "tx_mock_9", date: "2026-06-06", accountId: "acc_1", categoryId: "cat_1", title: "Mua đồ ăn tối tại siêu thị WinMart", amount: 320000, type: "expense" }
];

const rowsPerPage = 5;
let currentPage = 1;

function initTransactionLogic() {
    if (!localStorage.getItem("classic_transactions") || JSON.parse(localStorage.getItem("classic_transactions")).length === 0) {
        localStorage.setItem("classic_transactions", JSON.stringify(transactions));
    } else {
        transactions = JSON.parse(localStorage.getItem("classic_transactions"));
    }

    const dateInput = document.getElementById("tx-date");
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

    // --- 1. TỰ ĐỘNG PHÂN TÁCH DẤU CHẤM KHI GÕ SỐ TIỀN ---
    const amountInput = document.getElementById("tx-amount");
    if (amountInput) {
        amountInput.addEventListener("input", (e) => {
            // Chỉ lấy các ký tự số
            let value = e.target.value.replace(/\D/g, "");
            if (value) {
                // Định dạng hiển thị thành chuỗi có dấu chấm
                e.target.value = new Intl.NumberFormat('vi-VN').format(value);
            } else {
                e.target.value = "";
            }
        });
    }

    // --- 2. XỬ LÝ SỰ KIỆN SUBMIT FORM (THÊM HOẶC SỬA) ---
    const form = document.getElementById("form-transaction");
    const cancelBtn = document.getElementById("btn-tx-cancel");

    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();

            const editId = document.getElementById("edit-tx-id").value;
            const selectedDate = document.getElementById("tx-date").value;
            const title = document.getElementById("tx-title").value.trim();
            // Lấy giá trị số thuần túy bằng cách bỏ hết dấu chấm phân cách đi trước khi ép kiểu
            const amount = parseFloat(document.getElementById("tx-amount").value.replace(/\./g, "")) || 0;
            const accountId = document.getElementById("tx-account").value;
            const categoryId = document.getElementById("tx-category").value;
            const type = document.getElementById("tx-type").value;

            if (amount <= 0) {
                alert("Vui lòng nhập số tiền lớn hơn 0!");
                return;
            }

            if (editId) {
                // Chế độ: CẬP NHẬT GIAO DỊCH CŨ
                transactions = transactions.map(tx => 
                    tx.id === editId ? { ...tx, date: selectedDate, accountId, categoryId, title, amount, type } : tx
                );
                document.getElementById("edit-tx-id").value = "";
                document.getElementById("transaction-form-title").textContent = "Ghi Chép Giao Dịch";
                if (cancelBtn) cancelBtn.style.display = "none";
            } else {
                // Chế độ: THÊM MỚI GIAO DỊCH
                const newTx = { id: "tx_" + Date.now(), date: selectedDate, accountId, categoryId, title, amount, type };
                transactions.unshift(newTx);
            }

            // Đồng bộ sắp xếp và lưu trữ
            transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            saveTransactions();
            
            form.reset();
            if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
        });
    }

    // Nút hủy chế độ sửa
    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            document.getElementById("edit-tx-id").value = "";
            document.getElementById("transaction-form-title").textContent = "Ghi Chép Giao Dịch";
            cancelBtn.style.display = "none";
            form.reset();
            if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
        });
    }

    calculateLiveBalances();
    renderTransactionTable();
}

function saveTransactions() {
    localStorage.setItem("classic_transactions", JSON.stringify(transactions));
    calculateLiveBalances();
    renderTransactionTable();
}

// --- 3. VẼ BẢNG NHẬT KÝ VÀ TÍCH HỢP NÚT SỬA / XÓA ---
function renderTransactionTable() {
    const tbody = document.getElementById("table-transaction-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    const localTx = JSON.parse(localStorage.getItem("classic_transactions")) || transactions;
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedItems = localTx.slice(start, end);

    const localAccs = JSON.parse(localStorage.getItem("classic_accounts")) || [];
    const localCats = JSON.parse(localStorage.getItem("classic_categories")) || [];

    paginatedItems.forEach(tx => {
        const tr = document.createElement("tr");

        const acc = localAccs.find(a => a.id === tx.accountId) || { name: "N/A", type: "cash" };
        const cat = localCats.find(c => c.id === tx.categoryId) || { main: "", sub: "Chưa phân loại" };
        const cleanMain = cat.main.replace("Khoản Chi > ", "").replace("Khoản Thu > ", "");

        const formattedAmount = new Intl.NumberFormat('vi-VN').format(tx.amount) + "đ";
        const sign = tx.type === "expense" ? "-" : "+";
        const colorClass = tx.type === "expense" ? "txt-red" : "txt-green";
        const tagClass = acc.type === "cash" ? "cash" : "bank";

        const [year, month, day] = tx.date.split("-");
        const formattedDate = `${day}/${month}/${year}`;

        tr.innerHTML = `
            <td>${formattedDate}</td>
            <td><span class="table-tag ${tagClass}">${acc.name}</span></td>
            <td>${cleanMain ? cleanMain + " > " : ""}${cat.sub}</td>
            <td>${tx.title}</td>
            <td class="text-right ${colorClass}" style="font-weight:bold;">${sign}${formattedAmount}</td>
            <td class="text-center">
                <button class="btn-action edit" onclick="editTransaction('${tx.id}')" style="padding:2px 6px; font-size:11px;">Sửa</button>
                <button class="btn-action delete" onclick="deleteTransaction('${tx.id}')" style="padding:2px 6px; font-size:11px;">Xóa</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    renderPaginationControls(localTx.length);
}

// --- 4. LOGIC XỬ LÝ KHI BẤM NÚT SỬA GIAO DỊCH ---
function editTransaction(id) {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    // Đổ dữ liệu ngược lại lên form
    document.getElementById("edit-tx-id").value = tx.id;
    document.getElementById("tx-type").value = tx.type;
    document.getElementById("tx-date").value = tx.date;
    document.getElementById("tx-title").value = tx.title;
    // Đổ số tiền kèm định dạng dấu chấm
    document.getElementById("tx-amount").value = new Intl.NumberFormat('vi-VN').format(tx.amount);
    document.getElementById("tx-account").value = tx.accountId;
    document.getElementById("tx-category").value = tx.categoryId;

    // Thay đổi tiêu đề form để người dùng nhận biết
    document.getElementById("transaction-form-title").textContent = "Sửa Giao Dịch Sổ Cái";
    
    const cancelBtn = document.getElementById("btn-tx-cancel");
    if (cancelBtn) cancelBtn.style.display = "inline-block";
    
    // Cuộn màn hình lên đầu (Hữu ích khi dùng trên điện thoại)
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- 5. LOGIC XỬ LÝ KHI BẤM NÚT XÓA GIAO DỊCH ---
function deleteTransaction(id) {
    if (confirm("Bạn có chắc chắn muốn xóa dòng giao dịch này? Số dư ví tiền mặt/tài khoản ngân hàng liên quan sẽ tự động tính toán lại.")) {
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
    }
}

// Các hàm tính số dư `calculateLiveBalances()` và phân trang `renderPaginationControls()` giữ nguyên giống hệt lượt chat trước...
function calculateLiveBalances() {
    const gridContainer = document.querySelector(".account-summary-grid");
    if (!gridContainer) return;
    let baseAccounts = JSON.parse(localStorage.getItem("classic_accounts")) || [];
    let liveBalances = {};
    baseAccounts.forEach(acc => { liveBalances[acc.id] = acc.balance; });
    const allTx = JSON.parse(localStorage.getItem("classic_transactions")) || transactions;
    allTx.forEach(tx => {
        if (liveBalances[tx.accountId] !== undefined) {
            if (tx.type === "expense") liveBalances[tx.accountId] -= tx.amount;
            else liveBalances[tx.accountId] += tx.amount;
        }
    });
    gridContainer.innerHTML = "";
    baseAccounts.forEach(acc => {
        const currentBal = liveBalances[acc.id];
        const card = document.createElement("div");
        card.className = "summary-card";
        const formatted = new Intl.NumberFormat('vi-VN').format(currentBal) + "đ";
        let badgeClass = acc.type === "cash" ? "badge-cash" : (acc.type === "bank" ? "badge-bank" : "badge-credit");
        let badgeText = acc.type === "cash" ? "Tiền mặt" : (acc.type === "bank" ? "Ngân hàng" : "Tín dụng");
        card.innerHTML = `<span class="badge ${badgeClass}">${badgeText}</span><h4 style="margin: 10px 0 5px 0;">${acc.name}</h4><p class="balance-amount ${currentBal < 0 ? 'txt-red' : ''}">${formatted}</p>`;
        gridContainer.appendChild(card);
    });
}

function renderPaginationControls(totalItems) {
    const paginationContainer = document.querySelector(".classic-pagination");
    if (!paginationContainer) return;
    paginationContainer.innerHTML = "";
    const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
    const prevBtn = document.createElement("a"); prevBtn.href = "#"; prevBtn.className = "page-btn"; prevBtn.textContent = "« Trước";
    if (currentPage === 1) prevBtn.style.opacity = "0.4";
    prevBtn.addEventListener("click", (e) => { e.preventDefault(); if (currentPage > 1) { currentPage--; renderTransactionTable(); } });
    paginationContainer.appendChild(prevBtn);
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement("a"); pageBtn.href = "#"; pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`; pageBtn.textContent = i;
        pageBtn.addEventListener("click", (e) => { e.preventDefault(); currentPage = i; renderTransactionTable(); });
        paginationContainer.appendChild(pageBtn);
    }
    const nextBtn = document.createElement("a"); nextBtn.href = "#"; nextBtn.className = "page-btn"; nextBtn.textContent = "Sau »";
    if (currentPage === totalPages) nextBtn.style.opacity = "0.4";
    nextBtn.addEventListener("click", (e) => { e.preventDefault(); if (currentPage < totalPages) { currentPage++; renderTransactionTable(); } });
    paginationContainer.appendChild(nextBtn);
}
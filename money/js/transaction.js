// Dữ liệu mẫu (Mock Data) cho các giao dịch để đổ vào minh họa
let transactions = JSON.parse(localStorage.getItem("classic_transactions")) || [
    { id: "tx_1", date: "2026-06-09", accountId: "acc_1", categoryId: "cat_1", title: "Cơm trưa văn phòng", amount: 45000, type: "expense" },
    { id: "tx_2", date: "2026-06-09", accountId: "acc_3", categoryId: "cat_4", title: "Thanh toán hóa đơn điện tháng 5", amount: 1450000, type: "expense" },
    { id: "tx_3", date: "2026-06-08", accountId: "acc_2", categoryId: "cat_3", title: "Đổ xăng đầy bình xe máy", amount: 70000, type: "expense" },
    { id: "tx_4", date: "2026-06-07", accountId: "acc_2", categoryId: "cat_5", title: "Nhận tiền Freelance Thiết kế UI", amount: 4500000, type: "income" },
    { id: "tx_5", date: "2026-06-06", accountId: "acc_1", categoryId: "cat_2", title: "Cà phê họp nhóm Highlands", amount: 120000, type: "expense" },
    { id: "tx_6", date: "2026-06-05", accountId: "acc_2", categoryId: "cat_1", title: "Mua nhu yếu phẩm tại siêu thị", amount: 350000, type: "expense" },
    { id: "tx_7", date: "2026-06-04", accountId: "acc_3", categoryId: "cat_2", title: "Đặt trà sữa cho cả phòng", amount: 280000, type: "expense" }
];

// Cấu hình phân trang dữ liệu tĩnh
const rowsPerPage = 5;
let currentPage = 1;

function initTransactionLogic() {
    calculateLiveBalances();
    renderTransactionTable();

    // Xử lý sự kiện ghi chép giao dịch mới
    const form = document.querySelector(".flex-col-form form");
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();

            const title = form.querySelector("input[type='text']").value.trim();
            const amount = parseFloat(form.querySelector("input[type='number']").value) || 0;
            const accountId = document.getElementById("tx-account").value;
            const categoryId = document.getElementById("tx-category").value;
            const type = document.getElementById("tx-type").value;

            // Lấy ngày hiện tại định dạng YYYY-MM-DD
            const today = new Date().toISOString().split('T')[0];

            const newTx = {
                id: "tx_" + Date.now(),
                date: today,
                accountId,
                categoryId,
                title,
                amount,
                type
            };

            transactions.unshift(newTx); // Đưa giao dịch mới lên đầu danh sách
            localStorage.setItem("classic_transactions", JSON.stringify(transactions));

            form.reset();
            currentPage = 1; // Quay về trang 1 để xem giao dịch mới nhất
            calculateLiveBalances();
            renderTransactionTable();
            alert("Đã ghi nhận giao dịch thành công!");
        });
    }
}

// HÀM QUAN TRỌNG: Tính toán lại số dư động (Live Balance) dựa trên giao dịch
function calculateLiveBalances() {
    // Đọc số dư gốc đã cấu hình từ tài khoản
    let baseAccounts = JSON.parse(localStorage.getItem("classic_accounts")) || [
        { id: "acc_1", name: "Ví cá nhân", type: "cash", balance: 1420000 },
        { id: "acc_2", name: "Vietcombank (VCB)", type: "bank", balance: 24500000 },
        { id: "acc_3", name: "UOB Credit Card", type: "credit", balance: -3850000 }
    ];

    // Tạo bản đồ tính toán số dư
    let liveBalances = {};
    baseAccounts.forEach(acc => {
        liveBalances[acc.id] = acc.balance;
    });

    // Duyệt qua tất cả giao dịch để cộng/trừ tiền thực tế
    transactions.forEach(tx => {
        if (liveBalances[tx.accountId] !== undefined) {
            if (tx.type === "expense") {
                liveBalances[tx.accountId] -= tx.amount; // Chi ra thì trừ tiền
            } else {
                liveBalances[tx.accountId] += tx.amount; // Thu vào thì cộng tiền
            }
        }
    });

    // Vẽ lại bảng số dư cập nhật lên màn hình chính
    const gridContainer = document.querySelector(".account-summary-grid");
    if (!gridContainer) return;
    gridContainer.innerHTML = "";

    baseAccounts.forEach(acc => {
        const currentBal = liveBalances[acc.id];
        const card = document.createElement("div");
        card.className = "summary-card";
        const formatted = new Intl.NumberFormat('vi-VN').format(currentBal) + "đ";

        let badgeClass = acc.type === "cash" ? "badge-cash" : (acc.type === "bank" ? "badge-bank" : "badge-credit");
        let badgeText = acc.type === "cash" ? "Tiền mặt" : (acc.type === "bank" ? "Ngân hàng" : "Tín dụng");

        card.innerHTML = `
            <span class="badge ${badgeClass}">${badgeText}</span>
            <h4>${acc.name}</h4>
            <p class="balance-amount ${currentBal < 0 ? 'txt-red' : ''}">${formatted}</p>
        `;
        gridContainer.appendChild(card);
    });
}

// Vẽ bảng nhật ký và xử lý giao diện phân trang
function renderTransactionTable() {
    // SỬA DÒNG NÀY: Lấy chính xác ID tbody của bảng giao dịch ở index.html
    const tbody = document.getElementById("table-transaction-body");
    if (!tbody) return; 
    tbody.innerHTML = "";

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedItems = transactions.slice(start, end);

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
            <td class="text-right ${colorClass}">${sign}${formattedAmount}</td>
        `;
        tbody.appendChild(tr);
    });

    renderPaginationControls();
}

// Tạo các nút bấm lật trang
function renderPaginationControls() {
    const paginationContainer = document.querySelector(".classic-pagination");
    if (!paginationContainer) return;
    paginationContainer.innerHTML = "";

    const totalPages = Math.ceil(transactions.length / rowsPerPage) || 1;

    // Nút "Trước"
    const prevBtn = document.createElement("a");
    prevBtn.href = "#";
    prevBtn.className = "page-btn";
    prevBtn.textContent = "« Trước";
    if (currentPage === 1) prevBtn.style.opacity = "0.4";
    prevBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (currentPage > 1) { currentPage--; renderTransactionTable(); }
    });
    paginationContainer.appendChild(prevBtn);

    // Danh sách các số trang danh định
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement("a");
        pageBtn.href = "#";
        pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener("click", (e) => {
            e.preventDefault();
            currentPage = i;
            renderTransactionTable();
        });
        paginationContainer.appendChild(pageBtn);
    }

    // Nút "Sau"
    const nextBtn = document.createElement("a");
    nextBtn.href = "#";
    nextBtn.className = "page-btn";
    nextBtn.textContent = "Sau »";
    if (currentPage === totalPages) nextBtn.style.opacity = "0.4";
    nextBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (currentPage < totalPages) { currentPage++; renderTransactionTable(); }
    });
    paginationContainer.appendChild(nextBtn);
}
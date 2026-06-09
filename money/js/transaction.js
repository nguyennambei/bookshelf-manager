// =========================================================================
// 1. KHỞI TẠO BỘ DỮ LIỆU GIẢ LẬP ĐỂ ĐỔ VÀO MINH HỌA (THÁNG 06/2026)
// =========================================================================
let transactions = JSON.parse(localStorage.getItem("classic_transactions")) || [
    // --- CÁC KHOẢN THU NHẬP (INCOME) ---
    { id: "tx_mock_1", date: "2026-06-05", accountId: "acc_2", categoryId: "cat_8", title: "Nhận lương công ty tháng 05", amount: 18500000, type: "income" },
    { id: "tx_mock_2", date: "2026-06-08", accountId: "acc_2", categoryId: "cat_9", title: "Thanh toán dự án Freelance Web", amount: 4500000, type: "income" },

    // --- CÁC KHOẢN CHI TIÊU CỐ ĐỊNH (EXPENSE) ---
    { id: "tx_mock_3", date: "2026-06-01", accountId: "acc_3", categoryId: "cat_5", title: "Hóa đơn tiền điện sinh hoạt gia đình", amount: 1350000, type: "expense" },
    { id: "tx_mock_4", date: "2026-06-02", accountId: "acc_2", categoryId: "cat_6", title: "Cước Internet cáp quang Viettel", amount: 275000, type: "expense" },
    { id: "tx_mock_5", date: "2026-06-02", accountId: "acc_1", categoryId: "cat_7", title: "Tiền nước & Phí quản lý chung cư", amount: 480000, type: "expense" },

    // --- CÁC KHOẢN CHI TIÊU HÀNG NGÀY (EXPENSE) ---
    { id: "tx_mock_6", date: "2026-06-09", accountId: "acc_1", categoryId: "cat_1", title: "Ăn trưa bún đậu mắm tôm cùng công ty", amount: 55000, type: "expense" },
    { id: "tx_mock_7", date: "2026-06-08", accountId: "acc_1", categoryId: "cat_2", title: "Cà phê Starbucks tiếp khách hàng", amount: 115000, type: "expense" },
    { id: "tx_mock_8", date: "2026-06-07", accountId: "acc_2", categoryId: "cat_3", title: "Đổ đầy bình xăng xe máy", amount: 80000, type: "expense" },
    { id: "tx_mock_9", date: "2026-06-06", accountId: "acc_1", categoryId: "cat_1", title: "Mua đồ ăn tối tại siêu thị WinMart", amount: 320000, type: "expense" },
    { id: "tx_mock_10", date: "2026-06-05", accountId: "acc_3", categoryId: "cat_2", title: "Đặt trà sữa GongCha cho cả team", amount: 240000, type: "expense" },
    { id: "tx_mock_11", date: "2026-06-04", accountId: "acc_2", categoryId: "cat_4", title: "Thay dầu nhớt định kỳ xe máy", amount: 350000, type: "expense" },
    { id: "tx_mock_12", date: "2026-06-03", accountId: "acc_1", categoryId: "cat_1", title: "Đi ăn tối buffet lẩu nướng cuối tuần", amount: 690000, type: "expense" },
    { id: "tx_mock_13", date: "2026-06-01", accountId: "acc_1", categoryId: "cat_1", title: "Mua bánh mì ăn sáng cả tuần", amount: 120000, type: "expense" }
];

// Cấu hình phân trang cho Nhật ký trang chủ
const rowsPerPage = 5;
let currentPage = 1;

// =========================================================================
// 2. KHỞI TẠO LOGIC CHO TRANG CHỦ (INDEX.HTML)
// =========================================================================
function initTransactionLogic() {
    // Cơ chế Force-Load: Đè dữ liệu giả lập vào LocalStorage nếu bộ nhớ máy bị kẹt hoặc trống
    if (!localStorage.getItem("classic_transactions") || JSON.parse(localStorage.getItem("classic_transactions")).length < 10) {
        localStorage.setItem("classic_transactions", JSON.stringify(transactions));
    } else {
        transactions = JSON.parse(localStorage.getItem("classic_transactions"));
    }

    // Tự động gán ngày hôm nay vào ô chọn ngày của form
    const dateInput = document.getElementById("tx-date");
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    // Chạy các hàm hiển thị dữ liệu lên màn hình
    calculateLiveBalances();
    renderTransactionTable();

    // Xử lý sự kiện gửi Form Giao dịch mới
    const form = document.querySelector(".flex-col-form form");
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();

            const selectedDate = document.getElementById("tx-date").value;
            const title = document.getElementById("tx-title").value.trim();
            const amount = parseFloat(document.getElementById("tx-amount").value) || 0;
            const accountId = document.getElementById("tx-account").value;
            const categoryId = document.getElementById("tx-category").value;
            const type = document.getElementById("tx-type").value;

            if (!selectedDate) {
                alert("Vui lòng chọn ngày giao dịch hợp lệ!");
                return;
            }

            const newTx = {
                id: "tx_" + Date.now(),
                date: selectedDate,
                accountId,
                categoryId,
                title,
                amount,
                type
            };

            // Thêm lên đầu mảng và sắp xếp lại theo thứ tự ngày mới nhất
            transactions.unshift(newTx);
            transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Lưu lại vào bộ nhớ trình duyệt
            localStorage.setItem("classic_transactions", JSON.stringify(transactions));

            form.reset();
            if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

            currentPage = 1; // Đẩy người dùng về trang 1 để xem dòng vừa nhập
            calculateLiveBalances();
            renderTransactionTable();
            alert("Đã ghi sổ giao dịch thành công!");
        });
    }
}

// =========================================================================
// 3. LOGIC TÍNH SỐ DƯ ĐỘNG & VẼ CÁC THẺ (SO-DU-TAI-KHOAN.HTML)
// =========================================================================
function calculateLiveBalances() {
    const gridContainer = document.querySelector(".account-summary-grid");
    if (!gridContainer) return; // Nếu không ở trang hiển thị số dư, thoát hàm

    // Đọc số dư gốc từ phần cài đặt tài khoản
    let baseAccounts = JSON.parse(localStorage.getItem("classic_accounts")) || [];
    
    // Tạo bản đồ để tính toán bù trừ tiền
    let liveBalances = {};
    baseAccounts.forEach(acc => {
        liveBalances[acc.id] = acc.balance;
    });

    // Duyệt qua toàn bộ danh sách giao dịch để làm phép tính cộng / trừ tiền thực tế
    const allTx = JSON.parse(localStorage.getItem("classic_transactions")) || transactions;
    allTx.forEach(tx => {
        if (liveBalances[tx.accountId] !== undefined) {
            if (tx.type === "expense") {
                liveBalances[tx.accountId] -= tx.amount;
            } else {
                liveBalances[tx.accountId] += tx.amount;
            }
        }
    });

    // Vẽ giao diện các thẻ số dư ví tài khoản lên màn hình
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
            <h4 style="margin: 10px 0 5px 0;">${acc.name}</h4>
            <p class="balance-amount ${currentBal < 0 ? 'txt-red' : ''}">${formatted}</p>
        `;
        gridContainer.appendChild(card);
    });
}

// =========================================================================
// 4. LOGIC PHÂN TRANG VÀ IN BẢNG NHẬT KÝ (INDEX.HTML)
// =========================================================================
function renderTransactionTable() {
    const tbody = document.getElementById("table-transaction-body");
    if (!tbody) return; // Nếu không ở trang chủ, thoát hàm
    tbody.innerHTML = "";

    const localTx = JSON.parse(localStorage.getItem("classic_transactions")) || transactions;

    // Phân tách mảng dữ liệu theo vị trí trang hiện tại
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
        `;
        tbody.appendChild(tr);
    });

    renderPaginationControls(localTx.length);
}

function renderPaginationControls(totalItems) {
    const paginationContainer = document.querySelector(".classic-pagination");
    if (!paginationContainer) return;
    paginationContainer.innerHTML = "";

    const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;

    // Nút Lùi lại page trước
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

    // Vòng lặp in các nút số trang định danh
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

    // Nút Tiến lên page sau
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

// =========================================================================
// 5. LOGIC PHÂN TÍCH TỶ TRỌNG VÀ BÁO CÁO THÁNG (BAO-CAO-THANG.HTML)
// =========================================================================
function initMonthlyReportLogic() {
    const monthPicker = document.getElementById("report-month-picker");
    if (!monthPicker) return;

    // Mặc định nạp tháng/năm hiện tại lên thanh filter ô input month (Dạng YYYY-MM)
    const today = new Date();
    const currentMonthStr = today.toISOString().substring(0, 7); 
    monthPicker.value = currentMonthStr;

    renderMonthlyReport(currentMonthStr);

    monthPicker.addEventListener("change", (e) => {
        renderMonthlyReport(e.target.value);
    });
}
let globalExpenseChart = null;

function renderMonthlyReport(targetMonth) {
    const tbody = document.getElementById("table-report-body");
    const totalIncomeEl = document.getElementById("report-total-income");
    const totalExpenseEl = document.getElementById("report-total-expense");
    const netSavingsEl = document.getElementById("report-net-savings");

    if (!tbody || !targetMonth) return;

    const localTx = JSON.parse(localStorage.getItem("classic_transactions")) || transactions;
    const filteredTx = localTx.filter(tx => tx.date.startsWith(targetMonth));

    let totalIncome = 0;
    let totalExpense = 0;
    let categoryMap = {};

    const localCats = JSON.parse(localStorage.getItem("classic_categories")) || [];

    filteredTx.forEach(tx => {
        if (tx.type === "income") {
            totalIncome += tx.amount;
        } else {
            totalExpense += tx.amount;
        }

        if (!categoryMap[tx.categoryId]) {
            categoryMap[tx.categoryId] = { amount: 0, type: tx.type };
        }
        categoryMap[tx.categoryId].amount += tx.amount;
    });

    // Hiển thị số liệu 3 ô thẻ tổng
    totalIncomeEl.textContent = new Intl.NumberFormat('vi-VN').format(totalIncome) + "đ";
    totalExpenseEl.textContent = new Intl.NumberFormat('vi-VN').format(totalExpense) + "đ";
    const netSavings = totalIncome - totalExpense;
    netSavingsEl.textContent = new Intl.NumberFormat('vi-VN').format(netSavings) + "đ";
    netSavingsEl.className = `balance-amount ${netSavings < 0 ? 'txt-red' : 'txt-green'}`;

    tbody.innerHTML = "";

    // Mảng lưu dữ liệu phục vụ riêng cho việc vẽ Chart Chi Tiêu
    let chartLabels = [];
    let chartData = [];

    if (filteredTx.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center" style="padding:24px; color:#999;">Không tìm thấy dữ liệu thu chi nào trong tháng này!</td></tr>`;
        // Hủy chart cũ nếu tháng mới chọn không có dữ liệu
        if (globalExpenseChart) { globalExpenseChart.destroy(); globalExpenseChart = null; }
        return;
    }

    // Duyệt map và đổ dữ liệu vào bảng
    for (const catId in categoryMap) {
        const item = categoryMap[catId];
        const catObj = localCats.find(c => c.id === catId) || { main: "Khác", sub: "Chưa phân loại" };
        const cleanName = `${catObj.main.replace("Khoản Chi > ", "").replace("Khoản Thu > ", "")} > ${catObj.sub}`;
        
        const tr = document.createElement("tr");
        const formattedAmt = new Intl.NumberFormat('vi-VN').format(item.amount) + "đ";
        
        const totalGroup = item.type === "income" ? totalIncome : totalExpense;
        const percentage = totalGroup > 0 ? ((item.amount / totalGroup) * 100).toFixed(1) : 0;

        const typeText = item.type === "income" ? "Thu nhập" : "Khoản chi";
        const colorClass = item.type === "income" ? "txt-green" : "txt-red";

        tr.innerHTML = `
            <td><strong>${cleanName}</strong></td>
            <td class="${colorClass}">${typeText}</td>
            <td class="text-right" style="font-weight:bold;">${formattedAmt}</td>
            <td class="text-right" style="color:#555;">${percentage}%</td>
        `;
        tbody.appendChild(tr);

        // GOM DỮ LIỆU ĐỂ VẼ CHART (Chỉ vẽ các mục thuộc nhóm CHI TIÊU)
        if (item.type === "expense") {
            chartLabels.push(catObj.sub); // Lấy tên danh mục con làm nhãn
            chartData.push(item.amount);  // Lấy số tiền làm giá trị phân mảnh
        }
    }

    // TIẾN HÀNH KHỞI TẠO VÀ VẼ BIỂU ĐỒ TRÒN (PIE CHART)
    const ctx = document.getElementById('expensePieChart');
    if (ctx) {
        // Nếu đã có thực thể chart đang chạy trước đó, cần hủy (destroy) để vẽ mới hoàn toàn
        if (globalExpenseChart) {
            globalExpenseChart.destroy();
        }

        if (chartData.length === 0) {
            // Nếu tháng này chỉ có thu mà không có chi, không vẽ biểu đồ chi tiêu
            return;
        }

        globalExpenseChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: chartLabels,
                datasets: [{
                    data: chartData,
                    backgroundColor: [
                        '#e74c3c', '#3498db', '#f1c40f', '#2ecc71', 
                        '#9b59b6', '#1abc9c', '#e67e22', '#34495e'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom', // Đẩy các nhãn chú thích xuống dưới đáy cho gọn gọn
                        labels: { boxWidth: 12, font: { family: 'inherit', size: 11 } }
                    }
                }
            }
        });
    }
}
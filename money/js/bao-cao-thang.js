let incomeChart = null;
let expenseChart = null;

document.addEventListener("DOMContentLoaded", () => {
    const monthInput = document.getElementById("report-month");
    const now = new Date();
    monthInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    renderReport(monthInput.value);
    monthInput.onchange = (e) => renderReport(e.target.value);
});

function renderReport(month) {
    const transactions = JSON.parse(localStorage.getItem("classic_transactions")) || [];
    const categories = JSON.parse(localStorage.getItem("classic_categories")) || [];
    const filtered = transactions.filter(t => t.date.startsWith(month) && t.status !== "DELETED");
    
    let totalIncome = 0, totalExpense = 0, categoryMap = {};
    let daysInMonth = new Date(month.split('-')[0], month.split('-')[1], 0).getDate();
    let labels = Array.from({length: daysInMonth}, (_, i) => i + 1);
    let incomeData = new Array(daysInMonth).fill(0);
    let expenseData = new Array(daysInMonth).fill(0);

    filtered.forEach(t => {
        let dayIndex = parseInt(t.date.split('-')[2]) - 1;
        if (t.type === "INCOME") {
            totalIncome += t.amount;
            incomeData[dayIndex] += t.amount;
        } else {
            totalExpense += t.amount;
            expenseData[dayIndex] += t.amount;
        }
        const cat = categories.find(c => c.id === t.main_category_id);
        const name = cat ? cat.name : "Khác";
        categoryMap[name] = (categoryMap[name] || 0) + t.amount;
    });

    document.getElementById("total-income").textContent = formatVND(totalIncome);
    document.getElementById("total-expense").textContent = formatVND(totalExpense);
    document.getElementById("net-balance").textContent = formatVND(totalIncome - totalExpense);

    const tbody = document.getElementById("report-category-body");
    tbody.innerHTML = "";
    for (let cat in categoryMap) {
        tbody.innerHTML += `<tr><td>${cat}</td><td style="text-align:right;">${formatVND(categoryMap[cat])}</td></tr>`;
    }

    // Xóa biểu đồ cũ
    if (incomeChart) incomeChart.destroy();
    if (expenseChart) expenseChart.destroy();

    // Vẽ biểu đồ Thu (Dạng Line)
    incomeChart = new Chart(document.getElementById('incomeChart').getContext('2d'), {
        type: 'line',
        data: { labels: labels, datasets: [{ label: 'Thu nhập', data: incomeData, borderColor: '#27ae60', fill: true, backgroundColor: 'rgba(39, 174, 96, 0.1)' }] },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });

    // Vẽ biểu đồ Chi (Dạng Bar)
    expenseChart = new Chart(document.getElementById('expenseChart').getContext('2d'), {
        type: 'bar',
        data: { labels: labels, datasets: [{ label: 'Chi tiêu', data: expenseData, backgroundColor: '#c0392b' }] },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
}

function formatVND(n) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

function exportToPDF() {
    const element = document.getElementById('report-content');
    
    // Cấu hình định dạng file PDF
    const opt = {
        margin:       0.5,
        filename:     `Bao-Cao-Tai-Chinh-${document.getElementById('report-month').value}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // Chuyển đổi và tải xuống
    html2pdf().set(opt).from(element).save();
}
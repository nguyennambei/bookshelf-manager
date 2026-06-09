// Dữ liệu mẫu minh họa hệ thống phân cấp Thể loại chính > Nhánh phụ (Tiểu thể loại)
let categories = JSON.parse(localStorage.getItem("classic_categories")) || [
    { id: "cat_1", main: "Khoản Chi > Ăn uống", sub: "Cơm trưa văn phòng" },
    { id: "cat_2", main: "Khoản Chi > Ăn uống", sub: "Cà phê & Trà sữa họp nhóm" },
    { id: "cat_3", main: "Khoản Chi > Di chuyển", sub: "Xăng xe máy" },
    { id: "cat_4", main: "Khoản Chi > Di chuyển", sub: "Sửa xe & Bảo dưỡng định kỳ" },
    { id: "cat_5", main: "Khoản Chi > Nhà cửa & Sinh hoạt", sub: "Tiền điện sinh hoạt" },
    { id: "cat_6", main: "Khoản Chi > Nhà cửa & Sinh hoạt", sub: "Mạng Internet cáp quang" },
    { id: "cat_7", main: "Khoản Chi > Nhà cửa & Sinh hoạt", sub: "Tiền nước & Phí chung cư" },
    { id: "cat_8", main: "Khoản Thu > Thu nhập", sub: "Lương công ty chính thức" },
    { id: "cat_9", main: "Khoản Thu > Thu nhập", sub: "Tiền Freelance nghề tay trái" }
];

function initCategoryLogic() {
    // Lưu dữ liệu mẫu vào LocalStorage nếu là lần đầu tiên chạy ứng dụng
    if (!localStorage.getItem("classic_categories")) {
        localStorage.setItem("classic_categories", JSON.stringify(categories));
    }

    renderCategorySelects();
    renderCategoryTable(); // Hàm chịu trách nhiệm vẽ bảng danh sách ở trang cài đặt thể loại

    const form = document.getElementById("form-category");
    const cancelBtn = document.getElementById("btn-cat-cancel");

    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const editId = document.getElementById("edit-cat-id").value;
            const main = document.getElementById("input-cat-main").value;
            const sub = document.getElementById("input-cat-sub").value.trim();

            if (editId) {
                // Chế độ Cập nhật (Sửa)
                categories = categories.map(cat => cat.id === editId ? { ...cat, main, sub } : cat);
                document.getElementById("edit-cat-id").value = "";
                document.getElementById("category-form-title").textContent = "Tạo Thể Loại Con";
                if (cancelBtn) cancelBtn.style.style.display = "none";
            } else {
                // Chế độ Thêm mới
                categories.push({ id: "cat_" + Date.now(), main, sub });
            }

            saveCategories();
            form.reset();
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            document.getElementById("edit-cat-id").value = "";
            document.getElementById("category-form-title").textContent = "Tạo Thể Loại Con";
            cancelBtn.style.display = "none";
            form.reset();
        });
    }
}

function saveCategories() {
    localStorage.setItem("classic_categories", JSON.stringify(categories));
    renderCategorySelects();
    renderCategoryTable();
}

// Hàm đồng bộ danh mục vào Form Giao dịch ở Trang chủ (An toàn, không gây lỗi gãy JS)
function renderCategorySelects() {
    const txCatSelect = document.getElementById("tx-category");
    if (!txCatSelect) return; // Nếu không đứng ở trang chủ, thoát hàm để tránh lỗi

    txCatSelect.innerHTML = "";
    categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat.id;
        // Rút gọn chữ hiển thị cho gọn form: "Ăn uống > Cơm trưa văn phòng"
        const cleanMainName = cat.main.replace("Khoản Chi > ", "").replace("Khoản Thu > ", "");
        option.textContent = `${cleanMainName} > ${cat.sub}`;
        txCatSelect.appendChild(option);
    });
}

// HÀM VẼ BẢNG DANH SÁCH: Chịu trách nhiệm render dữ liệu minh họa lên bảng
function renderCategoryTable() {
    const tbody = document.getElementById("table-category-body");
    if (!tbody) return; // Nếu không đứng ở trang cấu hình thể loại, thoát hàm
    
    tbody.innerHTML = "";

    categories.forEach(cat => {
        const tr = document.createElement("tr");
        
        // Phân tách màu sắc nhãn (Tag) dựa trên Thu hay Chi để giao dịch trực quan hơn
        const isIncome = cat.main.includes("Khoản Thu");
        const badgeClass = isIncome ? "badge-bank" : "badge-cash"; // dùng lại style class cũ của bạn cho nhanh
        const badgeText = isIncome ? "THU VÀO" : "CHI RA";

        tr.innerHTML = `
            <td>
                <span class="badge ${badgeClass}" style="margin-right:8px; font-size:0.7rem;">${badgeText}</span>
                ${cat.main}
            </td>
            <td><strong>${cat.sub}</strong></td>
            <td class="text-center">
                <button class="btn-action edit" onclick="editCategory('${cat.id}')">Sửa</button>
                <button class="btn-action delete" onclick="deleteCategory('${cat.id}')">Xóa</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function editCategory(id) {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;

    document.getElementById("edit-cat-id").value = cat.id;
    document.getElementById("input-cat-main").value = cat.main;
    document.getElementById("input-cat-sub").value = cat.sub;

    document.getElementById("category-form-title").textContent = "Sửa Nhánh Thể Loại Con";
    const cancelBtn = document.getElementById("btn-cat-cancel");
    if (cancelBtn) cancelBtn.style.display = "inline-block";
}

function deleteCategory(id) {
    if (confirm("Bạn có chắc chắn muốn xóa tiểu thể loại này? Các giao dịch cũ đã ghi vào sổ vẫn sẽ được giữ nguyên nhóm cũ.")) {
        categories = categories.filter(c => c.id !== id);
        saveCategories();
    }
}
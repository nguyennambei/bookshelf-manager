// =========================================================================
// 1. KHỞI TẠO BỘ DATA GỐC CHUẨN CẤU TRÚC MẢNG LỒNG & STATUS
// =========================================================================
let categories = JSON.parse(localStorage.getItem("classic_categories")) || [
    { 
        id: "cat_1", 
        name: "Ăn uống", 
        type: "EXPENSE", 
        subCategories: ["Ăn sáng", "Ăn trưa", "Cà phê & Hẹn hò"],
        createDate: "2026-06-01T08:00:00.000Z",
        updateDate: "2026-06-01T08:00:00.000Z",
        status: "ACTIVE"
    },
    { 
        id: "cat_2", 
        name: "Di chuyển", 
        type: "EXPENSE", 
        subCategories: ["Xăng xe", "Sửa xe & Bảo dưỡng", "Taxi/Grab"],
        createDate: "2026-06-01T08:30:00.000Z",
        updateDate: "2026-06-01T08:30:00.000Z",
        status: "ACTIVE"
    },
    { 
        id: "cat_3", 
        name: "Tiền lương", 
        type: "INCOME", 
        subCategories: ["Lương chính thức", "Thưởng KPIs", "Freelance"],
        createDate: "2026-06-02T09:00:00.000Z",
        updateDate: "2026-06-02T09:00:00.000Z",
        status: "ACTIVE"
    }
];

// Mảng tạm thời để quản lý danh sách danh mục con đang thao tác trên Form
let currentSubCategories = [];

// Tự động kích hoạt khi trang web nạp xong cấu trúc DOM
document.addEventListener("DOMContentLoaded", () => {
    initCategoryLogic();
});

// =========================================================================
// 2. HÀM XỬ LÝ LOGIC CORE
// =========================================================================
function initCategoryLogic() {
    // Nạp dữ liệu từ localStorage nếu có sẵn
    if (!localStorage.getItem("classic_categories") || JSON.parse(localStorage.getItem("classic_categories")).length === 0) {
        localStorage.setItem("classic_categories", JSON.stringify(categories));
    } else {
        categories = JSON.parse(localStorage.getItem("classic_categories"));
    }

    // Vẽ bảng quản lý ở cột bên phải
    renderCategoryTable();

    const subField = document.getElementById("input-cat-sub-field");
    const btnAddSub = document.getElementById("btn-add-sub-tag");
    const btnSubmitMain = document.getElementById("btn-submit-category");
    const cancelBtn = document.getElementById("btn-cat-cancel");

    // --- A. LOGIC VẼ CÁC TAG DANH MỤC CON LÊN FORM ---
    window.renderSubFormTags = function() {
        const container = document.getElementById("sub-category-tags-container");
        if (!container) return;
        container.innerHTML = "";

        if (currentSubCategories.length === 0) {
            container.innerHTML = `<span style="color: #999; font-size: 12px; font-style: italic;">Chưa có mục con nào, hãy gõ và bấm nút [+]...</span>`;
            return;
        }

        currentSubCategories.forEach((subName, index) => {
            const tag = document.createElement("span");
            tag.style.cssText = "background: #eef5f9; color: #2c3e50; border: 1px solid #d4e6f1; padding: 4px 8px; border-radius: 4px; font-size: 12px; display: inline-flex; align-items: center; gap: 6px; font-weight: 500;";
            
            // Truyền tham số 'event' vào hàm xóa để chặn lan truyền sự kiện kích hoạt form submit bậy
            tag.innerHTML = `
                ${subName}
                <span onclick="removeSubFormTag(${index}, event)" style="color: #c0392b; cursor: pointer; font-weight: bold; font-size: 13px; padding: 0 2px;">×</span>
            `;
            container.appendChild(tag);
        });
    }

    // --- B. LOGIC KHI BẤM NÚT [+] HOẶC ẤN ENTER ĐỂ THÊM TAG MỚI ---
    if (btnAddSub && subField) {
        btnAddSub.onclick = function(e) {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            const val = subField.value.trim();
            
            if (val) {
                if (currentSubCategories.includes(val)) {
                    alert("Tên danh mục con này đã có trong danh sách!");
                    return;
                }
                currentSubCategories.push(val);
                subField.value = ""; // Xóa trống ô input để gõ từ tiếp theo
                renderSubFormTags();
            }
        };

        // Chặn phím Enter trong ô gõ không cho submit form, chuyển hướng thành click nút [+]
        subField.onkeydown = function(e) {
            if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                btnAddSub.click(); 
            }
        };
    }

    // --- C. LOGIC XÓA TAG KHỎI MẢNG CHỜ ---
    window.removeSubFormTag = function(index, event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation(); // Chặn tuyệt đối không cho chạm vào luồng lưu của Form cha
        }
        currentSubCategories.splice(index, 1);
        renderSubFormTags();
    }

    // --- D. LOGIC KHI BẤM NÚT LƯU DANH MỤC (CẬP NHẬT CHUẨN SỬA/THÊM) ---
    if (btnSubmitMain) {
        btnSubmitMain.onclick = null; 

        btnSubmitMain.onclick = function (e) {
            if (e) e.preventDefault();

            const editId = document.getElementById("edit-cat-id").value;
            const name = document.getElementById("input-cat-main").value.trim();
            const type = document.getElementById("input-cat-type").value;
            const nowIso = new Date().toISOString();

            if (!name) {
                alert("Vui lòng nhập tên danh mục chính!");
                return;
            }

            // Kiểm tra mảng con rỗng
            if (currentSubCategories.length === 0) {
                alert("Lỗi: Danh mục phải có ít nhất một mục con (Sub-category)!");
                return;
            }

            // Tách mảng con ra một biến độc lập để tránh bị tham chiếu hoặc reset sớm
            const finalSubCategories = [...currentSubCategories];

            if (editId) {
                // CHẾ ĐỘ CẬP NHẬT (SỬA)
                // Duyệt qua mảng tìm đúng ID để đè dữ liệu mới bao gồm cả mảng danh mục con mới
                categories = categories.map(cat => {
                    if (cat.id === editId) {
                        return { 
                            ...cat, 
                            name: name, 
                            type: type, 
                            subCategories: finalSubCategories, // Ghi đè mảng con mới vào đây
                            updateDate: nowIso 
                        };
                    }
                    return cat;
                });
                
                // Trả form về trạng thái Thêm mới
                document.getElementById("edit-cat-id").value = "";
                document.getElementById("category-form-title").textContent = "Thêm Thể Loại Mới";
                if (cancelBtn) cancelBtn.style.display = "none";
            } else {
                // CHẾ ĐỘ TẠO MỚI (THÊM)
                const newCat = {
                    id: "cat_" + Date.now(),
                    name: name,
                    type: type,
                    subCategories: finalSubCategories,
                    createDate: nowIso,
                    updateDate: nowIso,
                    status: "ACTIVE"
                };
                categories.push(newCat);
            }

            // ĐỒNG BỘ QUAN TRỌNG: Lưu thẳng danh sách mới vừa cập nhật vào LocalStorage
            localStorage.setItem("classic_categories", JSON.stringify(categories));
            
            // Vẽ lại bảng ngay lập tức để cập nhật giao diện hiển thị các tag con mới
            renderCategoryTable();
            
            // Dọn dẹp bộ nhớ tạm và làm trống Form
            currentSubCategories = []; 
            const formEl = document.getElementById("form-category");
            if (formEl) formEl.reset();
            
            // Render lại khu vực tag con trên form (lúc này sẽ về trạng thái trống)
            renderSubFormTags();
            
            alert("Đã lưu thay đổi danh mục thành công!");
        };
    }

    // --- E. LOGIC NÚT HỦY CHẾ ĐỘ SỬA ---
    if (cancelBtn) {
        cancelBtn.onclick = function(e) {
            if (e) e.preventDefault();
            document.getElementById("edit-cat-id").value = "";
            document.getElementById("category-form-title").textContent = "Thêm Thể Loại Mới";
            cancelBtn.style.display = "none";
            currentSubCategories = [];
            const formEl = document.getElementById("form-category");
            if (formEl) formEl.reset();
            renderSubFormTags();
        };
    }

    // Khởi chạy vẽ hộp tag rỗng ban đầu khi load trang
    renderSubFormTags();
}

// =========================================================================
// 3. CÁC HÀM PHỤ TRỢ (LƯU TRỮ & IN BẢNG)
// =========================================================================
function saveCategories() {
    localStorage.setItem("classic_categories", JSON.stringify(categories));
    renderCategoryTable();
}

function renderCategoryTable() {
    const tbody = document.getElementById("table-category-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    // Chỉ lấy các danh mục ACTIVE để hiển thị trên bảng cấu hình
    const activeCategories = categories.filter(cat => cat.status !== "DELETED");

    activeCategories.forEach(cat => {
        const tr = document.createElement("tr");
        const isExpense = cat.type === "EXPENSE";
        const badgeClass = isExpense ? "txt-red" : "txt-green";
        const labelText = isExpense ? "KHOẢN CHI" : "KHOẢN THU";

        const subTagsHtml = cat.subCategories.map(sub => 
            `<span style="background: #f1f2f6; color: #2f3542; padding: 3px 8px; margin: 3px; display: inline-block; border-radius: 4px; font-size: 11px; font-weight: 500; border: 1px solid #e4e7eb;">${sub}</span>`
        ).join("");

        tr.innerHTML = `
            <td class="${badgeClass}" style="font-weight: bold; font-size: 12px; letter-spacing: 0.5px;">${labelText}</td>
            <td><strong style="color: #2c3e50; font-size: 14px;">${cat.name}</strong></td>
            <td><div style="display: flex; flex-wrap: wrap;">${subTagsHtml}</div></td>
            <td class="text-center" style="white-space: nowrap;">
                <button class="btn-action edit" onclick="editCategory('${cat.id}')">Sửa</button>
                <button class="btn-action delete" onclick="deleteCategory('${cat.id}')">Xóa</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function editCategory(id) {
    const cat = categories.find(c => c.id === id);
    if (!cat || cat.status === "DELETED") return;

    // Đổ dữ liệu cha lên form
    document.getElementById("edit-cat-id").value = cat.id;
    document.getElementById("input-cat-main").value = cat.name;
    document.getElementById("input-cat-type").value = cat.type;
    
    // Sao chép mảng con vào mảng tạm thời rồi vẽ các tag trực quan lên form
    currentSubCategories = [...cat.subCategories];
    renderSubFormTags();

    // Cập nhật trạng thái giao diện form
    document.getElementById("category-form-title").textContent = "Sửa Thể Loại Hệ Thống";
    
    const cancelBtn = document.getElementById("btn-cat-cancel");
    if (cancelBtn) cancelBtn.style.display = "inline-block";
    
    // Cuộn mượt màn hình lên đầu trang
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteCategory(id) {
    if (confirm("Xác nhận xóa danh mục chính này? Lịch sử chi tiêu cũ đã ghi chép của danh mục này vẫn sẽ được bảo toàn chính xác.")) {
        const nowIso = new Date().toISOString();
        
        // Thực hiện SOFT DELETE (Xóa mềm): Đổi status thành DELETED thay vì lọc bỏ hoàn toàn
        categories = categories.map(cat => 
            cat.id === id ? { ...cat, status: "DELETED", updateDate: nowIso } : cat
        );
        
        saveCategories();
    }
}

// HÀM XUẤT DỮ LIỆU SANG SELECT BOX TRANG CHỦ (CHỈ LẤY CÁC MỤC ACTIVE)
function renderCategorySelects() {
    const mainSelect = document.getElementById("tx-category-main");
    if (!mainSelect) return;

    const localCats = JSON.parse(localStorage.getItem("classic_categories")) || categories;
    const activeCats = localCats.filter(c => c.status !== "DELETED");

    mainSelect.innerHTML = "";
    activeCats.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat.id;
        option.textContent = `[${cat.type === 'EXPENSE' ? '-' : '+'}] ${cat.name}`;
        mainSelect.appendChild(option);
    });
}
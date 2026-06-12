// =========================================================================
// 0. IMPORT ĐỐI TƯỢNG DB TỪ FILE CẤU HÌNH CÓ SẴN VÀ FIREBASE SDK
// =========================================================================
import { db } from "../../js/firebase-config.js"; // Đường dẫn tới file cấu hình của bạn
import { 
    collection, addDoc, updateDoc, doc, onSnapshot, query, where 
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// Tham chiếu tới collection 'categories' trên Firestore
const categoriesCollection = collection(db, "categories");

// Mảng cục bộ để lưu trữ và quản lý danh sách danh mục đồng bộ từ Firebase
let categories = []; 
// Mảng tạm thời để quản lý danh sách danh mục con đang thao tác trên Form
let currentSubCategories = [];

// Tự động kích hoạt khi trang web nạp xong cấu trúc DOM
document.addEventListener("DOMContentLoaded", () => {
    initCategoryLogic();
    listenToCategories(); // Kích hoạt lắng nghe dữ liệu thời gian thực
});

// =========================================================================
// 1. LẮNG NGHE DỮ LIỆU THỜI GIAN THỰC (REALTIME LISTENER)
// =========================================================================
function listenToCategories() {
    // Tạo truy vấn chỉ lấy các danh mục chưa bị xóa mềm (status != DELETED)
    const q = query(categoriesCollection, where("status", "!=", "DELETED"));

    // Lắng nghe biến động dữ liệu từ Firestore
    onSnapshot(q, (snapshot) => {
        categories = []; // Reset lại mảng cục bộ trước khi nạp dữ liệu mới
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            categories.push({
                id: doc.id, // Lấy ID tự động do Firebase sinh ra
                ...data
            });
        });

        // Tự động vẽ lại bảng và select box bất cứ khi nào DB thay đổi
        renderCategoryTable();
        renderCategorySelects();
    }, (error) => {
        console.error("Lỗi khi lắng nghe dữ liệu: ", error);
    });
}

// =========================================================================
// 2. HÀM XỬ LÝ LOGIC CORE FORMS
// =========================================================================
function initCategoryLogic() {
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
                subField.value = ""; 
                renderSubFormTags();
            }
        };

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
            event.stopPropagation(); 
        }
        currentSubCategories.splice(index, 1);
        renderSubFormTags();
    }

    // --- D. LOGIC KHI BẤM NÚT LƯU DANH MỤC (THÊM / SỬA LÊN FIREBASE) ---
    if (btnSubmitMain) {
        btnSubmitMain.onclick = null; 

        btnSubmitMain.onclick = async function (e) {
            if (e) e.preventDefault();

            const editId = document.getElementById("edit-cat-id").value;
            const name = document.getElementById("input-cat-main").value.trim();
            const type = document.getElementById("input-cat-type").value;
            const nowIso = new Date().toISOString();

            if (!name) {
                alert("Vui lòng nhập tên danh mục chính!");
                return;
            }

            if (currentSubCategories.length === 0) {
                alert("Lỗi: Danh mục phải có ít nhất một mục con (Sub-category)!");
                return;
            }

            const finalSubCategories = [...currentSubCategories];

            try {
                if (editId) {
                    // CHẾ ĐỘ CẬP NHẬT (SỬA TRÊN FIREBASE)
                    const docRef = doc(db, "categories", editId);
                    await updateDoc(docRef, {
                        name: name,
                        type: type,
                        subCategories: finalSubCategories,
                        updateDate: nowIso
                    });
                    
                    // Trả form về trạng thái Thêm mới
                    document.getElementById("edit-cat-id").value = "";
                    document.getElementById("category-form-title").textContent = "Thêm Thể Loại Mới";
                    if (cancelBtn) cancelBtn.style.display = "none";
                } else {
                    // CHẾ ĐỘ TẠO MỚI (THÊM VÀO FIREBASE)
                    const newCat = {
                        name: name,
                        type: type,
                        subCategories: finalSubCategories,
                        createDate: nowIso,
                        updateDate: nowIso,
                        status: "ACTIVE"
                    };
                    await addDoc(categoriesCollection, newCat);
                }

                // Dọn dẹp bộ nhớ tạm và làm trống Form
                currentSubCategories = []; 
                const formEl = document.getElementById("form-category");
                if (formEl) formEl.reset();
                
                renderSubFormTags();
                alert("Đã lưu dữ liệu lên hệ thống Cloud thành công!");
                
            } catch (error) {
                console.error("Lỗi thao tác Firebase: ", error);
                alert("Không thể kết nối máy chủ Cloud để lưu dữ liệu!");
            }
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

    renderSubFormTags();
}

// =========================================================================
// 3. CÁC HÀM IN BẢNG & ĐIỀU HƯỚNG (GIAO DIỆN)
// =========================================================================
function renderCategoryTable() {
    const tbody = document.getElementById("table-category-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    // Lọc các danh mục ACTIVE từ mảng cục bộ đã sync với Firebase
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

window.editCategory = function(id) {
    const cat = categories.find(c => c.id === id);
    if (!cat || cat.status === "DELETED") return;

    document.getElementById("edit-cat-id").value = cat.id;
    document.getElementById("input-cat-main").value = cat.name;
    document.getElementById("input-cat-type").value = cat.type;
    
    currentSubCategories = [...cat.subCategories];
    renderSubFormTags();

    document.getElementById("category-form-title").textContent = "Sửa Thể Loại Hệ Thống";
    
    const cancelBtn = document.getElementById("btn-cat-cancel");
    if (cancelBtn) cancelBtn.style.display = "inline-block";
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.deleteCategory = async function(id) {
    if (confirm("Xác nhận xóa danh mục chính này? Lịch sử chi tiêu cũ đã ghi chép của danh mục này vẫn sẽ được bảo toàn chính xác.")) {
        const nowIso = new Date().toISOString();
        try {
            // SOFT DELETE: Update status sang DELETED trên tài nguyên Cloud
            const docRef = doc(db, "categories", id);
            await updateDoc(docRef, {
                status: "DELETED",
                updateDate: nowIso
            });
            alert("Đã xóa danh mục thành công!");
        } catch (error) {
            console.error("Lỗi khi xóa dữ liệu: ", error);
            alert("Không thể xóa danh mục, vui lòng kiểm tra kết nối mạng!");
        }
    }
}

function renderCategorySelects() {
    const mainSelect = document.getElementById("tx-category-main");
    if (!mainSelect) return;

    const activeCats = categories.filter(c => c.status !== "DELETED");

    mainSelect.innerHTML = "";
    activeCats.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat.id;
        option.textContent = `[${cat.type === 'EXPENSE' ? '-' : '+'}] ${cat.name}`;
        mainSelect.appendChild(option);
    });
}
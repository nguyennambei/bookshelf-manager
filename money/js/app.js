// Đợi DOM tải xong hoàn toàn
document.addEventListener("DOMContentLoaded", () => {
    const navLinks = document.querySelectorAll(".nav-link");
    const dashboardPage = document.getElementById("dashboard-page");
    const settingsPage = document.getElementById("settings-page");

    // 1. Xử lý chuyển đổi giữa các trang (Tabs)
    navLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            
            // Xóa class active ở menu cũ, thêm vào menu mới
            navLinks.forEach(item => item.classList.remove("active"));
            link.classList.add("active");

            // Lấy ID trang từ thuộc tính href (#dashboard hoặc #settings)
            const target = link.getAttribute("href");

            if (target === "#dashboard") {
                dashboardPage.classList.add("active-section");
                settingsPage.classList.remove("active-section");
            } else if (target === "#settings") {
                settingsPage.classList.add("active-section");
                dashboardPage.classList.remove("active-section");
            }
        });
    });

    // 2. Khởi tạo dữ liệu ban đầu cho hệ thống
    initApp();
});

function initApp() {
    // Gọi các hàm khởi tạo từ các file logic thành phần
    if (typeof initAccountLogic === "function") initAccountLogic();
    if (typeof initCategoryLogic === "function") initCategoryLogic();
}
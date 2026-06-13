// =========================================================================
// 0. IMPORT THƯ VIỆN MODULE CHUẨN (ĐỒNG BỘ PHIÊN BẢN v12.14.0)
// =========================================================================
import { db } from "/js/firebase-config.js"; // Đi từ gốc thư mục cấu hình của bạn
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// Tham chiếu tới 2 collections trên Firestore Cloud
const payCatCollection = collection(db, "payment_categories");
const payMethodCollection = collection(db, "payment_methods");

// Bộ nhớ đệm dữ liệu cục bộ lấy từ Firebase
let paymentCategories = [];
let paymentMethods = [];

// Trình lắng nghe khởi chạy khi giao diện DOM nạp xong
document.addEventListener("DOMContentLoaded", () => {
  initAccountLogic();
  listenToFirebaseData(); // Kích hoạt cổng nghe Realtime từ Server Cloud
});

// =========================================================================
// 1. LẮNG NGHE DỮ LIỆU THỜI GIAN THỰC TỪ FIREBASE (REALTIME)
// =========================================================================
function listenToFirebaseData() {
  // A. Lắng nghe danh sách Nhóm Tài Khoản (Categories)
  const qCat = query(payCatCollection, where("status", "!=", "DELETED"));
  onSnapshot(
    qCat,
    (snapshot) => {
      paymentCategories = [];

      // Tạo dữ liệu mẫu ban đầu nếu trên Cloud trống rỗng
      if (snapshot.empty) {
        initDefaultCategories();
        return;
      }

      snapshot.forEach((doc) => {
        paymentCategories.push({ id: doc.id, ...doc.data() });
      });
      refreshAllInterfaces();
    },
    (err) => console.error("Lỗi tải Nhóm tài khoản:", err),
  );

  // B. Lắng nghe danh sách Ví/Tài Khoản cụ thể (Methods)
  const qMethod = query(payMethodCollection, where("status", "!=", "DELETED"));
  onSnapshot(
    qMethod,
    (snapshot) => {
      paymentMethods = [];

      if (snapshot.empty && paymentCategories.length > 0) {
        initDefaultMethods();
        return;
      }

      snapshot.forEach((doc) => {
        paymentMethods.push({ id: doc.id, ...doc.data() });
      });
      refreshAllInterfaces();
    },
    (err) => console.error("Lỗi tải Tài khoản ví:", err),
  );
}

// Hàm đẩy dữ liệu mẫu lên Cloud nếu hệ thống mới tinh chưa có gì
async function initDefaultCategories() {
  const defaults = [
    { code: "CASH", name: "Tiền mặt", status: "ACTIVE" },
    { code: "BANK", name: "Tài khoản ngân hàng", status: "ACTIVE" },
    { code: "CREDIT", name: "Thẻ tín dụng", status: "ACTIVE" },
  ];
  for (const cat of defaults) {
    await addDoc(payCatCollection, {
      ...cat,
      createDate: new Date().toISOString(),
    });
  }
}

async function initDefaultMethods() {
  const defaults = [
    {
      name: "Tiền mặt ví chính",
      balance: 0,
      category_code: "CASH",
      status: "ACTIVE",
    },
    {
      name: "Vietcombank",
      balance: 0,
      category_code: "BANK",
      status: "ACTIVE",
    },
  ];
  for (const method of defaults) {
    await addDoc(payMethodCollection, {
      ...method,
      createDate: new Date().toISOString(),
    });
  }
}

// =========================================================================
// 2. XỬ LÝ LOGIC NGHIỆP VỤ FORM THAO TÁC
// =========================================================================
function initAccountLogic() {
  const btnSubmitAcc = document.getElementById("btn-submit-account");
  const btnCancelAcc = document.getElementById("btn-account-cancel");
  const btnSubmitPCat = document.getElementById("btn-submit-paycat");

  const modal = document.getElementById("payment-cat-modal");
  const btnOpenModal = document.getElementById("btn-open-cat-modal");
  const btnCloseModal = document.getElementById("btn-close-cat-modal");

  if (btnOpenModal && modal)
    btnOpenModal.onclick = () => {
      modal.style.display = "block";
      resetPayCatForm();
    };
  if (btnCloseModal && modal)
    btnCloseModal.onclick = () => {
      modal.style.display = "none";
      resetPayCatForm();
    };

  // --- LUỒNG 1: LƯU TÀI KHOẢN/VÍ CỤ THỂ LÊN FIREBASE ---
  if (btnSubmitAcc) {
    btnSubmitAcc.onclick = null;
    btnSubmitAcc.onclick = async function (e) {
      if (e) e.preventDefault();
      const editId = document.getElementById("edit-account-id").value;
      const name = document.getElementById("input-account-name").value.trim();
      const categoryCode = document.getElementById(
        "select-account-category",
      ).value;
      const balance =
        parseFloat(document.getElementById("input-account-balance").value) || 0;
      const nowIso = new Date().toISOString();

      if (!name) {
        alert("Vui lòng nhập tên ví!");
        return;
      }

      try {
        if (editId) {
          // Cập nhật ví lên Cloud
          const docRef = doc(db, "payment_methods", editId);
          await updateDoc(docRef, {
            name,
            category_code: categoryCode,
            balance,
            updateDate: nowIso,
          });
        } else {
          // Thêm mới ví lên Cloud
          await addDoc(payMethodCollection, {
            name,
            balance,
            category_code: categoryCode,
            createDate: nowIso,
            updateDate: nowIso,
            status: "ACTIVE",
          });
        }
        resetAccountForm();
        alert("Đã lưu dữ liệu ví lên Cloud thành công!");
      } catch (err) {
        console.error("Lỗi thao tác Firebase:", err);
        alert("Không thể kết nối máy chủ để lưu tài khoản!");
      }
    };
  }

  if (btnCancelAcc) btnCancelAcc.onclick = () => resetAccountForm();

  // --- LUỒNG 2: LƯU NHÓM TÀI KHOẢN LÊN FIREBASE ---
  if (btnSubmitPCat) {
    btnSubmitPCat.onclick = null;
    btnSubmitPCat.onclick = async function (e) {
      if (e) e.preventDefault();
      const editId = document.getElementById("edit-paycat-id").value;
      const code = document
        .getElementById("input-paycat-code")
        .value.trim()
        .toUpperCase();
      const name = document.getElementById("input-paycat-name").value.trim();
      const nowIso = new Date().toISOString();

      if (!code || !name) {
        alert("Vui lòng nhập đầy đủ thông tin nhóm!");
        return;
      }

      try {
        if (editId) {
          const docRef = doc(db, "payment_categories", editId);
          await updateDoc(docRef, { code, name, updateDate: nowIso });
        } else {
          if (
            paymentCategories.some(
              (c) => c.code === code && c.status !== "DELETED",
            )
          ) {
            alert("Mã Nhóm này đã tồn tại!");
            return;
          }
          await addDoc(payCatCollection, {
            code,
            name,
            createDate: nowIso,
            updateDate: nowIso,
            status: "ACTIVE",
          });
        }

        if (modal) modal.style.display = "none";
        resetPayCatForm();
        alert("Đã lưu nhóm tài khoản lên Cloud thành công!");
      } catch (err) {
        console.error("Lỗi lưu nhóm lên Firebase:", err);
        alert("Không thể lưu nhóm tài khoản!");
      }
    };
  }
}

// =========================================================================
// 3. CÁC HÀM IN BẢNG GIAO DIỆN & ĐIỀU HƯỚNG CỤC BỘ
// =========================================================================
function refreshAllInterfaces() {
  renderCategoryOptions();
  renderAccountTable();
  renderPayCatTable();
}

function resetAccountForm() {
  document.getElementById("edit-account-id").value = "";
  document.getElementById("account-form-title").textContent =
    "Thêm Tài Khoản Mới";
  const btnCancel = document.getElementById("btn-account-cancel");
  if (btnCancel) btnCancel.style.display = "none";
  const form = document.getElementById("form-account");
  if (form) form.reset();
}

function resetPayCatForm() {
  document.getElementById("edit-paycat-id").value = "";
  document.getElementById("modal-cat-title").textContent =
    "Thêm Nhóm Tài Khoản Mới";
  document.getElementById("input-paycat-code").disabled = false;
  const form = document.getElementById("form-paycat");
  if (form) form.reset();
}

function renderCategoryOptions() {
  const selectBox = document.getElementById("select-account-category");
  if (!selectBox) return;
  const activeCats = paymentCategories.filter((c) => c.status !== "DELETED");
  selectBox.innerHTML = "";
  activeCats.forEach((cat) => {
    selectBox.innerHTML += `<option value="${cat.code}">${cat.name}</option>`;
  });
}

function renderAccountTable() {
  const tbody = document.getElementById("table-account-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  paymentMethods
    .filter((pm) => pm.status !== "DELETED")
    .forEach((pm) => {
      const catObj = paymentCategories.find((c) => c.code === pm.category_code);
      const catName = catObj ? catObj.name : pm.category_code;
      const formattedBalance = new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(pm.balance);

      const tr = document.createElement("tr");
      tr.innerHTML = `
            <td><span class="account-badge badge-${pm.category_code.toLowerCase()}">${catName}</span></td>
            <td><strong style="color: #2c3e50; font-size: 14px;">${pm.name}</strong></td>
            <td style="font-weight: 600; color: ${pm.balance >= 0 ? "#27ae60" : "#c0392b"}; text-align: right;">${formattedBalance}</td>
            <td class="text-center" style="white-space: nowrap;">
                <button class="btn-action edit">Sửa</button>
                <button class="btn-action delete">Xóa</button>
            </td>`;

      // Gán sự kiện trực tiếp bằng JS Module để không bị lỗi trên điện thoại
      tr.querySelector(".edit").onclick = () => editAccount(pm.id);
      tr.querySelector(".delete").onclick = () => deleteAccount(pm.id);
      tbody.appendChild(tr);
    });
}

function renderPayCatTable() {
  const tbody = document.getElementById("table-paycat-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  paymentCategories
    .filter((c) => c.status !== "DELETED")
    .forEach((c) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
            <td><code style="background: #f1f2f6; padding: 2px 6px; border-radius: 4px; font-weight: bold; color: #e44d26;">${c.code}</code></td>
            <td><strong style="color: #2c3e50; font-size: 14px;">${c.name}</strong></td>
            <td class="text-center" style="white-space: nowrap;">
                <button class="btn-action edit">Sửa</button>
                <button class="btn-action delete">Xóa</button>
            </td>`;

      tr.querySelector(".edit").onclick = () => editPayCat(c.id);
      tr.querySelector(".delete").onclick = () => deletePayCat(c.id);
      tbody.appendChild(tr);
    });
}

function editAccount(id) {
  const pm = paymentMethods.find((p) => p.id === id);
  if (!pm) return;
  document.getElementById("edit-account-id").value = pm.id;
  document.getElementById("input-account-name").value = pm.name;
  document.getElementById("select-account-category").value = pm.category_code;
  document.getElementById("input-account-balance").value = pm.balance;
  document.getElementById("account-form-title").textContent =
    "Sửa Thông Tin Tài Khoản";
  document.getElementById("btn-account-cancel").style.style.display =
    "inline-block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteAccount(id) {
  if (confirm("Xác nhận xóa tài khoản này?")) {
    try {
      const docRef = doc(db, "payment_methods", id);
      await updateDoc(docRef, {
        status: "DELETED",
        updateDate: new Date().toISOString(),
      });
    } catch (err) {
      console.error(err);
    }
  }
}

function editPayCat(id) {
  const c = paymentCategories.find((item) => item.id === id);
  if (!c) return;
  document.getElementById("edit-paycat-id").value = c.id;
  document.getElementById("input-paycat-code").value = c.code;
  document.getElementById("input-paycat-code").disabled = true;
  document.getElementById("input-paycat-name").value = c.name;
  document.getElementById("modal-cat-title").textContent = "Sửa Nhóm Tài Khoản";
  document.getElementById("payment-cat-modal").style.display = "block";
}

async function deletePayCat(id) {
  const c = paymentCategories.find((item) => item.id === id);
  if (!c) return;

  const hasChild = paymentMethods.some(
    (pm) => pm.category_code === c.code && pm.status !== "DELETED",
  );
  if (hasChild) {
    alert(
      `Không thể xóa! Hiện tại đang có tài khoản ví cụ thể sử dụng nhóm [${c.name}].`,
    );
    return;
  }

  if (confirm(`Bạn chắc chắn muốn xóa nhóm tài khoản [${c.name}]?`)) {
    try {
      const docRef = doc(db, "payment_categories", id);
      await updateDoc(docRef, {
        status: "DELETED",
        updateDate: new Date().toISOString(),
      });
    } catch (err) {
      console.error(err);
    }
  }
}

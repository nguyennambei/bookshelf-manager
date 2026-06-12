import { auth } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut 
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

// Theo dõi trạng thái đăng nhập
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Nếu user đã đăng nhập mà vẫn đang ở trang login, tự đẩy về dashboard
        if (window.location.pathname === "/login.html") { 
            window.location.href = "/index.html";
        }
    }
});
// Đăng ký tài khoản mới
export const registerUser = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
};

// Đăng nhập
export const loginWithEmail = async (email, password) => {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        // Sau khi đăng nhập thành công, chuyển hướng về trang chủ hoặc dashboard
        window.location.href = "/index.html"; 
    } catch (error) {
        console.error("Lỗi đăng nhập:", error.message);
        alert("Đăng nhập thất bại: " + error.message);
    }
};

// Đăng xuất
export const logout = () => {
    return signOut(auth);
};


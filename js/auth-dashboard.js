import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

const authBox = document.getElementById('auth-box');
const appBox = document.getElementById('app-box');
const userHeader = document.getElementById('user-header');
const displayName = document.getElementById('display-name');

// 1. Theo dõi trạng thái login
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Đã login: Hiện app, hiện header, ẩn form login
        authBox.style.display = 'none';
        appBox.style.display = 'grid';
        userHeader.style.display = 'flex';
        displayName.innerText = user.email.split('@')[0]; // Lấy tên từ email
    } else {
        // Chưa login: Hiện form login, ẩn app, ẩn header
        authBox.style.display = 'block';
        appBox.style.display = 'none';
        userHeader.style.display = 'none';
    }
});

// 2. Xử lý Đăng nhập
document.getElementById('login-btn').onclick = async () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;

    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        alert("Lỗi đăng nhập: " + error.message);
    }
};

// 3. Xử lý Đăng xuất
document.getElementById('logout-btn').onclick = () => {
    if(confirm("Bạn muốn đăng xuất?")) {
        signOut(auth);
    }
};
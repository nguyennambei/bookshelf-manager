// js/auth-gate.js
(function() {
    // Nếu đã xác thực trong phiên làm việc này rồi thì không cần hỏi lại
    if (sessionStorage.getItem("is_authenticated") === "true") return;

    // Chèn HTML yêu cầu PIN vào body ngay khi trang tải xong
    document.addEventListener("DOMContentLoaded", () => {
        const modalHtml = `
            <div id="global-auth-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:#2c3e50; z-index:99999; display:flex; justify-content:center; align-items:center; color:white;">
                <div style="text-align:center;">
                    <h2>Chào mừng trở lại!</h2>
                    <p>Nhập mã PIN để mở Sổ cái tài chính:</p>
                    <input type="password" id="global-pin" maxlength="4" style="width:200px; padding:10px; font-size:24px; text-align:center; border-radius:5px; border:none;">
                    <div style="margin-top:15px;">
                        <button onclick="verifyGlobalPin()" style="padding:10px 20px; cursor:pointer; background:#27ae60; border:none; color:white; border-radius:5px; font-weight:bold;">Mở khóa</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('afterbegin', modalHtml);
    });
})();
const HASHED_PIN = "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4";
async function verifyGlobalPin() {
    const inputPin = document.getElementById("global-pin").value;
    const msgUint8 = new TextEncoder().encode(inputPin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    if (hashHex === HASHED_PIN) {
        sessionStorage.setItem("is_authenticated", "true");
        document.getElementById("global-auth-modal").style.display = "none";
    } else {
        alert("Sai mã PIN!");
        document.getElementById("global-pin").value = ""; // Xóa input sau khi sai
    }
}
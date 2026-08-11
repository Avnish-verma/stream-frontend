const API = "https://miniproject-backend-o6qi.onrender.com";

let registeredUserId = "";


// ================= REGISTER =================

async function register() {

    const fullname = document.getElementById("fullname").value;
    const userId = document.getElementById("userId").value;
    const emailId = document.getElementById("emailId").value;
    const password = document.getElementById("password").value;

    try {

        const response = await fetch(`${API}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                fullname,
                userId,
                emailId,
                password
            })
        });

        const data = await response.json();

        document.getElementById("registerMsg").textContent =
            data.message;

        if (response.ok) {

            registeredUserId = userId;

            document
                .getElementById("otpSection")
                .classList.remove("hidden");
        }

    } catch (error) {

        document.getElementById("registerMsg").textContent =
            "Server error";
    }
}


// ================= OTP =================

async function verifyOTP() {

    const otp = document.getElementById("otp").value;

    try {

        const response = await fetch(`${API}/register/verify`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId: registeredUserId,
                otp: otp
            })
        });

        const data = await response.json();

        document.getElementById("otpMsg").textContent =
            data.message;

        if (response.ok) {

            document
                .getElementById("loginSection")
                .scrollIntoView({
                    behavior: "smooth"
                });
        }

    } catch (error) {

        document.getElementById("otpMsg").textContent =
            "Server error";
    }
}


// ================= LOGIN =================

async function login() {

    const userId =
        document.getElementById("loginUserId").value;

    const password =
        document.getElementById("loginPassword").value;

    try {

        const response = await fetch(`${API}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId,
                password
            })
        });

        const data = await response.json();

        document.getElementById("loginMsg").textContent =
            data.message;

        if (response.ok && data.token) {

            localStorage.setItem("token", data.token);

            document
                .getElementById("profileSection")
                .classList.remove("hidden");

            document
                .getElementById("uploadSection")
                .classList.remove("hidden");
        }

    } catch (error) {

        document.getElementById("loginMsg").textContent =
            "Server error";
    }
}


// ================= PROFILE =================

async function getProfile() {

    const token = localStorage.getItem("token");

    if (!token) {
        alert("Please login first");
        return;
    }

    try {

        const response = await fetch(`${API}/profile`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();

        document.getElementById("profileData").textContent =
            JSON.stringify(data, null, 2);

    } catch (error) {

        document.getElementById("profileData").textContent =
            "Server error";
    }
}


// ================= FILE UPLOAD =================

async function uploadFile() {

    const fileInput =
        document.getElementById("file");

    if (!fileInput.files.length) {

        document.getElementById("uploadMsg").textContent =
            "Please select a file";

        return;
    }

    const formData = new FormData();

    formData.append("file", fileInput.files[0]);

    const token = localStorage.getItem("token");

    try {

        const response = await fetch(`${API}/upload`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();

        document.getElementById("uploadMsg").textContent =
            data.message || "Upload completed";

    } catch (error) {

        document.getElementById("uploadMsg").textContent =
            "Upload failed";
    }
}


// ================= LOGOUT =================

function logout() {

    localStorage.removeItem("token");

    document
        .getElementById("profileSection")
        .classList.add("hidden");

    document
        .getElementById("uploadSection")
        .classList.add("hidden");

    document.getElementById("profileData").textContent = "";

    alert("Logged out");
}
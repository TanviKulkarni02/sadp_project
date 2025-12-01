// =========================
// GLOBAL CONFIG
// =========================
const BASE_URL = "http://localhost:8080";

function getToken() {
    return localStorage.getItem("token");
}

function authHeader() {
    return { "Authorization": "Bearer " + getToken() };
}



// =========================
// LOGIN
// =========================
async function doLogin() {
    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;

    const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    const token = await res.text();

    if (!res.ok) {
        alert("Login failed");
        return;
    }

    localStorage.setItem("token", token);

    const payload = JSON.parse(atob(token.split(".")[1]));

    if (payload.role === "ADMIN") {
        window.location.href = "admin.html";
    } else {
        window.location.href = "institution.html";
    }
}



// =========================
// REGISTER INSTITUTION
// =========================
async function registerInstitution() {
    const body = {
        name: document.getElementById("name").value,
        type: document.getElementById("type").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        registrationNumber: document.getElementById("registrationNumber").value,
        address: document.getElementById("address").value
    };

    const res = await fetch(`${BASE_URL}/api/institutions/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    if (res.ok) {
        alert("Registered successfully. Login using email + phone.");
        window.location.href = "login.html";
    } else {
        alert("Registration failed");
    }
}



// =========================
// INSTITUTION PORTAL
// =========================

// STATUS CHECK
async function loadStatus() {
    const id = document.getElementById("instId").value;

    const res = await fetch(`${BASE_URL}/api/institutions/${id}/status`, {
        headers: authHeader()
    });

    const text = await res.text();
    document.getElementById("statusBox").innerText = text;
}


// DOCUMENT UPLOAD
async function uploadDocument() {
    const id = document.getElementById("instId").value;
    const file = document.getElementById("document").files[0];

    const form = new FormData();
    form.append("file", file);

    const res = await fetch(`${BASE_URL}/api/institutions/${id}/documents/upload`, {
        method: "POST",
        headers: authHeader(),
        body: form
    });

    if (res.ok) alert("Uploaded successfully!");
    else alert("Upload failed");
}



// =========================
// ADMIN PORTAL
// =========================

// VIEW DOCUMENTS
async function loadDocuments() {
    const id = document.getElementById("adminInstId").value;

    const res = await fetch(`${BASE_URL}/api/institutions/${id}/documents`, {
        headers: authHeader()
    });

    const docs = await res.json();

    let html = "";
    docs.forEach(d => {
        html += `<li>${d.fileName}
            <button onclick="downloadDoc(${id}, ${d.id})">Download</button>
        </li>`;
    });

    document.getElementById("docList").innerHTML = html;
}


// DOWNLOAD DOCUMENT
function downloadDoc(instId, docId) {
    window.open(`${BASE_URL}/api/institutions/${instId}/documents/${docId}?token=${getToken()}`);
}


// VERIFY INSTITUTION
async function verifyInstitution(approve) {
    const id = document.getElementById("verifyInstId").value;
    const reason = document.getElementById("reason").value;

    const res = await fetch(
        `${BASE_URL}/api/institutions/${id}/verify?approve=${approve}&reason=${reason}`,
        {
            method: "POST",
            headers: authHeader()
        }
    );

    if (res.ok) {
        alert(approve ? "Approved!" : "Rejected!");
    } else {
        alert("Failed");
    }
}

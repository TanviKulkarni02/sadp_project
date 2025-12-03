// =====================================
// CONFIG
// =====================================
const BASE = "http://localhost:8080";

function getToken() { return localStorage.getItem("token"); }
function auth() { return { "Authorization": "Bearer " + getToken() }; }


// =====================================
// LOGIN
// =====================================
async function doLogin() {
    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;

    const res = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username, password})
    });

    const token = await res.text();

    if (!res.ok) {
        alert("Invalid credentials. Redirecting to registration...");
        window.location.href = "index.html";
        return;
    }

    localStorage.setItem("token", token);

    const payload = JSON.parse(atob(token.split(".")[1]));

    if (payload.role === "ADMIN") window.location = "admin.html";
    if (payload.role === "INSTITUTION") {
        localStorage.setItem("institutionEmail", username);
        window.location = "institution.html";
    }

}



// =====================================
// REGISTER
// =====================================
async function registerInstitution() {

    const body = {
        name: document.getElementById("name").value,
        type: document.getElementById("type").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        address: document.getElementById("address").value,
        website: document.getElementById("website").value
    };

    const res = await fetch(`${BASE}/api/institutions/register`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body)
    });

    if (res.ok) {
        alert("Registered successfully! Please login.");
        window.location = "login.html";
    } else {
        alert("Registration failed.");
    }
}



// =====================================
// INSTITUTION DASHBOARD
// =====================================

// Check if documents exist without breaking backend
async function hasUploadedDocs(id) {
    try {
        const res = await fetch(`${BASE}/api/institutions/${id}/documents`, { headers: auth() });

        if (!res.ok) return false;

        const docs = await res.json();
        return docs.length > 0;
    } catch {
        return false;
    }
}



async function loadInstitutionState() {
    const id = document.getElementById("instId").value;

    resetSections();

    // 1. Check if documents uploaded
    const docsRes = await fetch(`${BASE}/api/institutions/${id}/documents`, {
        headers: auth()
    });

    let docs = [];
    if (docsRes.ok) docs = await docsRes.json();

    const docsUploaded = docs.length > 0;

    if (!docsUploaded) {
        showUploadOnly();
        return;
    }

    // 2. Get status
    const res = await fetch(`${BASE}/api/institutions/${id}/status`, {
        headers: auth()
    });

    if (!res.ok) {
        alert("Unable to fetch status");
        return;
    }

    const status = await res.text();
    document.getElementById("statusText").innerText = status;
    showStatusSection();

    // 3. Handle Rejected
    if (status === "REJECTED") {

        let instRes = await fetch(`${BASE}/api/institutions/${id}/status`, {
            headers: auth()
        });

        let fullInst = await instRes.json();

        document.getElementById("rejectReason").innerText =
            fullInst.rejectionReason || "No reason provided";
        showRejectionSection();
        showUploadOnly();
        return;
    }

    // 4. Approved
    if (status === "APPROVED") {
        showCourseSection();
    }
}




// -------------------------------------
// SHOW / HIDE SECTIONS
// -------------------------------------
function showUploadOnly() {
    document.getElementById("uploadSection").classList.remove("hidden");
}

function showStatusSection() {
    document.getElementById("statusSection").classList.remove("hidden");
}

function showRejectionSection() {
    document.getElementById("rejectionSection").classList.remove("hidden");
}

function showCourseSection() {
    document.getElementById("courseSection").classList.remove("hidden");
}



// =====================================
// DOCUMENT UPLOAD
// =====================================
async function uploadDocument() {
    const id = document.getElementById("instId").value;
    const file = document.getElementById("docFile").files[0];

    let form = new FormData();
    form.append("file", file);

    const res = await fetch(`${BASE}/api/institutions/${id}/documents/upload`, {
        method: "POST",
        headers: auth(),
        body: form
    });

    if (res.ok) {
        alert("Document uploaded successfully!");
        loadInstitutionState(); // auto reload
    } else {
        alert("Upload failed.");
    }
}





// =====================================
// ADD COURSE
// =====================================
async function addCourse() {
    const id = document.getElementById("instId").value;

    const body = {
        courseName: document.getElementById("courseName").value,
        courseDescription: document.getElementById("courseDesc").value
    };

    const res = await fetch(`${BASE}/api/institutions/${id}/courses`, {
        method: "POST",
        headers: {...auth(), "Content-Type": "application/json"},
        body: JSON.stringify(body)
    });

    if (res.ok) alert("Course added!");
    else alert("Failed to add course.");
}



// =====================================
// ADMIN SIDE
// =====================================

// Load documents for a given institution
async function loadDocuments() {
    const id = document.getElementById("adminInstId").value;

    const res = await fetch(`${BASE}/api/institutions/${id}/documents`, {
        headers: auth()
    });

    if (!res.ok) {
        alert("Error loading documents.");
        return;
    }

    const docs = await res.json();

    let html = "";
    docs.forEach(d => {
        html += `<li>${d.fileName}
                 <button onclick="downloadDoc(${id},${d.id})">Download</button>
                 </li>`;
    });

    document.getElementById("docList").innerHTML = html;
}


// Download document
function downloadDoc(id, docId) {
    window.open(`${BASE}/api/institutions/${id}/documents/${docId}?token=${getToken()}`);
}


// Approve institution
async function approveInst() {
    const id = document.getElementById("adminInstId").value;

    const res = await fetch(`${BASE}/api/institutions/${id}/verify?approve=true`, {
        method: "POST",
        headers: auth()
    });

    if (res.ok) alert("Institution approved!");
    else alert("Approval failed.");
}


// Reject institution
async function rejectInst() {
    const id = document.getElementById("adminInstId").value;
    const reason = document.getElementById("rejectReasonBox").value;

    if (!reason.trim()) {
        alert("Reason required!");
        return;
    }

    const res = await fetch(
        `${BASE}/api/institutions/${id}/verify?approve=false&reason=${encodeURIComponent(reason)}`,
        { method: "POST", headers: auth() }
    );

    if (res.ok) alert("Institution rejected.");
    else alert("Rejection failed.");
}

function resetSections() {
    document.getElementById("uploadSection").classList.add("hidden");
    document.getElementById("statusSection").classList.add("hidden");
    document.getElementById("rejectionSection").classList.add("hidden");
    document.getElementById("courseSection").classList.add("hidden");
}

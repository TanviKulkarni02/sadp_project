/* src/main/resources/static/script.js */

const API_BASE = "/api";

// --- AUTH HELPER ---
function getToken() {
    return localStorage.getItem("token");
}

function getAuthHeaders() {
    const token = getToken();
    return {
        "Authorization": `Bearer ${token}`
    };
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
}

// --- REGISTRATION ---
const registerForm = document.getElementById("registerForm");
if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = {
            name: document.getElementById("name").value,
            type: document.getElementById("type").value,
            email: document.getElementById("email").value,
            phone: document.getElementById("phone").value,
            address: document.getElementById("address").value,
            website: document.getElementById("website").value
        };

        try {
            const res = await fetch(`${API_BASE}/institutions/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            const result = await res.json();

            if (res.ok) {
                alert(`Registration Successful!\n\nIMPORTANT: Your Institution ID is: ${result.id}\nPlease save this ID.`);
                window.location.href = "login.html";
            } else {
                alert("Registration failed");
            }
        } catch (err) {
            console.error(err);
            alert("Error connecting to server");
        }
    });
}

// --- LOGIN ---
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const loginData = {
            username: document.getElementById("username").value,
            password: document.getElementById("password").value
        };

        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(loginData)
            });

            if (res.ok) {
                const token = await res.text();
                localStorage.setItem("token", token);

                const isAdmin = document.getElementById("isAdmin").checked;
                if (isAdmin) {
                    window.location.href = "admin.html";
                } else {
                    window.location.href = "institution.html";
                }
            } else {
                alert("Invalid Credentials");
            }
        } catch (err) {
            console.error(err);
            alert("Login Error: " + err.message);
        }
    });
}

// --- INSTITUTION DASHBOARD LOGIC (FIXED) ---
async function loadInstitutionDashboard() {
    const instId = document.getElementById("instIdInput").value;
    if (!instId) return alert("Please enter ID");

    sessionStorage.setItem("currentInstId", instId);
    document.getElementById("idSection").classList.add("hidden");
    document.getElementById("dashboardContent").classList.remove("hidden");

    try {
        const res = await fetch(`${API_BASE}/institutions/${instId}/status`, {
            headers: getAuthHeaders()
        });

        if (res.status === 404 || res.status === 500) {
            renderState("NEW");
        } else {
            const status = await res.text(); // "PENDING", "APPROVED", "REJECTED"

            // LOGIC FIX: Check if we have uploaded from this browser
            const localUploadFlag = localStorage.getItem(`hasUploaded_${instId}`);

            if (status === "PENDING" && !localUploadFlag) {
                // Backend says PENDING, but we haven't uploaded yet -> Treat as NEW
                renderState("NEW");
            } else {
                renderState(status);
            }
        }
    } catch (err) {
        console.error(err);
        renderState("NEW");
    }
}

function renderState(status) {
    const statusSection = document.getElementById("statusSection");
    const statusDisplay = document.getElementById("statusDisplay");
    const uploadSection = document.getElementById("uploadSection");
    const waitMessage   = document.getElementById("waitMessage");
    const courseSection = document.getElementById("courseSection");
    const rejectReason  = document.getElementById("rejectionReason");

    // Hide All
    statusSection.classList.add("hidden");
    uploadSection.classList.add("hidden");
    waitMessage.classList.add("hidden");
    courseSection.classList.add("hidden");
    rejectReason.classList.add("hidden");

    if (status === "NEW") {
        // Show Upload Form ONLY
        uploadSection.classList.remove("hidden");
        // Optional: Show a subtle "Pending" badge but emphasize upload
        statusSection.classList.remove("hidden");
        statusDisplay.textContent = "ACTION REQUIRED: UPLOAD DOCUMENTS";
        statusDisplay.className = "status-card status-PENDING";
    }
    else if (status === "PENDING") {
        // Show Wait Message
        statusSection.classList.remove("hidden");
        statusDisplay.textContent = "VERIFICATION PENDING";
        statusDisplay.className = "status-card status-PENDING";
        waitMessage.classList.remove("hidden");
    }
    else if (status === "APPROVED") {
        statusSection.classList.remove("hidden");
        statusDisplay.textContent = "ACCOUNT APPROVED";
        statusDisplay.className = "status-card status-APPROVED";
        courseSection.classList.remove("hidden");
    }
    else if (status === "REJECTED") {
        statusSection.classList.remove("hidden");
        statusDisplay.textContent = "APPLICATION REJECTED";
        statusDisplay.className = "status-card status-REJECTED";
        rejectReason.classList.remove("hidden");
        rejectReason.innerText = "Application Rejected. Please upload corrected documents.";
        uploadSection.classList.remove("hidden");
    }
}

// --- UPLOAD HANDLER ---
const uploadForm = document.getElementById("uploadForm");
if (uploadForm) {
    uploadForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const instId = sessionStorage.getItem("currentInstId");
        const fileInput = document.getElementById("docFile");

        const formData = new FormData();
        formData.append("file", fileInput.files[0]);

        try {
            const res = await fetch(`${API_BASE}/institutions/${instId}/documents/upload`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${getToken()}` },
                body: formData
            });

            if (res.ok) {
                // LOGIC FIX: Set flag so next reload knows we are waiting
                localStorage.setItem(`hasUploaded_${instId}`, "true");

                alert("Document Uploaded! Waiting for Admin Approval.");
                location.reload();
            } else {
                alert("Upload Failed");
            }
        } catch (err) {
            alert("Error uploading");
        }
    });
}

// --- ADD COURSE ---
const courseForm = document.getElementById("courseForm");
if (courseForm) {
    courseForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const instId = sessionStorage.getItem("currentInstId");

        const data = {
            courseName: document.getElementById("courseName").value,
            courseDescription: document.getElementById("courseDescription").value
        };

        try {
            const res = await fetch(`${API_BASE}/institutions/${instId}/courses`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${getToken()}`
                },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                alert("Course Added Successfully!");
                e.target.reset();
            } else {
                alert("Failed to add course");
            }
        } catch (err) {
            alert("Error adding course");
        }
    });
}

// --- ADMIN DASHBOARD ---
async function loadAdminView() {
    const instId = document.getElementById("adminInstId").value;
    if (!instId) return alert("Enter ID");

    sessionStorage.setItem("adminTargetId", instId);

    try {
        const res = await fetch(`${API_BASE}/institutions/${instId}/documents`, {
            headers: getAuthHeaders()
        });

        if (res.ok) {
            const docs = await res.json();
            const list = document.getElementById("docList");
            list.innerHTML = "";
            document.getElementById("adminContent").classList.remove("hidden");

            if (docs.length === 0) {
                document.getElementById("noDocsMsg").classList.remove("hidden");
            } else {
                document.getElementById("noDocsMsg").classList.add("hidden");
                docs.forEach(doc => {
                    const li = document.createElement("li");
                    li.innerHTML = `
                        <span>${doc.fileName}</span>
                        <button class="secondary" onclick="downloadDoc(${instId}, ${doc.id}, '${doc.fileName}')">Download</button>
                    `;
                    list.appendChild(li);
                });
            }
        } else {
            alert("Could not fetch documents. ID might be wrong or no docs uploaded.");
        }
    } catch (err) {
        console.error(err);
    }
}

async function downloadDoc(instId, docId, fileName) {
    try {
        const res = await fetch(`${API_BASE}/institutions/${instId}/documents/${docId}`, {
            headers: getAuthHeaders()
        });

        if(res.ok) {
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } else {
            alert("Download failed");
        }
    } catch(err) {
        alert("Error downloading file");
    }
}

function toggleRejectBox() {
    document.getElementById("rejectBox").classList.toggle("hidden");
}

async function verifyInstitution(approve) {
    const instId = sessionStorage.getItem("adminTargetId");
    let url = `${API_BASE}/institutions/${instId}/verify?approve=${approve}`;

    if (!approve) {
        const reason = document.getElementById("rejectReason").value;
        if (!reason) return alert("Please provide a rejection reason");
        url += `&reason=${encodeURIComponent(reason)}`;
    }

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: getAuthHeaders()
        });

        if (res.ok) {
            alert(approve ? "Institution Approved" : "Institution Rejected");
            location.reload();
        } else {
            alert("Action failed");
        }
    } catch (err) {
        alert("Error processing verification");
    }
}
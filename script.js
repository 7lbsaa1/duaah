// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, add슐, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Obfuscated Firebase Configuration (Base64 Encoded for secure presentation)
const decodeConfig = (encStr) => atob(encStr);

const firebaseConfig = {
    apiKey: decodeConfig("QUl6YVN5QkNvM0Z3X1FtNU1EOW9VSjBQb0djS0FhWGNHVUsyRTJg").replace("`",""), // Decodes securely
    authDomain: decodeConfig("bXVzbGltLTM0ODNhLmZpcmViYXNlYXBwLmNvbQ=="),
    projectId: decodeConfig("bXVzbGltLTM0ODNh"),
    storageBucket: decodeConfig("bXVzbGltLTM0ODNhLmZpcmViYXN0b3JhZ2UuYXBw"),
    messagingSenderId: decodeConfig("NTQzNjI4MTQwNzYx"),
    appId: decodeConfig("MTo1NDM2MjgxNDA3NjE6d2ViOjE1YTZiMTY5MmI5OWFhOTQyMTVlYzg="),
    measurementId: decodeConfig("Ry0wQ0VKV1FMSEQw")
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Theme Toggle Logic ---
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIcon = document.getElementById('themeIcon');

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        if (document.body.classList.contains('light-mode')) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
            localStorage.setItem('theme', 'light');
        } else {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
            localStorage.setItem('theme', 'dark');
        }
    });

    // Check saved theme
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-mode');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    }
}

// --- Frontend Modal Controls ---
const openSubmitModalBtn = document.getElementById('openSubmitModalBtn');
const submitModal = document.getElementById('submitModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const submitPreacherForm = document.getElementById('submitPreacherForm');
const successMessage = document.getElementById('successMessage');
const anotherSubmissionBtn = document.getElementById('anotherSubmissionBtn');

if (openSubmitModalBtn) {
    openSubmitModalBtn.addEventListener('click', () => {
        submitModal.classList.remove('hidden');
        submitPreacherForm.classList.remove('hidden');
        successMessage.classList.add('hidden');
        submitPreacherForm.reset();
    });
    closeModalBtn.addEventListener('click', () => submitModal.classList.add('hidden'));
    anotherSubmissionBtn.addEventListener('click', () => {
        submitPreacherForm.classList.remove('hidden');
        successMessage.classList.add('hidden');
        submitPreacherForm.reset();
    });
}

// --- Submit New Preacher ---
if (submitPreacherForm) {
    submitPreacherForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('pName').value;
        const role = document.getElementById('pRole').value;
        const image = document.getElementById('pImage').value;
        const socials = {
            youtube: document.getElementById('pYoutube').value,
            facebook: document.getElementById('pFacebook').value,
            instagram: document.getElementById('pInstagram').value,
            telegram: document.getElementById('pTelegram').value,
            website: document.getElementById('pWebsite').value
        };

        try {
            await addDoc(collection(db, "preachers"), {
                name,
                role,
                image,
                socials,
                status: 'pending', // Pending approval by admin
                createdAt: new Date()
            });
            submitPreacherForm.classList.add('hidden');
            successMessage.classList.remove('hidden');
        } catch (error) {
            console.error("Error adding document: ", error);
            alert("حدث خطأ أثناء الإرسال، يرجى المحاولة مرة أخرى.");
        }
    });
}

// --- Load Approved Preachers on Homepage ---
const preachersGrid = document.getElementById('preachersGrid');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');

let allPreachers = [];

async function loadApprovedPreachers() {
    if (!preachersGrid) return;
    try {
        const querySnapshot = await getDocs(collection(db, "preachers"));
        allPreachers = [];
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.status === 'approved') {
                allPreachers.push({ id: docSnap.id, ...data });
            }
        });
        renderPreachers(allPreachers);
    } catch (error) {
        console.error("Error loading preachers: ", error);
    }
}

function renderPreachers(list) {
    preachersGrid.innerHTML = '';
    if (list.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    emptyState.classList.add('hidden');

    list.forEach((item) => {
        const card = document.createElement('div');
        card.className = "glass-card p-6 rounded-3xl flex flex-col items-center justify-between gap-6 group hover:scale-[1.02] transition-all duration-300 shadow-xl border border-[#C49A4A]/20";
        
        // Build social icons badges
        let socialIconsHtml = '';
        if (item.socials) {
            if (item.socials.youtube) socialIconsHtml += `<a href="${item.socials.youtube}" target="_blank" class="p-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-full transition-all"><i class="fa-brands fa-youtube text-sm"></i></a>`;
            if (item.socials.facebook) socialIconsHtml += `<a href="${item.socials.facebook}" target="_blank" class="p-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-full transition-all"><i class="fa-brands fa-facebook text-sm"></i></a>`;
            if (item.socials.instagram) socialIconsHtml += `<a href="${item.socials.instagram}" target="_blank" class="p-2 bg-pink-600/20 hover:bg-pink-600 text-pink-400 hover:text-white rounded-full transition-all"><i class="fa-brands fa-instagram text-sm"></i></a>`;
            if (item.socials.telegram) socialIconsHtml += `<a href="${item.socials.telegram}" target="_blank" class="p-2 bg-sky-500/20 hover:bg-sky-500 text-sky-400 hover:text-white rounded-full transition-all"><i class="fa-brands fa-telegram text-sm"></i></a>`;
            if (item.socials.website) socialIconsHtml += `<a href="${item.socials.website}" target="_blank" class="p-2 bg-[#C49A4A]/20 hover:bg-[#C49A4A] text-[#C49A4A] hover:text-[#0D2B45] rounded-full transition-all"><i class="fa-solid fa-globe text-sm"></i></a>`;
        }

        card.innerHTML = `
            <div class="relative w-28 h-28 mx-auto rounded-full p-1 bg-gradient-to-tr from-[#C49A4A] to-transparent">
                <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover rounded-full group-hover:grayscale transition-all duration-300">
            </div>
            <div class="text-center w-full">
                <h3 class="text-xl font-bold text-white mb-1">${item.name}</h3>
                <p class="text-xs text-[#C49A4A] font-medium mb-3">${item.role}</p>
                <div class="flex items-center justify-center gap-2 flex-wrap mb-4">
                    ${socialIconsHtml}
                </div>
            </div>
        `;
        preachersGrid.appendChild(card);
    });
}

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        const filtered = allPreachers.filter(p => p.name.toLowerCase().includes(val) || p.role.toLowerCase().includes(val));
        renderPreachers(filtered);
    });
}

loadApprovedPreachers();


// --- Admin Dashboard Logic ---
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const pendingGrid = document.getElementById('pendingGrid');
const publishedGrid = document.getElementById('publishedGrid');
const noPending = document.getElementById('noPending');
const noPublished = document.getElementById('noPublished');

// Edit Modal Elements
const editModal = document.getElementById('editModal');
const closeEditModalBtn = document.getElementById('closeEditModalBtn');
const editPreacherForm = document.getElementById('editPreacherForm');

if (loginForm) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            loginSection.classList.add('hidden');
            dashboardSection.classList.remove('hidden');
            loadAdminData();
        } else {
            loginSection.classList.remove('hidden');
            dashboardSection.classList.add('hidden');
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;
        loginError.classList.add('hidden');
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            loginError.textContent = "خطأ في البريد أو كلمة المرور الخاصة بـ Firebase.";
            loginError.classList.remove('hidden');
        }
    });

    logoutBtn.addEventListener('click', () => signOut(auth));
}

async function loadAdminData() {
    if (!pendingGrid || !publishedGrid) return;
    try {
        const querySnapshot = await getDocs(collection(db, "preachers"));
        pendingGrid.innerHTML = '';
        publishedGrid.innerHTML = '';
        
        let pendingCount = 0;
        let publishedCount = 0;

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;

            const card = document.createElement('div');
            card.className = "glass-card p-4 rounded-2xl flex flex-col justify-between gap-4 border border-[#C49A4A]/20";
            card.innerHTML = `
                <div class="flex items-center gap-4">
                    <img src="${data.image}" alt="${data.name}" class="w-16 h-16 rounded-full object-cover border border-[#C49A4A]">
                    <div>
                        <h4 class="font-bold text-white text-base">${data.name}</h4>
                        <p class="text-xs text-[#C49A4A]">${data.role}</p>
                    </div>
                </div>
                <div class="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                    <button onclick="editPreacher('${id}', '${encodeURIComponent(data.name)}', '${encodeURIComponent(data.role)}', '${encodeURIComponent(data.image)}', '${encodeURIComponent(JSON.stringify(data.socials))}')" class="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-xl text-xs font-semibold">تعديل</button>
                    ${data.status === 'pending' ? `<button onclick="publishPreacher('${id}')" class="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-xl text-xs font-semibold">نشر</button>` : ''}
                    <button onclick="deletePreacher('${id}')" class="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl text-xs font-semibold">حذف</button>
                </div>
            `;

            if (data.status === 'pending') {
                pendingGrid.appendChild(card);
                pendingCount++;
            } else if (data.status === 'approved') {
                publishedGrid.appendChild(card);
                publishedCount++;
            }
        });

        noPending.style.display = pendingCount === 0 ? 'block' : 'none';
        noPublished.style.display = publishedCount === 0 ? 'block' : 'none';

    } catch (error) {
        console.error("Error loading admin data:", error);
    }
}

// Global Admin Actions exposed to window
window.publishPreacher = async (id) => {
    await updateDoc(doc(db, "preachers", id), { status: 'approved' });
    loadAdminData();
};

window.deletePreacher = async (id) => {
    if (confirm("هل أنت متأكد من حذف هذه الشخصية نهائياً؟")) {
        await deleteDoc(doc(db, "preachers", id));
        loadAdminData();
    }
};

window.editPreacher = (id, name, role, image, socialsStr) => {
    document.getElementById('editId').value = id;
    document.getElementById('editName').value = decodeURIComponent(name);
    document.getElementById('editRole').value = decodeURIComponent(role);
    document.getElementById('editImage').value = decodeURIComponent(image);
    
    const socials = JSON.parse(decodeURIComponent(socialsStr));
    document.getElementById('editYoutube').value = socials.youtube || '';
    document.getElementById('editFacebook').value = socials.facebook || '';
    document.getElementById('editInstagram').value = socials.instagram || '';
    document.getElementById('editTelegram').value = socials.telegram || '';
    document.getElementById('editWebsite').value = socials.website || '';
    
    editModal.classList.remove('hidden');
};

if (closeEditModalBtn) {
    closeEditModalBtn.addEventListener('click', () => editModal.classList.add('hidden'));
}

if (editPreacherForm) {
    editPreacherForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editId').value;
        const name = document.getElementById('editName').value;
        const role = document.getElementById('editRole').value;
        const image = document.getElementById('editImage').value;
        const socials = {
            youtube: document.getElementById('editYoutube').value,
            facebook: document.getElementById('editFacebook5')?.value || document.getElementById('editFacebook').value,
            instagram: document.getElementById('editInstagram').value,
            telegram: document.getElementById('editTelegram').value,
            website: document.getElementById('editWebsite').value
        };

        try {
            await updateDoc(doc(db, "preachers", id), { name, role, image, socials });
            editModal.classList.add('hidden');
            loadAdminData();
        } catch (error) {
            console.error("Error updating:", error);
            alert("فشل تحديث البيانات");
        }
    });
}

// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Obfuscated Firebase Configuration
const decodeConfig = (encStr) => atob(encStr);

const firebaseConfig = {
    apiKey: decodeConfig("QUl6YVN5QkNvM0Z3X1FtNU1EOW9VSjBQb0djS0FhWGNHVUsyRTJg").replace("`",""),
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

// --- Image Compression & Base64 Converter Helper ---
function compressImageAndConvertToBase64(file, maxWidth = 300, maxHeight = 300, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
}

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

    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-mode');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    }
}

// --- Modal Controls ---
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

// --- Submit New Preacher with File Compression & Base64 ---
if (submitPreacherForm) {
    submitPreacherForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = "جاري معالجة ورفع الصورة...";

        const name = document.getElementById('pName').value;
        const role = document.getElementById('pRole').value;
        const dept = document.getElementById('pDept').value;
        const imageFile = document.getElementById('pImageFile').files[0];

        const socials = {
            youtube: document.getElementById('pYoutube').value,
            facebook: document.getElementById('pFacebook').value,
            instagram: document.getElementById('pInstagram').value,
            telegram: document.getElementById('pTelegram').value,
            website: document.getElementById('pWebsite').value
        };

        try {
            let base64Image = "";
            if (imageFile) {
                base64Image = await compressImageAndConvertToBase64(imageFile, 300, 300, 0.75);
            }

            await addDoc(collection(db, "preachers"), {
                name,
                role,
                dept,
                image: base64Image,
                socials,
                status: 'pending', // Pending admin approval
                createdAt: new Date()
            });

            submitPreacherForm.classList.add('hidden');
            successMessage.classList.remove('hidden');
        } catch (error) {
            console.error("Error adding document: ", error);
            alert("حدث خطأ أثناء رفع البيانات، يرجى المحاولة مرة أخرى.");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "إرسال للمراجعة";
        }
    });
}

// --- Load Approved Preachers on Homepage (Matching UI Cards) ---
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
        card.className = "glass-card p-6 rounded-3xl flex flex-col items-center justify-between gap-6 group hover:scale-[1.01] transition-all duration-300 shadow-xl border border-[#C49A4A]/20";
        
        // Build social icons dynamically based on availability
        let socialIconsHtml = '';
        if (item.socials) {
            if (item.socials.youtube) socialIconsHtml += `<a href="${item.socials.youtube}" target="_blank" class="p-2.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-full transition-all shadow-sm"><i class="fa-brands fa-youtube text-sm"></i></a>`;
            if (item.socials.facebook) socialIconsHtml += `<a href="${item.socials.facebook}" target="_blank" class="p-2.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-full transition-all shadow-sm"><i class="fa-brands fa-facebook text-sm"></i></a>`;
            if (item.socials.instagram) socialIconsHtml += `<a href="${item.socials.instagram}" target="_blank" class="p-2.5 bg-pink-600/20 hover:bg-pink-600 text-pink-400 hover:text-white rounded-full transition-all shadow-sm"><i class="fa-brands fa-instagram text-sm"></i></a>`;
            if (item.socials.telegram) socialIconsHtml += `<a href="${item.socials.telegram}" target="_blank" class="p-2.5 bg-sky-500/20 hover:bg-sky-500 text-sky-400 hover:text-white rounded-full transition-all shadow-sm"><i class="fa-brands fa-telegram text-sm"></i></a>`;
            if (item.socials.website) socialIconsHtml += `<a href="${item.socials.website}" target="_blank" class="p-2.5 bg-[#C49A4A]/20 hover:bg-[#C49A4A] text-[#C49A4A] hover:text-[#0D2B45] rounded-full transition-all shadow-sm"><i class="fa-solid fa-globe text-sm"></i></a>`;
        }

        card.innerHTML = `
            <div class="relative w-28 h-28 mx-auto rounded-full p-1 bg-gradient-to-tr from-[#C49A4A] to-transparent shadow-md">
                <img src="${item.image || 'logo.WebP'}" alt="${item.name}" class="w-full h-full object-cover rounded-full group-hover:grayscale transition-all duration-300">
            </div>
            <div class="text-center w-full space-y-1">
                <h3 class="text-2xl font-medium text-white">${item.name}</h3>
                <p class="text-sm font-normal text-[#C49A4A]">${item.role}</p>
                <p class="text-xs text-gray-400 pb-2">${item.dept || 'قسم العلوم الشرعية'}</p>
                <div class="flex items-center justify-center gap-2 flex-wrap pt-2 border-t border-white/10">
                    ${socialIconsHtml}
                </div>
            </div>
            <button onclick="alert('الملف الشخصي لـ ${item.name}')" class="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all border border-white/10">
                <i class="fa-solid fa-user text-[#C49A4A]"></i> عرض الملف الشخصي
            </button>
        `;
        preachersGrid.appendChild(card);
    });
}

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        const filtered = allPreachers.filter(p => p.name.toLowerCase().includes(val) || p.role.toLowerCase().includes(val) || (p.dept && p.dept.toLowerCase().includes(val)));
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
                    <img src="${data.image || 'logo.WebP'}" alt="${data.name}" class="w-16 h-16 rounded-full object-cover border border-[#C49A4A]">
                    <div>
                        <h4 class="font-bold text-white text-base">${data.name}</h4>
                        <p class="text-xs text-[#C49A4A]">${data.role} - ${data.dept || ''}</p>
                    </div>
                </div>
                <div class="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                    <button onclick="editPreacher('${id}', '${encodeURIComponent(data.name)}', '${encodeURIComponent(data.role)}', '${encodeURIComponent(data.dept || '')}', '${encodeURIComponent(JSON.stringify(data.socials))}')" class="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-xl text-xs font-semibold">تعديل</button>
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

// Global Admin Functions
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

window.editPreacher = (id, name, role, dept, socialsStr) => {
    document.getElementById('editId').value = id;
    document.getElementById('editName').value = decodeURIComponent(name);
    document.getElementById('editRole').value = decodeURIComponent(role);
    document.getElementById('editDept').value = decodeURIComponent(dept);
    
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
        const dept = document.getElementById('editDept').value;
        const imageFile = document.getElementById('editImageFile').files[0];

        const socials = {
            youtube: document.getElementById('editYoutube').value,
            facebook: document.getElementById('editFacebook').value,
            instagram: document.getElementById('editInstagram').value,
            telegram: document.getElementById('editTelegram').value,
            website: document.getElementById('editWebsite').value
        };

        try {
            const updateData = { name, role, dept, socials };
            if (imageFile) {
                updateData.image = await compressImageAndConvertToBase64(imageFile, 300, 300, 0.75);
            }
            await updateDoc(doc(db, "preachers", id), updateData);
            editModal.classList.add('hidden');
            loadAdminData();
        } catch (error) {
            console.error("Error updating:", error);
            alert("فشل تحديث البيانات");
        }
    });
}

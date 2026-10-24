// Pantalla de carga
function hideOverlay() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        setTimeout(() => {
            loadingOverlay.classList.add('hidden');
        }, 1500);
    }
}

if (document.readyState === 'complete') {
    hideOverlay();
} else {
    window.addEventListener('load', hideOverlay);
}

// Firebase Configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyDr4_MoqZEUsbSwlOaKtteNvcGvGU7zhZE",
    authDomain: "stock-inventario-b84ea.firebaseapp.com",
    projectId: "stock-inventario-b84ea",
    storageBucket: "stock-inventario-b84ea.firebasestorage.app",
    messagingSenderId: "706223379754",
    appId: "1:706223379754:web:91621483424e5744447a53"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// Variable de estado para alternar entre Login y Registro
let isSignUpMode = false;

// 1. Alternar entre Registrarse e Iniciar Sesión
window.toggleAuthMode = function(e) {
    if (e) e.preventDefault();
    isSignUpMode = !isSignUpMode;

    const authSubmitBtn = document.getElementById('authSubmitBtn');
    const toggleLink = document.getElementById('toggleAuthModeLink');
    const authTitle = document.getElementById('authTitle');

    if (isSignUpMode) {
        if (authTitle) authTitle.textContent = 'Crear Cuenta';
        if (authSubmitBtn) authSubmitBtn.textContent = 'Registrarse';
        if (toggleLink) toggleLink.textContent = '¿Ya tienes cuenta? Inicia sesión';
    } else {
        if (authTitle) authTitle.textContent = 'Sistema de Gestión';
        if (authSubmitBtn) authSubmitBtn.textContent = 'Iniciar Sesión';
        if (toggleLink) toggleLink.textContent = '¿No tienes cuenta? Regístrate';
    }
};
// ==========================================
// CONTROL DE TIEMPO DE SESIÓN
// ==========================================
let sessionTimerInterval = null;

function startSessionTimer() {
    let sessionStart = sessionStorage.getItem('sessionStartTime');
    
    // Si no existe hora de inicio guardada, se toma la actual
    if (!sessionStart) {
        sessionStart = new Date().toISOString();
        sessionStorage.setItem('sessionStartTime', sessionStart);
    }

    const startDate = new Date(sessionStart);
    
    // Mostrar la fecha y hora de inicio formateada (DD/MM/AAAA HH:mm)
    const startElem = document.getElementById('sessionStartTime');
    if (startElem) {
        const dia = String(startDate.getDate()).padStart(2, '0');
        const mes = String(startDate.getMonth() + 1).padStart(2, '0');
        const hora = String(startDate.getHours()).padStart(2, '0');
        const min = String(startDate.getMinutes()).padStart(2, '0');
        startElem.innerHTML = `🕒 <strong>Inicio:</strong> ${dia}/${mes} ${hora}:${min}`;
    }

    const container = document.getElementById('sessionInfoContainer');
    if (container) container.style.display = 'inline-flex';

    // Actualizar el cronómetro cada segundo
    if (sessionTimerInterval) clearInterval(sessionTimerInterval);
    sessionTimerInterval = setInterval(() => {
        const now = new Date();
        const diffSeconds = Math.floor((now - startDate) / 1000);

        if (diffSeconds >= 0) {
            const h = String(Math.floor(diffSeconds / 3600)).padStart(2, '0');
            const m = String(Math.floor((diffSeconds % 3600) / 60)).padStart(2, '0');
            const s = String(diffSeconds % 60).padStart(2, '0');

            const elapsedElem = document.getElementById('sessionElapsedTime');
            if (elapsedElem) {
                elapsedElem.innerHTML = `⏱️ <strong>Activo:</strong> ${h}:${m}:${s}`;
            }
        }
    }, 1000);
}

function stopSessionTimer() {
    if (sessionTimerInterval) {
        clearInterval(sessionTimerInterval);
        sessionTimerInterval = null;
    }
    sessionStorage.removeItem('sessionStartTime');
    const container = document.getElementById('sessionInfoContainer');
    if (container) container.style.display = 'none';
}
// 2. Procesar el formulario (Login o Registro según corresponda)
window.handleAuth = async function(e) {
    if (e) e.preventDefault();

    const emailInput = document.getElementById('authEmail');
    const passwordInput = document.getElementById('authPassword');
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';

    if (!email || !password) {
        showAlert('Por favor, ingresa tu correo y contraseña', 'error');
        return;
    }

    try {
        if (isSignUpMode) {
            // REGISTRO MODULAR
            await createUserWithEmailAndPassword(auth, email, password);
            showAlert('¡Cuenta creada con éxito! Bienvenido', 'success');
        } else {
            // INICIO DE SESIÓN MODULAR
            await signInWithEmailAndPassword(auth, email, password);
            showAlert('Sesión iniciada correctamente', 'success');
        }
    } catch (error) {
        console.error('Error de Firebase Auth:', error.code, error.message);
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                showAlert('Ese correo ya está registrado. Cambia a "Iniciar sesión".', 'error');
                break;
            case 'auth/invalid-credential':
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                showAlert('Correo o contraseña incorrectos.', 'error');
                break;
            case 'auth/weak-password':
                showAlert('La contraseña debe tener un mínimo de 6 caracteres.', 'error');
                break;
            case 'auth/invalid-email':
                showAlert('El formato de correo no es válido.', 'error');
                break;
            case 'auth/operation-not-allowed':
                showAlert('Habilita Email/Password en la consola de Firebase.', 'error');
                break;
            default:
                showAlert(error.message, 'error');
        }
    }
};

// 3. Recuperar contraseña
window.resetPassword = async function(e) {
    if (e) e.preventDefault();
    const email = document.getElementById('authEmail').value.trim();
    if (!email) {
        showAlert('Ingresa tu correo en el campo superior primero', 'error');
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        showAlert('Correo de restablecimiento enviado. Revisa tu casilla.', 'success');
    } catch (error) {
        showAlert('No se pudo enviar el correo: ' + error.message, 'error');
    }
};

// 4. Cerrar sesión
window.logout = async function() {
    try {
        await signOut(auth);
        showAlert('Sesión cerrada', 'success');
    } catch (error) {
        showAlert('Error al salir: ' + error.message, 'error');
    }
};

// Variables Globales
let categories = [];
let products = [];
let sales = [];
let cart = [];
let currentEditingProduct = null;
let currentEditingCategory = null;
let currentUser = null;
let isLoggedIn = false;
let backupInterval = null;
let priceUpdatePreview = [];

// Formateador de moneda (separador de miles y coma decimal)
function formatMoney(amount) {
    const num = Number(amount) || 0;
    return num.toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', function() {
    showLoading(true);
    checkAuthState();
    const barcodeInput = document.getElementById('saleBarcodeScanInput');
    if (barcodeInput) {
        barcodeInput.addEventListener('keyup', handleBarcodeScan);
    }
});

// Autenticación
function checkAuthState() {
    onAuthStateChanged(auth, (user) => {
        showLoading(false);
        if (user) {
            currentUser = user;
            isLoggedIn = true;
            document.getElementById('userEmail').textContent = user.email;
            showMainApp();
            loadUserData();
            startAutoBackup();
            startSessionTimer();
            loadSavedLogo();
            loadSavedLogo();
        } else {
            currentUser = null;
            isLoggedIn = false;
            showLoginScreen();
            stopSessionTimer();
        }
    });
}

function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
}

function showMainApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
}

function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.style.display = show ? 'block' : 'none';
}

window.toggleAuthMode = function() {
    const loginBtn = document.getElementById('loginBtn');
    const switchText = document.querySelector('.login-switch');

    if (loginBtn.textContent === 'Iniciar Sesión') {
        loginBtn.textContent = 'Registrarse';
        switchText.textContent = '¿Ya tienes cuenta? Inicia sesión';
    } else {
        loginBtn.textContent = 'Iniciar Sesión';
        switchText.textContent = '¿No tienes cuenta? Regístrate';
    }
};

window.resetPassword = async function() {
    const email = document.getElementById('loginEmail').value;
    if (!email) {
        showAlert('Por favor, ingrese su email primero', 'error');
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        showAlert('Email de recuperación enviado correctamente', 'success');
    } catch (error) {
        showAlert('Error al enviar email de recuperación: ' + error.message, 'error');
    }
};

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const loginBtn = document.getElementById('loginBtn');
    const isRegister = loginBtn.textContent === 'Registrarse';

    if (!email || !password) {
        showAlert('Por favor, complete todos los campos', 'error');
        return;
    }

    showLoading(true);
    loginBtn.disabled = true;

    try {
        if (isRegister) {
            await createUserWithEmailAndPassword(auth, email, password);
            showAlert('Cuenta creada exitosamente', 'success');
        } else {
            await signInWithEmailAndPassword(auth, email, password);
            showAlert('Sesión iniciada correctamente', 'success');
        }
    } catch (error) {
        let errorMessage = 'Error en la autenticación';
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'Usuario no encontrado';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Contraseña incorrecta';
        } else if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'El email ya está en uso';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'La contraseña debe tener al menos 6 caracteres';
        }
        showAlert(errorMessage, 'error');
    } finally {
        showLoading(false);
        loginBtn.disabled = false;
    }
});

window.logout = async function() {
    try {
        stopSessionTimer(); // <--- AGREGAR ACÁ
        await signOut(auth);
        showAlert('Sesión cerrada', 'success');
    } catch (error) {
        showAlert('Error al salir: ' + error.message, 'error');
    }
};

// Sincronización Firebase
async function saveToFirebase(collectionName, data) {
    if (!currentUser) return false;

    try {
        setSyncStatus('pending');
        await setDoc(doc(db, 'users', currentUser.uid, collectionName, 'data'), {
            data: data,
            lastUpdated: new Date().toISOString()
        });
        setSyncStatus('success');
        return true;
    } catch (error) {
        console.error('Error saving to Firebase:', error);
        setSyncStatus('error');
        return false;
    }
}

async function loadFromFirebase(collectionName) {
    if (!currentUser) return null;

    try {
        const docRef = doc(db, 'users', currentUser.uid, collectionName, 'data');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data().data || [];
        }
        return [];
    } catch (error) {
        console.error('Error loading from Firebase:', error);
        return null;
    }
}

async function loadUserData() {
    try {
        showLoading(true);

        const loadedCategories = await loadFromFirebase('categories');
        const loadedProducts = await loadFromFirebase('products');
        const loadedSales = await loadFromFirebase('sales');

        if (loadedCategories !== null) categories = loadedCategories;
        if (loadedProducts !== null) products = loadedProducts;
        if (loadedSales !== null) sales = loadedSales;

        updateAllData();
        showAlert('Datos sincronizados correctamente', 'success');
    } catch (error) {
        showAlert('Error al cargar datos del usuario', 'error');
    } finally {
        showLoading(false);
    }
}

async function saveAllData() {
    if (!currentUser) return;

    const promises = [
        saveToFirebase('categories', categories),
        saveToFirebase('products', products),
        saveToFirebase('sales', sales)
    ];

    try {
        await Promise.all(promises);
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

function setSyncStatus(status) {
    const syncElement = document.getElementById('syncStatus');
    if (!syncElement) return;
    syncElement.className = 'sync-status';

    switch (status) {
        case 'success':
            syncElement.textContent = 'Sincronizado';
            syncElement.classList.add('sync-success');
            break;
        case 'error':
            syncElement.textContent = 'Error';
            syncElement.classList.add('sync-error');
            break;
        case 'pending':
            syncElement.textContent = 'Sincronizando...';
            syncElement.classList.add('sync-pending');
            break;
    }
}

// Backup automático
function startAutoBackup() {
    const interval = parseInt(localStorage.getItem('backupInterval') || '12');
    if (backupInterval) clearInterval(backupInterval);

    backupInterval = setInterval(() => {
        if (isLoggedIn) {
            autoBackup();
        }
    }, interval * 60 * 60 * 1000);
}

function stopAutoBackup() {
    if (backupInterval) {
        clearInterval(backupInterval);
        backupInterval = null;
    }
}

async function autoBackup() {
    try {
        await saveAllData();
        await saveBackupRecord('automatic', 'success');
    } catch (error) {
        await saveBackupRecord('automatic', 'error');
        console.error('Auto backup failed:', error);
    }
}

window.manualBackup = async function() {
    if (!currentUser) {
        showAlert('Debe iniciar sesión para realizar backups', 'error');
        return;
    }

    showLoading(true);
    try {
        await saveAllData();
        await saveBackupRecord('manual', 'success');
        showAlert('Backup manual completado exitosamente', 'success');
    } catch (error) {
        await saveBackupRecord('manual', 'error');
        showAlert('Error al realizar backup manual', 'error');
    } finally {
        showLoading(false);
    }
};

async function saveBackupRecord(type, status) {
    if (!currentUser) return;

    try {
        const backupRecord = {
            date: new Date().toISOString(),
            type: type,
            status: status,
            dataCount: {
                categories: categories.length,
                products: products.length,
                sales: sales.length
            }
        };

        await setDoc(doc(db, 'users', currentUser.uid, 'backups', Date.now().toString()), backupRecord);
        updateBackupHistory();
    } catch (error) {
        console.error('Error saving backup record:', error);
    }
}

async function updateBackupHistory() {
    if (!currentUser) return;

    try {
        const querySnapshot = await getDocs(collection(db, 'users', currentUser.uid, 'backups'));
        const backups = [];
        querySnapshot.forEach((doc) => {
            backups.push({ id: doc.id, ...doc.data() });
        });

        backups.sort((a, b) => new Date(b.date) - new Date(a.date));
        displayBackupHistory(backups.slice(0, 10));
    } catch (error) {
        console.error('Error loading backup history:', error);
    }
}

function displayBackupHistory(backups) {
    const tbody = document.getElementById('backupHistoryTableBody');
    if (!tbody) return;

    if (backups.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #666;">No hay backups registrados</td></tr>';
        return;
    }

    tbody.innerHTML = backups.map(backup => {
        const date = new Date(backup.date).toLocaleString('es-AR');
        const statusClass = backup.status === 'success' ? 'profit-positive' : 'profit-negative';
        const typeText = backup.type === 'automatic' ? '⏰ Automático' : '👤 Manual';
        const statusText = backup.status === 'success' ? '✅ Exitoso' : '❌ Error';

        return `
            <tr>
                <td>${date}</td>
                <td>${typeText}</td>
                <td class="${statusClass}">${statusText}</td>
                <td>
                    <button class="btn btn-info btn-small" onclick="restoreBackup('${backup.id}')" title="Restaurar">📥</button>
                </td>
            </tr>
        `;
    }).join('');
}

window.restoreFromFirebase = async function() {
    if (!currentUser) {
        showAlert('Debe iniciar sesión para restaurar datos', 'error');
        return;
    }

    if (!confirm('¿Está seguro de que desea restaurar los datos desde Firebase? Esto reemplazará todos los datos actuales.')) {
        return;
    }

    showLoading(true);
    try {
        await loadUserData();
        showAlert('Datos restaurados exitosamente desde Firebase', 'success');
    } catch (error) {
        showAlert('Error al restaurar datos desde Firebase', 'error');
    } finally {
        showLoading(false);
    }
};

window.saveBackupSettings = function() {
    const interval = document.getElementById('backupInterval').value;
    localStorage.setItem('backupInterval', interval);
    startAutoBackup();
    showAlert('Configuración de backup guardada', 'success');
};

function clearLocalData() {
    categories = [];
    products = [];
    sales = [];
    cart = [];
    currentEditingProduct = null;
    currentEditingCategory = null;
}

// Navegación con soporte de menús desplegables
window.showSection = function(sectionName) {
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
    document.querySelectorAll('.nav-tab, .nav-dropdown-btn, .dropdown-item').forEach(el => el.classList.remove('active'));

    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    const targetItem = document.querySelector(`[data-section="${sectionName}"]`);
    if (targetItem) {
        targetItem.classList.add('active');
        const parentDropdown = targetItem.closest('.nav-dropdown');
        if (parentDropdown) {
            const dropdownBtn = parentDropdown.querySelector('.nav-dropdown-btn');
            if (dropdownBtn) dropdownBtn.classList.add('active');
        }
    }

    updateSectionData(sectionName);
};

function updateSectionData(sectionName) {
    switch (sectionName) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'categories':
            updateCategoriesTable();
            break;
        case 'products':
            updateProductsTable();
            updateProductCategories();
            break;
        case 'sales':
            updateSaleProducts();
            updateSalesHistoryTable();
            const scanInput = document.getElementById('saleBarcodeScanInput');
            if (scanInput) scanInput.focus();
            break;
        case 'reports':
            updateReports();
            break;
        case 'settings':
            loadBusinessInfo();
            updateBackupHistory();
            break;
    }
}

// Categorías
window.addCategory = async function() {
    const name = document.getElementById('categoryName').value.trim();
    const description = document.getElementById('categoryDescription').value.trim();

    if (!name) {
        showAlert('Por favor, ingrese el nombre de la categoría', 'error');
        return;
    }

    if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        showAlert('Ya existe una categoría con ese nombre', 'error');
        return;
    }

    const category = {
        id: Date.now().toString(),
        name,
        description,
        createdAt: new Date().toISOString()
    };

    categories.push(category);
    clearCategoryForm();
    updateCategoriesTable();
    updateProductCategories();
    updateDashboard();
    await saveToFirebase('categories', categories);
    showAlert('Categoría agregada correctamente', 'success');
};

window.updateCategory = async function() {
    if (!currentEditingCategory) return;

    const name = document.getElementById('categoryName').value.trim();
    const description = document.getElementById('categoryDescription').value.trim();

    if (!name) {
        showAlert('Por favor, ingrese el nombre de la categoría', 'error');
        return;
    }

    if (categories.some(c => c.name.toLowerCase() === name.toLowerCase() && c.id !== currentEditingCategory)) {
        showAlert('Ya existe otra categoría con ese nombre', 'error');
        return;
    }

    const categoryIndex = categories.findIndex(c => c.id === currentEditingCategory);
    if (categoryIndex === -1) return;

    const updatedCategory = { 
        ...categories[categoryIndex],
        name,
        description,
        updatedAt: new Date().toISOString()
    };

    categories[categoryIndex] = updatedCategory;

    products.forEach(product => {
        if (product.categoryId === currentEditingCategory) {
            product.categoryName = name;
        }
    });

    clearCategoryForm();
    updateCategoriesTable();
    updateProductCategories();
    updateProductsTable();
    await saveToFirebase('categories', categories);
    await saveToFirebase('products', products);
    showAlert('Categoría actualizada correctamente', 'success');
};

window.editCategory = function(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    document.getElementById('categoryName').value = category.name;
    document.getElementById('categoryDescription').value = category.description || '';
    currentEditingCategory = categoryId;

    document.getElementById('updateCategoryBtn').style.display = 'inline-flex';
    document.querySelector('#categories .btn-primary').style.display = 'none';
    document.getElementById('categories').scrollIntoView({ behavior: 'smooth' });
};

window.deleteCategory = async function(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const categoryProducts = products.filter(p => p.categoryId === categoryId);
    if (categoryProducts.length > 0) {
        showAlert(`No se puede eliminar la categoría "${category.name}" porque tiene ${categoryProducts.length} producto(s) asociado(s)`, 'error');
        return;
    }

    if (!confirm(`¿Está seguro de que desea eliminar la categoría "${category.name}"?`)) return;
    window.deleteCategory = async function(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const categoryProducts = products.filter(p => p.categoryId === categoryId);
    if (categoryProducts.length > 0) {
        showAlert(`No se puede eliminar la categoría "${category.name}" porque tiene ${categoryProducts.length} producto(s) asociado(s)`, 'error');
        return;
    }

    if (!confirm(`¿Está seguro de que desea eliminar la categoría "${category.name}"?`)) return;

    categories = categories.filter(c => c.id !== categoryId);
    if (typeof updateCategoriesTable === 'function') updateCategoriesTable();
    if (typeof updateProductCategories === 'function') updateProductCategories();
    if (typeof updateDashboard === 'function') updateDashboard();
    if (typeof saveToFirebase === 'function') {
        await saveToFirebase('categories', categories);
    }
    showAlert('Categoría eliminada correctamente', 'success');
};

// Función para evitar el error de logo en la línea 233
function loadSavedLogo() {
    const savedLogo = localStorage.getItem('pos_custom_logo');
    if (savedLogo) {
        const logoImg = document.getElementById('businessLogo');
        if (logoImg) logoImg.src = savedLogo;
    }
}
window.loadSavedLogo = loadSavedLogo;

// Función para eliminar producto
window.deleteProduct = async function(productId, e) {
    if (e && e.preventDefault) e.preventDefault();
    if (window.event) window.event.preventDefault();

    const product = products.find(p => p.id == productId);
    const productName = product ? product.name : 'este producto';

    if (!confirm(`¿Está seguro de que desea eliminar "${productName}"?`)) {
        return;
    }

    products = products.filter(p => p.id != productId);

    localStorage.setItem('products', JSON.stringify(products));

    if (typeof saveToFirebase === 'function') {
        await saveToFirebase('products', products);
    }

    if (typeof updateProductsTable === 'function') {
        updateProductsTable();
    } else if (typeof renderProducts === 'function') {
        renderProducts();
    }

    if (typeof updateDashboard === 'function') {
        updateDashboard();
    }

    if (typeof showAlert === 'function') {
        showAlert('Producto eliminado correctamente', 'success');
    }

    // 4. Notificación visual
    showAlert('Producto eliminado correctamente', 'success');
}
window.deleteProduct = deleteProduct;

    categories = categories.filter(c => c.id !== categoryId);
    updateCategoriesTable();
    updateProductCategories();
    updateDashboard();
    await saveToFirebase('categories', categories);
    showAlert('Categoría eliminada correctamente', 'success');
};

window.clearCategoryForm = function() {
    document.getElementById('categoryName').value = '';
    document.getElementById('categoryDescription').value = '';
    currentEditingCategory = null;
    document.getElementById('updateCategoryBtn').style.display = 'none';
    document.querySelector('#categories .btn-primary').style.display = 'inline-flex';
};

window.searchCategories = function() {
    const searchTerm = document.getElementById('categorySearch').value.toLowerCase();
    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm) ||
        (category.description && category.description.toLowerCase().includes(searchTerm))
    );
    updateCategoriesTable(filteredCategories);
};

function updateCategoriesTable(categoriesToShow = categories) {
    const tbody = document.getElementById('categoriesTableBody');
    if (!tbody) return;
    if (categoriesToShow.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #666;">No hay categorías registradas</td></tr>';
        return;
    }
    tbody.innerHTML = categoriesToShow.map(category => {
        const productCount = products.filter(p => p.categoryId === category.id).length;
        const createdDate = new Date(category.createdAt).toLocaleDateString('es-AR');
        return `
            <tr>
                <td><strong>${category.name}</strong></td>
                <td>${category.description || '-'}</td>
                <td><span class="category-tag">${productCount} productos</span></td>
                <td>${createdDate}</td>
                <td class="product-actions">
                    <button class="btn btn-warning btn-small" onclick="editCategory('${category.id}')" title="Editar">✏️</button>
                    <button class="btn btn-danger btn-small" onclick="deleteCategory('${category.id}')" title="Eliminar">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Productos
function updateProductCategories() {
    const selects = [document.getElementById('productCategory'), document.getElementById('priceUpdateCategory')];
    selects.forEach(select => {
        if (!select) return;
        const currentValue = select.value;
        select.innerHTML = select.id === 'priceUpdateCategory' ?
            '<option value="">Todas las categorías</option>' :
            '<option value="">Seleccionar categoría...</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            select.appendChild(option);
        });
        if (currentValue && categories.find(c => c.id === currentValue)) {
            select.value = currentValue;
        }
    });
}

window.addProduct = async function() {
    const name = document.getElementById('productName').value.trim();
    const code = document.getElementById('productCode').value.trim();
    let barcode = document.getElementById('productBarcode').value.trim();
    const categoryId = document.getElementById('productCategory').value;
    const costPrice = parseFloat(document.getElementById('productCostPrice').value);
    const price = parseFloat(document.getElementById('productPrice').value);
    const stock = parseInt(document.getElementById('productStock').value);
    const minStock = parseInt(document.getElementById('productMinStock').value) || 5;
    const description = document.getElementById('productDescription').value.trim();

    if (!name || !code || !categoryId || isNaN(costPrice) || isNaN(price) || isNaN(stock)) {
        showAlert('Por favor, complete todos los campos obligatorios (*)', 'error');
        return;
    }
    if (costPrice < 0 || price < 0 || stock < 0) {
        showAlert('Los valores no pueden ser negativos', 'error');
        return;
    }
    if (price <= costPrice && !confirm('El precio de venta es menor o igual al precio de costo. ¿Continuar?')) {
        return;
    }
    if (products.some(p => p.code.toLowerCase() === code.toLowerCase())) {
        showAlert('Ya existe un producto con ese código', 'error');
        return;
    }
    if (barcode && products.some(p => p.barcode === barcode)) {
        showAlert('Ya existe un producto con ese código de barras', 'error');
        return;
    }
    if (!barcode) {
        barcode = generateUniqueBarcode();
    }

    const category = categories.find(c => c.id === categoryId);
    const product = {
        id: Date.now().toString(), name, code: code.toUpperCase(), barcode, categoryId,
        categoryName: category.name, costPrice, price, stock, minStock, description,
        createdAt: new Date().toISOString()
    };

    products.push(product);
    clearProductForm();
    updateProductsTable();
    updateSaleProducts();
    updateDashboard();
    await saveToFirebase('products', products);
    showAlert('Producto agregado correctamente', 'success');
};

window.updateProduct = async function() {
    if (!currentEditingProduct) return;
    const name = document.getElementById('productName').value.trim();
    const code = document.getElementById('productCode').value.trim();
    const barcode = document.getElementById('productBarcode').value.trim();
    const categoryId = document.getElementById('productCategory').value;
    const costPrice = parseFloat(document.getElementById('productCostPrice').value);
    const price = parseFloat(document.getElementById('productPrice').value);
    const stock = parseInt(document.getElementById('productStock').value);
    const minStock = parseInt(document.getElementById('productMinStock').value) || 5;
    const description = document.getElementById('productDescription').value.trim();

    if (!name || !code || !categoryId || isNaN(costPrice) || isNaN(price) || isNaN(stock)) {
        showAlert('Por favor, complete todos los campos obligatorios (*)', 'error');
        return;
    }
    if (costPrice < 0 || price < 0 || stock < 0) {
        showAlert('Los valores no pueden ser negativos', 'error');
        return;
    }
    if (products.some(p => p.code.toLowerCase() === code.toLowerCase() && p.id !== currentEditingProduct)) {
        showAlert('Ya existe otro producto con ese código', 'error');
        return;
    }
    if (barcode && products.some(p => p.barcode === barcode && p.id !== currentEditingProduct)) {
        showAlert('Ya existe otro producto con ese código de barras', 'error');
        return;
    }

    const productIndex = products.findIndex(p => p.id === currentEditingProduct);
    if (productIndex === -1) return;

    const category = categories.find(c => c.id === categoryId);
    const updatedProduct = {
        ...products[productIndex], name, code: code.toUpperCase(), barcode: barcode || products[productIndex].barcode,
        categoryId, categoryName: category.name, costPrice, price, stock, minStock, description,
        updatedAt: new Date().toISOString()
    };

    products[productIndex] = updatedProduct;
    clearProductForm();
    updateProductsTable();
    updateSaleProducts();
    updateDashboard();
    await saveToFirebase('products', products);
    showAlert('Producto actualizado correctamente', 'success');
};

window.editProduct = function(productId) {
    // 1. Busca el producto asegurando coincidencia de texto y número
    const product = products.find(p => String(p.id) === String(productId));
    if (!product) {
        showAlert('Producto no encontrado', 'error');
        return;
    }

    // 2. Si estás en Dashboard, cambia automáticamente a la pestaña de Productos
    if (typeof showSection === 'function') {
        showSection('products');
    }

    // 3. Cargar los datos del producto en el formulario
    document.getElementById('productName').value = product.name;
    document.getElementById('productCode').value = product.code;
    document.getElementById('productBarcode').value = product.barcode || '';
    document.getElementById('productCategory').value = product.categoryId;
    document.getElementById('productCostPrice').value = product.costPrice;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productStock').value = product.stock;
    document.getElementById('productMinStock').value = product.minStock;
    document.getElementById('productDescription').value = product.description || '';

    currentEditingProduct = product.id;
    document.getElementById('productFormTitle').textContent = `✏️ Editando: ${product.name}`;
    document.getElementById('updateProductBtn').style.display = 'inline-flex';
    document.getElementById('addProductBtn').style.display = 'none';

    // 4. Desplaza la pantalla automáticamente hacia arriba para ver el formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 5. Pone el foco directamente en el campo de Stock
    setTimeout(() => {
        const stockInput = document.getElementById('productStock');
        if (stockInput) {
            stockInput.focus();
            stockInput.select();
        }
    }, 200);
};

window.updateProduct = async function() {
    if (!currentEditingProduct) return;
    const name = document.getElementById('productName').value.trim();
    const code = document.getElementById('productCode').value.trim();
    const barcode = document.getElementById('productBarcode').value.trim();
    const categoryId = document.getElementById('productCategory').value;
    const costPrice = parseFloat(document.getElementById('productCostPrice').value);
    const price = parseFloat(document.getElementById('productPrice').value);
    const stock = parseInt(document.getElementById('productStock').value);
    const minStock = parseInt(document.getElementById('productMinStock').value) || 5;
    const description = document.getElementById('productDescription').value.trim();

    if (!name || !code || !categoryId || isNaN(costPrice) || isNaN(price) || isNaN(stock)) {
        showAlert('Por favor, complete todos los campos obligatorios (*)', 'error');
        return;
    }
    if (costPrice < 0 || price < 0 || stock < 0) {
        showAlert('Los valores no pueden ser negativos', 'error');
        return;
    }
    if (products.some(p => p.code.toLowerCase() === code.toLowerCase() && String(p.id) !== String(currentEditingProduct))) {
        showAlert('Ya existe otro producto con ese código', 'error');
        return;
    }
    if (barcode && products.some(p => p.barcode === barcode && String(p.id) !== String(currentEditingProduct))) {
        showAlert('Ya existe otro producto con ese código de barras', 'error');
        return;
    }

    const productIndex = products.findIndex(p => String(p.id) === String(currentEditingProduct));
    if (productIndex === -1) return;

    const category = categories.find(c => String(c.id) === String(categoryId));
    const updatedProduct = {
        ...products[productIndex], name, code: code.toUpperCase(), barcode: barcode || products[productIndex].barcode,
        categoryId, categoryName: category ? category.name : 'Sin categoría', costPrice, price, stock, minStock, description,
        updatedAt: new Date().toISOString()
    };

    products[productIndex] = updatedProduct;
    clearProductForm();
    updateProductsTable();
    updateSaleProducts();
    updateDashboard();
    await saveToFirebase('products', products);
    showAlert('Producto actualizado correctamente', 'success');
};

window.clearProductForm = function() {
    document.getElementById('productName').value = '';
    document.getElementById('productCode').value = '';
    document.getElementById('productBarcode').value = '';
    document.getElementById('productCategory').value = '';
    document.getElementById('productCostPrice').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productStock').value = '';
    document.getElementById('productMinStock').value = '';
    document.getElementById('productDescription').value = '';

    currentEditingProduct = null;
    document.getElementById('productFormTitle').textContent = 'Agregar Nuevo Producto';
    document.getElementById('updateProductBtn').style.display = 'none';
    document.getElementById('addProductBtn').style.display = 'inline-flex';
};

window.searchProducts = function() {
    const searchTerm = document.getElementById('productSearch').value.toLowerCase();
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.code.toLowerCase().includes(searchTerm) ||
        product.categoryName.toLowerCase().includes(searchTerm) ||
        (product.barcode && product.barcode.includes(searchTerm))
    );
    updateProductsTable(filteredProducts);
};

function updateProductsTable(productsToShow = products) {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    if (productsToShow.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; color: #666;">No hay productos registrados</td></tr>';
        return;
    }
    tbody.innerHTML = productsToShow.map(product => {
        const stockStatus = getStockStatus(product);
        const rowClass = stockStatus === 'Sin stock' ? 'out-of-stock' : (stockStatus === 'Stock bajo' ? 'low-stock' : '');
        const margin = product.price > 0 ? ((product.price - product.costPrice) / product.price * 100).toFixed(1) : 0;
        const marginClass = margin > 0 ? 'profit-positive' : 'profit-negative';

        return `
            <tr class="${rowClass}">
                <td><strong>${product.code}</strong></td>
                <td>${product.name}</td>
                <td><span class="category-tag">${product.categoryName}</span></td>
                <td>$${formatMoney(product.costPrice)}</td>
                <td>$${formatMoney(product.price)}</td>
                <td class="${marginClass}">${margin}%</td>
                <td><strong>${product.stock}</strong></td>
                <td style="font-family: monospace; font-size: 12px;">${product.barcode || '-'}</td>
                <td><span class="status-badge">${stockStatus}</span></td>
                <td class="product-actions">
                    <button class="btn btn-warning btn-small" onclick="editProduct('${product.id}')" title="Editar">✏️</button>
                    <button class="btn btn-danger btn-small" onclick="deleteProduct('${product.id}')" title="Eliminar">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');
}

function getStockStatus(product) {
    if (product.stock === 0) return 'Sin stock';
    if (product.stock <= product.minStock) return 'Stock bajo';
    return 'Disponible';
}

function generateUniqueBarcode() {
    let barcode;
    do {
        barcode = '200' + Math.floor(1000000000 + Math.random() * 9000000000).toString();
    } while (products.some(p => p.barcode === barcode));
    return barcode;
}

// Escáner de Barras
function handleBarcodeScan(event) {
    if (event.key === 'Enter') {
        const barcodeInput = event.target;
        const barcode = barcodeInput.value.trim();
        if (!barcode) return;

        const product = products.find(p => p.barcode === barcode);
        if (product) {
            addProductToCartByBarcode(product);
        } else {
            showAlert(`Producto con código "${barcode}" no encontrado.`, 'error');
        }
        barcodeInput.value = '';
    }
}

function addProductToCartByBarcode(product) {
    if (product.stock <= 0) {
        showAlert(`Stock insuficiente para "${product.name}".`, 'error');
        return;
    }
    const existingItem = cart.find(item => item.productId === product.id);
    const quantityToAdd = 1;
    if (existingItem) {
        if (existingItem.quantity + quantityToAdd > product.stock) {
            showAlert(`Stock insuficiente. Ya tiene ${existingItem.quantity} en el carrito.`, 'error');
            return;
        }
        existingItem.quantity += quantityToAdd;
        existingItem.subtotal = existingItem.quantity * existingItem.price;
        existingItem.profit = existingItem.quantity * (existingItem.price - existingItem.costPrice);
    } else {
        cart.push({
            productId: product.id,
            productName: product.name,
            quantity: quantityToAdd,
            price: product.price,
            costPrice: product.costPrice,
            subtotal: quantityToAdd * product.price,
            profit: quantityToAdd * (product.price - product.costPrice)
        });
    }
    updateCartTable();
    showAlert(`"${product.name}" agregado al carrito.`, 'success');
}

// Actualización Masiva de Precios
window.showPriceUpdateModal = function() {
    updateProductCategories();
    document.getElementById('priceUpdateModal').style.display = 'block';
};
window.closePriceUpdateModal = function() {
    document.getElementById('priceUpdateModal').style.display = 'none';
    document.getElementById('pricePreviewContainer').style.display = 'none';
    document.getElementById('applyPriceBtn').disabled = true;
    priceUpdatePreview = [];
};
window.previewPriceUpdate = function() {
    const categoryId = document.getElementById('priceUpdateCategory').value;
    const updateType = document.getElementById('priceUpdateType').value;
    const updateValue = parseFloat(document.getElementById('priceUpdateValue').value);
    if (isNaN(updateValue) || updateValue === 0) {
        showAlert('Por favor, ingrese un valor válido', 'error');
        return;
    }
    let productsToUpdate = categoryId ? products.filter(p => p.categoryId === categoryId) : products;
    if (productsToUpdate.length === 0) {
        showAlert('No hay productos para actualizar', 'error');
        return;
    }
    priceUpdatePreview = productsToUpdate.map(product => {
        let newPrice = updateType === 'percentage' ? product.price * (1 + updateValue / 100) : product.price + updateValue;
        if (newPrice < 0) newPrice = 0;
        const change = newPrice - product.price;
        const changePercentage = product.price > 0 ? (change / product.price * 100) : 0;
        return { id: product.id, name: product.name, currentPrice: product.price, newPrice, change, changePercentage };
    });
    displayPricePreview();
    document.getElementById('pricePreviewContainer').style.display = 'block';
    document.getElementById('applyPriceBtn').disabled = false;
};

function displayPricePreview() {
    const tbody = document.getElementById('pricePreviewBody');
    tbody.innerHTML = priceUpdatePreview.map(item => {
        const changeClass = item.change >= 0 ? 'profit-positive' : 'profit-negative';
        const changeText = item.change >= 0 ? '+' : '';
        return `
            <tr class="price-change">
                <td>${item.name}</td>
                <td>$${formatMoney(item.currentPrice)}</td>
                <td>$${formatMoney(item.newPrice)}</td>
                <td class="${changeClass}">
                    ${changeText}$${formatMoney(item.change)} (${changeText}${item.changePercentage.toFixed(1)}%)
                </td>
            </tr>
        `;
    }).join('');
}

window.applyPriceUpdate = async function() {
    if (priceUpdatePreview.length === 0 || !confirm(`¿Está seguro de que desea actualizar los precios de ${priceUpdatePreview.length} productos?`)) {
        return;
    }
    showLoading(true);
    try {
        priceUpdatePreview.forEach(item => {
            const productIndex = products.findIndex(p => p.id === item.id);
            if (productIndex !== -1) {
                products[productIndex].price = item.newPrice;
                products[productIndex].priceUpdatedAt = new Date().toISOString();
            }
        });
        await saveToFirebase('products', products);
        updateProductsTable();
        updateSaleProducts();
        closePriceUpdateModal();
        showAlert(`Precios actualizados correctamente para ${priceUpdatePreview.length} productos`, 'success');
    } catch (error) {
        showAlert('Error al actualizar precios', 'error');
    } finally {
        showLoading(false);
    }
};

// Generación de Etiquetas
window.showBarcodeLabelsModal = function() {
    const modal = document.getElementById('barcodeLabelsModal');
    const productsList = document.getElementById('labelProductsList');
    productsList.innerHTML = products
        .filter(p => p.barcode)
        .map(product => `
            <label style="display: block; margin-bottom: 8px; cursor: pointer;">
                <input type="checkbox" value="${product.id}" style="margin-right: 8px;">
                ${product.name} (${product.code}) - $${formatMoney(product.price)}
            </label>
        `).join('');
    modal.style.display = 'block';
};
window.closeBarcodeLabelsModal = function() {
    document.getElementById('barcodeLabelsModal').style.display = 'none';
};
window.generateBarcodeLabels = function() {
    const checkboxes = document.querySelectorAll('#labelProductsList input[type="checkbox"]:checked');
    const selectedProducts = Array.from(checkboxes).map(cb => products.find(p => p.id === cb.value)).filter(Boolean);
    if (selectedProducts.length === 0) {
        showAlert('Por favor, seleccione al menos un producto', 'error');
        return;
    }
    const labelSize = document.getElementById('labelSize').value;
    const labelsPerRow = parseInt(document.getElementById('labelsPerRow').value);
    const printWindow = window.open('', '_blank', 'height=600,width=800');
    printWindow.document.write(createLabelHTML(selectedProducts, labelSize, labelsPerRow));
    printWindow.document.close();
    printWindow.onload = function() {
        selectedProducts.forEach(product => {
            if (product.barcode) {
                const svgElement = printWindow.document.getElementById(`barcode-${product.id}`);
                if (svgElement) {
                    JsBarcode(svgElement, product.barcode, {
                        format: "CODE128", displayValue: true, fontSize: 14, height: 30, margin: 5
                    });
                }
            }
        });
        setTimeout(() => printWindow.print(), 500);
    };
    showAlert(`Generando ${selectedProducts.length} etiquetas para impresión`, 'success');
    closeBarcodeLabelsModal();
};

function createLabelHTML(products, labelSize, labelsPerRow) {
    const sizeConfig = {
        small: { width: '4cm', height: '2cm', fontSize: '8px' },
        medium: { width: '6cm', height: '3cm', fontSize: '10px' },
        large: { width: '8cm', height: '4cm', fontSize: '12px' }
    };
    const config = sizeConfig[labelSize];
    const labelWidth = 100 / labelsPerRow;
    const labelsHTML = products.map(product => {
        if (!product.barcode) return '';
        return `
            <div class="label">
                <div class="product-name">${product.name}</div>
                <svg id="barcode-${product.id}"></svg>
                <div class="product-price">$${formatMoney(product.price)}</div>
            </div>
        `;
    }).join('');
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Etiquetas de Códigos de Barras</title>
            <style>
                @page { margin: 0.5cm; }
                body { font-family: sans-serif; margin: 0; }
                .label-container { display: flex; flex-wrap: wrap; }
                .label { 
                    width: ${labelWidth}%; height: ${config.height}; border: 1px dotted #ccc; 
                    padding: 5px; box-sizing: border-box; text-align: center; 
                    display: flex; flex-direction: column; justify-content: space-around;
                    font-size: ${config.fontSize}; overflow: hidden;
                }
                .label svg { width: 100%; height: auto; max-height: 50%; }
                .product-name { font-weight: bold; margin-bottom: 2px; line-height: 1.1; }
                .product-price { font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="label-container">${labelsHTML}</div>
        </body>
        </html>
    `;
}

// Ventas
window.selectProduct = function() {
    const productId = document.getElementById('saleProduct').value;
    const product = products.find(p => p.id === productId);
    if (product) {
        document.getElementById('salePrice').value = product.price;
        document.getElementById('saleQuantity').value = 1;
        document.getElementById('saleQuantity').max = product.stock;
        updateSaleSubtotal();
    } else {
        document.getElementById('salePrice').value = '';
        document.getElementById('saleQuantity').value = '';
        document.getElementById('saleSubtotal').value = '';
    }
};
window.updateSaleSubtotal = function() {
    const quantity = parseInt(document.getElementById('saleQuantity').value) || 0;
    const price = parseFloat(document.getElementById('salePrice').value) || 0;
    document.getElementById('saleSubtotal').value = (quantity * price).toFixed(2);
};
window.addToSale = function() {
    const productId = document.getElementById('saleProduct').value;
    const quantity = parseInt(document.getElementById('saleQuantity').value);
    const price = parseFloat(document.getElementById('salePrice').value);
    if (!productId || !quantity || !price || quantity <= 0) {
        showAlert('Por favor, complete todos los campos de venta', 'error');
        return;
    }
    const product = products.find(p => p.id === productId);
    if (!product) {
        showAlert('Producto no encontrado', 'error');
        return;
    }
    if (quantity > product.stock) {
        showAlert(`Stock insuficiente. Disponible: ${product.stock}`, 'error');
        return;
    }
    const existingItem = cart.find(item => item.productId === productId);
    if (existingItem) {
        if (existingItem.quantity + quantity > product.stock) {
            showAlert(`Stock insuficiente. Ya tiene ${existingItem.quantity} en el carrito`, 'error');
            return;
        }
        existingItem.quantity += quantity;
        existingItem.subtotal = existingItem.quantity * existingItem.price;
        existingItem.profit = existingItem.quantity * (existingItem.price - existingItem.costPrice);
    } else {
        cart.push({
            productId, productName: product.name, quantity, price, costPrice: product.costPrice,
            subtotal: quantity * price, profit: quantity * (price - product.costPrice)
        });
    }
    updateCartTable();
    clearSaleForm();
    showAlert('Producto agregado al carrito', 'success');
};
window.quickSale = function() {
    addToSale();
    if (cart.length > 0) {
        setTimeout(() => completeSale(), 100);
    }
};
window.removeFromCart = function(index) {
    cart.splice(index, 1);
    updateCartTable();
};

function updateCartTable() {
    const tbody = document.getElementById('cartTableBody');
    const totalElement = document.getElementById('saleTotal');
    const totalCostElement = document.getElementById('totalCost');
    const totalProfitElement = document.getElementById('totalProfit');
    const completeSaleBtn = document.getElementById('completeSaleBtn');
    if (!tbody) return;

    if (cart.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666;">Carrito vacío</td></tr>';
        totalElement.textContent = '0,00';
        totalCostElement.textContent = '0,00';
        totalProfitElement.textContent = '0,00';
        completeSaleBtn.disabled = true;
        return;
    }

    const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const totalCost = cart.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0);
    const totalProfit = cart.reduce((sum, item) => sum + item.profit, 0);

    tbody.innerHTML = cart.map((item, index) => `
        <tr>
            <td>${item.productName}</td>
            <td>${item.quantity}</td>
            <td>$${formatMoney(item.price)}</td>
            <td>$${formatMoney(item.subtotal)}</td>
            <td class="${item.profit >= 0 ? 'profit-positive' : 'profit-negative'}">$${formatMoney(item.profit)}</td>
            <td><button class="btn btn-danger btn-small" onclick="removeFromCart(${index})" title="Eliminar">🗑️</button></td>
        </tr>
    `).join('');

    totalElement.textContent = formatMoney(total);
    totalCostElement.textContent = formatMoney(totalCost);
    totalProfitElement.textContent = formatMoney(totalProfit);
    totalProfitElement.className = totalProfit >= 0 ? 'profit-positive' : 'profit-negative';
    completeSaleBtn.disabled = false;
}

window.completeSale = async function() {
    if (cart.length === 0) {
        showAlert('El carrito está vacío', 'error');
        return;
    }

    const customerInput = document.getElementById('customerName');
    const customerName = (customerInput ? customerInput.value.trim() : '') || 'Cliente Anónimo';

    const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const totalCost = cart.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0);
    const totalProfit = cart.reduce((sum, item) => sum + item.profit, 0);

    const sale = {
        id: Date.now().toString(), 
        customerName, 
        items: [...cart], 
        total, 
        totalCost, 
        totalProfit,
        date: new Date().toISOString(), 
        timestamp: Date.now()
    };

    sales.push(sale);
    cart.forEach(item => {
        const productIndex = products.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
            products[productIndex].stock -= item.quantity;
        }
    });

    clearCart();
    updateProductsTable();
    updateSalesHistoryTable();
    updateDashboard();

    const barcodeInput = document.getElementById('saleBarcodeScanInput');
    if (barcodeInput) barcodeInput.focus();

    await saveToFirebase('sales', sales);
    await saveToFirebase('products', products);
    showAlert(`Venta completada por $${formatMoney(total)} - Ganancia: $${formatMoney(totalProfit)}`, 'success');
};

window.clearCart = function() {
    cart = [];
    updateCartTable();
    clearSaleForm();
    const customerInput = document.getElementById('customerName');
    if (customerInput) customerInput.value = '';
};

function clearSaleForm() {
    document.getElementById('saleProduct').value = '';
    document.getElementById('saleQuantity').value = '';
    document.getElementById('salePrice').value = '';
    document.getElementById('saleSubtotal').value = '';
    const barcodeInput = document.getElementById('saleBarcodeScanInput');
    if (barcodeInput) barcodeInput.focus();
}

function updateSaleProducts() {
    const select = document.getElementById('saleProduct');
    if (!select) return;
    const currentValue = select.value;
    select.innerHTML = '<option value="">Seleccionar producto...</option>';
    products.filter(p => p.stock > 0).forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.name} - $${formatMoney(product.price)} (Stock: ${product.stock})`;
        select.appendChild(option);
    });
    if (currentValue && products.find(p => p.id === currentValue && p.stock > 0)) {
        select.value = currentValue;
    }
}

function updateSalesHistoryTable() {
    const tbody = document.getElementById('salesHistoryTableBody');
    if (!tbody) return;
    if (sales.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #666;">No hay ventas registradas</td></tr>';
        return;
    }
    const sortedSales = [...sales].sort((a, b) => new Date(b.date) - new Date(a.date));
    tbody.innerHTML = sortedSales.slice(0, 50).map(sale => {
        const date = new Date(sale.date).toLocaleString('es-AR');
        const itemsCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);
        const profitClass = sale.totalProfit >= 0 ? 'profit-positive' : 'profit-negative';
        return `
            <tr>
                <td>${date}</td>
                <td><strong>${sale.customerName}</strong></td>
                <td>${itemsCount} productos</td>
                <td>$${formatMoney(sale.totalCost)}</td>
                <td class="${profitClass}">$${formatMoney(sale.totalProfit)}</td>
                <td><strong>$${formatMoney(sale.total)}</strong></td>
                <td><button class="btn btn-primary btn-small" onclick="showSaleDetail('${sale.id}')" title="Ver detalle">👁️</button></td>
            </tr>
        `;
    }).join('');
}

window.showSaleDetail = function(saleId) {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;
    const modal = document.getElementById('saleDetailModal');
    const content = document.getElementById('saleDetailContent');
    const date = new Date(sale.date).toLocaleString('es-AR');

    content.innerHTML = `
        <div style="margin-bottom: 15px;">
            <p><strong>Fecha:</strong> ${date}</p>
            <p><strong>Cliente:</strong> ${sale.customerName}</p>
            <p><strong>Costo Total:</strong> $${formatMoney(sale.totalCost)}</p>
            <p class="${sale.totalProfit >= 0 ? 'profit-positive' : 'profit-negative'}"><strong>Ganancia:</strong> $${formatMoney(sale.totalProfit)}</p>
            <p style="font-size: 1.1em; margin-top: 5px;"><strong>Total Venta:</strong> $${formatMoney(sale.total)}</p>
        </div>

        <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
            <button class="btn btn-primary" onclick="printInvoicePDF('${sale.id}')">
                <span>📄</span> Descargar Factura PDF
            </button>
            <button class="btn btn-success" onclick="sendInvoiceWhatsApp('${sale.id}')">
                <span>💬</span> Enviar por WhatsApp
            </button>
        </div>

        <h3>Productos:</h3>
        <table style="width: 100%; margin-top: 10px;">
            <thead>
                <tr style="background: #f7fafc;">
                    <th style="padding: 8px;">Producto</th>
                    <th style="padding: 8px;">Cantidad</th>
                    <th style="padding: 8px;">P. Costo</th>
                    <th style="padding: 8px;">P. Venta</th>
                    <th style="padding: 8px;">Ganancia</th>
                    <th style="padding: 8px;">Subtotal</th>
                </tr>
            </thead>
            <tbody>
            ${sale.items.map(item => `
                <tr>
                    <td style="padding: 8px;">${item.productName}</td>
                    <td style="padding: 8px;">${item.quantity}</td>
                    <td style="padding: 8px;">$${formatMoney(item.costPrice)}</td>
                    <td style="padding: 8px;">$${formatMoney(item.price)}</td>
                    <td style="padding: 8px;" class="${item.profit >= 0 ? 'profit-positive' : 'profit-negative'}">$${formatMoney(item.profit)}</td>
                    <td style="padding: 8px;">$${formatMoney(item.subtotal)}</td>
                </tr>
            `).join('')}
            </tbody>
        </table>
    `;
    modal.style.display = 'block';
};

window.closeSaleDetail = function() {
    document.getElementById('saleDetailModal').style.display = 'none';
};

// Generador e impresión de Factura en PDF
window.printInvoicePDF = function(saleId) {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;

    const bName = localStorage.getItem('businessName') || 'Mi Negocio';
    const bAddress = localStorage.getItem('businessAddress') || '';
    const bPhone = localStorage.getItem('businessPhone') || '';
    const bEmail = localStorage.getItem('businessEmail') || '';
    const date = new Date(sale.date).toLocaleString('es-AR');

    const invoiceHTML = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Factura_${sale.id}</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    padding: 30px;
                    color: #1e293b;
                    max-width: 750px;
                    margin: 0 auto;
                }
                .invoice-header {
                    display: flex;
                    justify-content: space-between;
                    border-bottom: 2px solid #2563eb;
                    padding-bottom: 20px;
                    margin-bottom: 25px;
                }
                .business-info h1 {
                    margin: 0 0 5px 0;
                    color: #2563eb;
                    font-size: 24px;
                }
                .business-info p {
                    margin: 2px 0;
                    font-size: 13px;
                    color: #64748b;
                }
                .invoice-details {
                    text-align: right;
                }
                .invoice-details h2 {
                    margin: 0 0 5px 0;
                    font-size: 20px;
                    color: #0f172a;
                }
                .invoice-details p {
                    margin: 3px 0;
                    font-size: 13px;
                }
                .client-box {
                    background: #f8fafc;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 25px;
                    border: 1px solid #e2e8f0;
                }
                .client-box p {
                    margin: 0;
                    font-size: 14px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 25px;
                }
                th {
                    background: #f1f5f9;
                    text-align: left;
                    padding: 10px;
                    font-size: 13px;
                    color: #475569;
                    border-bottom: 1px solid #cbd5e1;
                }
                td {
                    padding: 12px 10px;
                    border-bottom: 1px solid #e2e8f0;
                    font-size: 14px;
                }
                .text-right {
                    text-align: right;
                }
                .text-center {
                    text-align: center;
                }
                .total-section {
                    display: flex;
                    justify-content: flex-end;
                }
                .total-card {
                    width: 250px;
                    background: #eff6ff;
                    border: 1px solid #bfdbfe;
                    padding: 15px;
                    border-radius: 8px;
                    text-align: right;
                }
                .total-card h3 {
                    margin: 0;
                    color: #1e40af;
                    font-size: 18px;
                }
                .footer {
                    margin-top: 40px;
                    text-align: center;
                    font-size: 12px;
                    color: #94a3b8;
                    border-top: 1px dashed #cbd5e1;
                    padding-top: 15px;
                }
                @media print {
                    body { padding: 0; }
                    @page { margin: 1.5cm; }
                }
            </style>
        </head>
        <body>
            <div class="invoice-header">
                <div class="business-info">
                    <h1>${bName}</h1>
                    ${bAddress ? `<p>📍 ${bAddress}</p>` : ''}
                    ${bPhone ? `<p>📞 ${bPhone}</p>` : ''}
                    ${bEmail ? `<p>✉️ ${bEmail}</p>` : ''}
                </div>
                <div class="invoice-details">
                    <h2>COMPROBANTE DE VENTA</h2>
                    <p><strong>N°:</strong> #${sale.id.slice(-6)}</p>
                    <p><strong>Fecha:</strong> ${date}</p>
                </div>
            </div>

            <div class="client-box">
                <p><strong>Cliente:</strong> ${sale.customerName}</p>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Descripción</th>
                        <th class="text-center">Cant.</th>
                        <th class="text-right">Precio Unit.</th>
                        <th class="text-right">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${sale.items.map(item => `
                        <tr>
                            <td>${item.productName}</td>
                            <td class="text-center">${item.quantity}</td>
                            <td class="text-right">$${formatMoney(item.price)}</td>
                            <td class="text-right">$${formatMoney(item.subtotal)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="total-section">
                <div class="total-card">
                    <p style="margin: 0 0 5px 0; color: #64748b; font-size: 13px;">Total a Pagar:</p>
                    <h3>$${formatMoney(sale.total)}</h3>
                </div>
            </div>

            <div class="footer">
                <p>¡Gracias por su compra!</p>
            </div>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank', 'height=700,width=850');
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    printWindow.onload = function() {
        setTimeout(() => {
            printWindow.print();
        }, 300);
    };
};

// Envío rápido por WhatsApp
window.sendInvoiceWhatsApp = function(saleId) {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;

    const bName = localStorage.getItem('businessName') || 'Mi Negocio';
    const date = new Date(sale.date).toLocaleString('es-AR');

    let msg = `*COMPROBANTE DE COMPRA - ${bName}*\n`;
    msg += `*N° Comprobante:* #${sale.id.slice(-6)}\n`;
    msg += `*Fecha:* ${date}\n`;
    msg += `*Cliente:* ${sale.customerName}\n`;
    msg += `--------------------------------\n`;
    msg += `*DETALLE DE PRODUCTOS:*\n`;

    sale.items.forEach(item => {
        msg += `• ${item.quantity}x ${item.productName} - $${formatMoney(item.subtotal)}\n`;
    });

    msg += `--------------------------------\n`;
    msg += `*TOTAL: $${formatMoney(sale.total)}*\n\n`;
    msg += `¡Muchas gracias por su compra!`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
};

// Dashboard y Reportes
function updateDashboard() {
    document.getElementById('totalProducts').textContent = products.length;
    document.getElementById('totalCategories').textContent = categories.length;
    const lowStockItems = products.filter(p => p.stock <= p.minStock);
    document.getElementById('lowStockItems').textContent = lowStockItems.length;

    const today = new Date().toDateString();
    const todaySales = sales.filter(s => new Date(s.date).toDateString() === today);
    const dayTotal = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    document.getElementById('totalSales').textContent = `$${formatMoney(dayTotal)}`;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlySales = sales.filter(s => {
        const saleDate = new Date(s.date);
        return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
    });
    const monthlyTotal = monthlySales.reduce((sum, sale) => sum + sale.total, 0);
    const monthlyProfit = monthlySales.reduce((sum, sale) => sum + sale.totalProfit, 0);

    document.getElementById('monthlySales').textContent = `$${formatMoney(monthlyTotal)}`;
    document.getElementById('monthlyProfit').textContent = `$${formatMoney(monthlyProfit)}`;
    document.getElementById('monthlyProfit').className = monthlyProfit >= 0 ? 'stat-value profit-positive' : 'stat-value profit-negative';
    updateLowStockTable(lowStockItems);
}

// Reabastecimiento rápido con ventana emergente
window.reabastecerProduct = async function(productId) {
    const product = products.find(p => String(p.id) === String(productId));
    if (!product) return;

    const respuesta = prompt(`📦 REABASTECER: "${product.name}"\nStock actual: ${product.stock}\n\n¿Cuántas unidades nuevas ingresaron?`);
    if (respuesta === null || respuesta.trim() === '') return;

    const cantidad = parseInt(respuesta);
    if (isNaN(cantidad) || cantidad <= 0) {
        showAlert('Por favor, ingresa un número mayor a 0', 'error');
        return;
    }

    product.stock = (parseInt(product.stock) || 0) + cantidad;
    product.updatedAt = new Date().toISOString();

    await saveToFirebase('products', products);
    updateAllData();
    showAlert(`✅ Se sumaron ${cantidad} unidades a "${product.name}". Nuevo stock: ${product.stock}`, 'success');
};

function updateLowStockTable(lowStockItems) {
    const tbody = document.getElementById('lowStockTableBody');
    if (!tbody) return;
    if (lowStockItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666;">No hay productos con stock bajo</td></tr>';
        return;
    }
    tbody.innerHTML = lowStockItems.map(product => `
        <tr class="low-stock">
            <td><strong>${product.name}</strong></td>
            <td><span class="category-tag">${product.categoryName}</span></td>
            <td><strong>${product.stock}</strong></td>
            <td>${product.minStock}</td>
            <td style="font-family: monospace; font-size: 12px;">${product.barcode || '-'}</td>
            <td>
                <button class="btn btn-warning btn-small" onclick="reabastecerProduct('${product.id}')" title="Reabastecer">📦 Reabastecer</button>
            </td>
        </tr>
    `).join('');
}

function updateReports() {
    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalProfit = sales.reduce((sum, sale) => sum + sale.totalProfit, 0);
    const totalProductsSold = sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
    const avgSale = sales.length > 0 ? totalSales / sales.length : 0;
    const profitMargin = totalSales > 0 ? (totalProfit / totalSales * 100) : 0;

    document.getElementById('reportTotalSales').textContent = `$${formatMoney(totalSales)}`;
    document.getElementById('reportTotalProfit').textContent = `$${formatMoney(totalProfit)}`;
    document.getElementById('reportTotalProducts').textContent = totalProductsSold;
    document.getElementById('reportAvgSale').textContent = `$${formatMoney(avgSale)}`;
    document.getElementById('reportProfitMargin').textContent = `${profitMargin.toFixed(1)}%`;

    const productSales = {};
    sales.forEach(sale => {
        sale.items.forEach(item => {
            if (!productSales[item.productId]) {
                productSales[item.productId] = { name: item.productName, quantity: 0, revenue: 0, cost: 0, profit: 0 };
            }
            productSales[item.productId].quantity += item.quantity;
            productSales[item.productId].revenue += item.subtotal;
            productSales[item.productId].cost += (item.quantity * item.costPrice);
            productSales[item.productId].profit += item.profit;
        });
    });

    const sortedProducts = Object.values(productSales).sort((a, b) => b.quantity - a.quantity);
    document.getElementById('reportTopProduct').textContent = sortedProducts.length > 0 ? sortedProducts[0].name : '-';
    updateTopProductsTable(sortedProducts, totalSales);
    updateCategoryProfitTable();
}

function updateTopProductsTable(sortedProducts, totalSales) {
    const tbody = document.getElementById('topProductsTableBody');
    if (!tbody) return;
    if (sortedProducts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #666;">No hay datos de ventas</td></tr>';
        return;
    }
    tbody.innerHTML = sortedProducts.slice(0, 10).map(product => {
        const percentage = totalSales > 0 ? (product.revenue / totalSales * 100).toFixed(1) : '0';
        const margin = product.revenue > 0 ? (product.profit / product.revenue * 100).toFixed(1) : '0';
        return `
            <tr>
                <td><strong>${product.name}</strong></td><td>${product.quantity}</td><td>$${formatMoney(product.cost)}</td>
                <td>$${formatMoney(product.revenue)}</td><td class="${product.profit >= 0 ? 'profit-positive' : 'profit-negative'}">$${formatMoney(product.profit)}</td>
                <td>${margin}%</td><td>${percentage}%</td>
            </tr>
        `;
    }).join('');
}

function updateCategoryProfitTable() {
    const tbody = document.getElementById('categoryProfitTableBody');
    if (!tbody) return;
    const categoryProfits = {};
    sales.forEach(sale => {
        sale.items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            const categoryName = product ? product.categoryName : 'Sin categoría';
            if (!categoryProfits[categoryName]) {
                categoryProfits[categoryName] = { quantity: 0, revenue: 0, cost: 0, profit: 0 };
            }
            categoryProfits[categoryName].quantity += item.quantity;
            categoryProfits[categoryName].revenue += item.subtotal;
            categoryProfits[categoryName].cost += (item.quantity * item.costPrice);
            categoryProfits[categoryName].profit += item.profit;
        });
    });
    const sortedCategories = Object.entries(categoryProfits).sort(([, a], [, b]) => b.profit - a.profit);
    if (sortedCategories.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666;">No hay datos de ventas</td></tr>';
        return;
    }
    tbody.innerHTML = sortedCategories.map(([categoryName, data]) => {
        const margin = data.revenue > 0 ? (data.profit / data.revenue * 100).toFixed(1) : '0';
        return `
            <tr>
                <td><span class="category-tag">${categoryName}</span></td><td>${data.quantity}</td>
                <td>$${formatMoney(data.cost)}</td><td>$${formatMoney(data.revenue)}</td>
                <td class="${data.profit >= 0 ? 'profit-positive' : 'profit-negative'}">$${formatMoney(data.profit)}</td>
                <td>${margin}%</td>
            </tr>
        `;
    }).join('');
}

// Configuración y Exportaciones
function loadBusinessInfo() {
    document.getElementById('businessName').value = localStorage.getItem('businessName') || '';
    document.getElementById('businessAddress').value = localStorage.getItem('businessAddress') || '';
    document.getElementById('businessPhone').value = localStorage.getItem('businessPhone') || '';
    document.getElementById('businessEmail').value = localStorage.getItem('businessEmail') || '';
    document.getElementById('backupInterval').value = localStorage.getItem('backupInterval') || '12';
}

window.saveBusinessInfo = function() {
    localStorage.setItem('businessName', document.getElementById('businessName').value);
    localStorage.setItem('businessAddress', document.getElementById('businessAddress').value);
    localStorage.setItem('businessPhone', document.getElementById('businessPhone').value);
    localStorage.setItem('businessEmail', document.getElementById('businessEmail').value);
    showAlert('Información del negocio guardada correctamente', 'success');
};

function updateAllData() {
    updateCategoriesTable();
    updateProductsTable();
    updateProductCategories();
    updateSaleProducts();
    updateSalesHistoryTable();
    updateDashboard();
    updateReports();
}

function downloadJSON(data, filename) {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

window.exportMssBiJson = function() {
    const businessName = localStorage.getItem('businessName') || 'Nombre no configurado';
    const productsData = products.map(p => ({
        nombre: p.name,
        precio_costo: p.costPrice,
        precio_venta: p.price
    }));
    const salesData = [];
    sales.forEach(sale => {
        sale.items.forEach(item => {
            salesData.push({
                fecha: new Date(sale.date).toISOString().split('T')[0],
                producto: item.productName,
                cantidad: item.quantity
            });
        });
    });
    const mssBiData = { negocio: businessName, productos: productsData, ventas: salesData };
    downloadJSON(mssBiData, 'MSS_BI_export.json');
    showAlert('Exportación para MSS BI generada con éxito.', 'success');
};

window.exportData = function() {
    const data = {
        categories, products, sales,
        exportDate: new Date().toISOString(),
        businessInfo: {
            name: localStorage.getItem('businessName'),
            address: localStorage.getItem('businessAddress'),
            phone: localStorage.getItem('businessPhone'),
            email: localStorage.getItem('businessEmail')
        }
    };
    downloadJSON(data, `backup_completo_${new Date().toISOString().split('T')[0]}.json`);
    showAlert('Datos exportados correctamente', 'success');
};

window.importData = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    if (!confirm('¿Está seguro de que desea importar estos datos? Esto reemplazará todos los datos actuales.')) return;
                    showLoading(true);
                    if (data.categories) categories = data.categories;
                    if (data.products) products = data.products;
                    if (data.sales) sales = data.sales;
                    if (data.businessInfo) {
                        localStorage.setItem('businessName', data.businessInfo.name || '');
                        localStorage.setItem('businessAddress', data.businessInfo.address || '');
                        localStorage.setItem('businessPhone', data.businessInfo.phone || '');
                        localStorage.setItem('businessEmail', data.businessInfo.email || '');
                    }
                    await saveAllData();
                    updateAllData();
                    showAlert('Datos importados correctamente', 'success');
                } catch (error) {
                    showAlert('Error al leer el archivo: formato inválido', 'error');
                } finally {
                    showLoading(false);
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
};

function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
    } else {
        document.body.appendChild(alertDiv);
    }
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 4000);
}

window.onclick = function(event) {
    const modals = ['saleDetailModal', 'priceUpdateModal', 'barcodeLabelsModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
};

// --- FUNCIONES DE EXPORTACIÓN A EXCEL (.XLSX) --- //

function downloadExcel(dataArray, sheetName, fileName) {
    if (typeof XLSX === 'undefined') {
        showAlert('Error: La librería de Excel no cargó correctamente.', 'error');
        return;
    }
    const ws = XLSX.utils.json_to_sheet(dataArray);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, fileName + '.xlsx');
    showAlert('Archivo Excel exportado con éxito', 'success');
}

function exportCategoriesExcel() {
    if (!categories || categories.length === 0) {
        showAlert('No hay categorías para exportar', 'error');
        return;
    }
    const data = categories.map(c => ({
        'Nombre': c.name,
        'Descripción': c.description || '-',
        'Productos Asociados': products.filter(p => p.categoryId === c.id).length,
        'Fecha de Creación': new Date(c.createdAt).toLocaleDateString('es-AR')
    }));
    downloadExcel(data, 'Categorias', 'Categorias_Inventario');
}

function exportProductsExcel() {
    if (!products || products.length === 0) {
        showAlert('No hay productos para exportar', 'error');
        return;
    }
    const data = products.map(p => {
        const margin = p.price > 0 ? ((p.price - p.costPrice) / p.price * 100).toFixed(2) + '%' : '0%';
        return {
            'Código': p.code,
            'Código de Barras': p.barcode || '-',
            'Nombre del Producto': p.name,
            'Categoría': p.categoryName,
            'Precio de Costo': p.costPrice,
            'Precio de Venta': p.price,
            'Margen de Ganancia': margin,
            'Stock Actual': p.stock,
            'Stock Mínimo': p.minStock,
            'Estado': getStockStatus(p)
        };
    });
    downloadExcel(data, 'Productos', 'Productos_Inventario');
}

function exportSalesExcel() {
    if (!sales || sales.length === 0) {
        showAlert('No hay ventas registradas para exportar', 'error');
        return;
    }
    const data = sales.map(s => ({
        'Fecha y Hora': new Date(s.date).toLocaleString('es-AR'),
        'Cliente': s.customerName,
        'Cantidad de Productos': s.items.reduce((sum, item) => sum + item.quantity, 0),
        'Costo Total': s.totalCost,
        'Venta Total': s.total,
        'Ganancia Neta': s.totalProfit
    }));
    downloadExcel(data, 'Ventas', 'Historial_Ventas');
}

function exportReportsExcel() {
    if (!sales || sales.length === 0) {
        showAlert('No hay datos de ventas para generar el reporte', 'error');
        return;
    }
    const productSales = {};
    sales.forEach(sale => {
        sale.items.forEach(item => {
            if (!productSales[item.productId]) {
                productSales[item.productId] = { name: item.productName, quantity: 0, revenue: 0, cost: 0, profit: 0 };
            }
            productSales[item.productId].quantity += item.quantity;
            productSales[item.productId].revenue += item.subtotal;
            productSales[item.productId].cost += (item.quantity * item.costPrice);
            productSales[item.productId].profit += item.profit;
        });
    });

    const totalSalesRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const sortedProducts = Object.values(productSales).sort((a, b) => b.quantity - a.quantity);
    
    const data = sortedProducts.map(p => ({
        'Producto': p.name,
        'Unidades Vendidas': p.quantity,
        'Costo de Mercadería': p.cost,
        'Ingresos Generados': p.revenue,
        'Ganancia Obtenida': p.profit,
        'Margen %': p.revenue > 0 ? ((p.profit / p.revenue) * 100).toFixed(2) + '%' : '0%',
        '% del Total': totalSalesRevenue > 0 ? ((p.revenue / totalSalesRevenue) * 100).toFixed(2) + '%' : '0%'
    }));
    downloadExcel(data, 'Reporte de Productos', 'Reporte_Productos_Vendidos');
}
function loadSavedLogo() {
    const savedLogo = localStorage.getItem('pos_custom_logo');
    if (savedLogo) {
        const logoImg = document.getElementById('businessLogo');
        if (logoImg) logoImg.src = savedLogo;
    }
}
window.deleteProduct = async function(productId) {
    const product = products.find(p => p.id == productId);
    const productName = product ? product.name : 'este producto';

    if (!confirm(`¿Está seguro de que desea eliminar "${productName}"?`)) return;

    // 1. Quitar el producto de la lista
    products = products.filter(p => p.id != productId);

    // 2. Guardar en el navegador y en la base de datos de Firebase
    localStorage.setItem('products', JSON.stringify(products));
    if (typeof saveToFirebase === 'function') {
        await saveToFirebase('products', products);
    }

    // 3. Actualizar la tabla y el panel sin recargar la pantalla
    if (typeof updateProductsTable === 'function') updateProductsTable();
    if (typeof updateDashboard === 'function') updateDashboard();
    if (typeof showAlert === 'function') showAlert('Producto eliminado correctamente', 'success');
};


// Vincular funciones a la ventana global
Object.assign(window, {
    showSection, addCategory, updateCategory, editCategory, deleteCategory, clearCategoryForm, searchCategories,
    addProduct, updateProduct, editProduct, deleteProduct, clearProductForm, searchProducts, selectProduct,
    updateSaleSubtotal, addToSale, quickSale, removeFromCart, completeSale, clearCart, showSaleDetail,
    closeSaleDetail, printInvoicePDF, sendInvoiceWhatsApp, exportData, importData, manualBackup, restoreFromFirebase, saveBusinessInfo,
    saveBackupSettings, showPriceUpdateModal, closePriceUpdateModal, previewPriceUpdate, applyPriceUpdate,
    showBarcodeLabelsModal, closeBarcodeLabelsModal, generateBarcodeLabels, toggleAuthMode, resetPassword,
    logout, exportMssBiJson, exportCategoriesExcel, exportProductsExcel, exportSalesExcel, exportReportsExcel,
    reabastecerProduct
});

document.addEventListener('DOMContentLoaded', () => {
    loadSavedLogo();

    // Vincula directamente el input por si el atributo onchange falló
    const fileInput = document.getElementById('logoInput');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            processLogoFile(file);
            e.target.value = '';
        });
    }
});

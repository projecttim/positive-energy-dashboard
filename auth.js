// Авторизация менеджеров в панели
const MANAGERS = {
    'ogorolyshev': { id: '493', name: 'Огорелышев Алексей', email: 'o.alexey@positive-energy.ru' },
    'burtsev': { id: '541', name: 'Бурцев Дмитрий', email: 'b.dmitry@positive-energy.ru' },
    'redkokasha': { id: '4889', name: 'Редкокаша Александр', email: 'a.redkokasha@positive-energy.ru' },
    'moiseev': { id: '2363', name: 'Моисеев Алексей', email: 'a.moiseev@positive-energy.ru' },
    'tim': { id: '1', name: 'Минашкин Тимофей', email: 'minashkin@positive-energy.ru', isAdmin: true }
};

// Проверка авторизации
function checkAuth() {
    const managerId = localStorage.getItem('manager_id');
    const managerKey = localStorage.getItem('manager_key');
    
    if (!managerId || !MANAGERS[managerKey]) {
        showLoginScreen();
        return false;
    }
    
    window.currentManager = MANAGERS[managerKey];
    updateUIForManager();
    return true;
}

// Показать экран входа
function showLoginScreen() {
    document.body.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); width: 400px;">
                <h2 style="text-align: center; margin-bottom: 30px; color: #333;">🔐 Вход в панель продаж</h2>
                
                <select id="managerSelect" style="width: 100%; padding: 12px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px;">
                    <option value="">Выберите менеджера...</option>
                    <option value="ogorolyshev">💼 Огорелышев Алексей</option>
                    <option value="burtsev">🔧 Бурцев Дмитрий</option>
                    <option value="redkokasha">🎯 Редкокаша Александр</option>
                    <option value="moiseev">📊 Моисеев Алексей</option>
                    <option value="tim">👑 Минашкин Тимофей (руководитель)</option>
                </select>
                
                <input type="password" id="pinInput" placeholder="PIN-код" style="width: 100%; padding: 12px; margin-bottom: 20px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px;">
                
                <button onclick="doLogin()" style="width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">Войти</button>
                
                <p id="errorMsg" style="color: #dc3545; text-align: center; margin-top: 15px; display: none;">Неверный PIN-код</p>
            </div>
        </div>
    `;
}

// Вход
function doLogin() {
    const managerKey = document.getElementById('managerSelect').value;
    const pin = document.getElementById('pinInput').value;
    
    // Простая проверка PIN (в продакшене — серверная проверка)
    const validPins = {
        'ogorolyshev': '4930',
        'burtsev': '5410',
        'redkokasha': '4889',
        'moiseev': '2363',
        'tim': '1000'
    };
    
    if (MANAGERS[managerKey] && pin === validPins[managerKey]) {
        localStorage.setItem('manager_id', MANAGERS[managerKey].id);
        localStorage.setItem('manager_key', managerKey);
        localStorage.setItem('manager_name', MANAGERS[managerKey].name);
        window.location.reload();
    } else {
        document.getElementById('errorMsg').style.display = 'block';
    }
}

// Обновить UI для менеджера
function updateUIForManager() {
    const manager = window.currentManager;
    
    // Добавляем инфо о менеджере в header
    const header = document.querySelector('.header');
    if (header) {
        const managerInfo = document.createElement('div');
        managerInfo.style.cssText = 'margin-top: 10px; padding: 10px; background: #e8f0fe; border-radius: 8px;';
        managerInfo.innerHTML = `
            <strong>👤 Вы вошли как:</strong> ${manager.name} 
            ${manager.isAdmin ? '<span style="color: #667eea;">(Администратор)</span>' : '(Менеджер)'}
            <button onclick="logout()" style="margin-left: 20px; padding: 4px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Выйти</button>
        `;
        header.appendChild(managerInfo);
    }
    
    // Если не админ — скрываем чужих клиентов
    if (!manager.isAdmin) {
        console.log(`✅ Фильтр: показываем только сделки менеджера ID ${manager.id}`);
    }
}

// Выход
function logout() {
    localStorage.removeItem('manager_id');
    localStorage.removeItem('manager_key');
    localStorage.removeItem('manager_name');
    window.location.reload();
}

// Инициализация при загрузке
window.addEventListener('load', () => {
    if (!checkAuth()) {
        return; // Показываем экран входа
    }
    
    // Загружаем панель
    if (window.salesPanel) {
        window.salesPanel.init();
    }
});

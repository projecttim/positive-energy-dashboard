// Интеграция панели с Битрикс24
// Загружает реальные данные и отправляет действия в CRM

class SalesPanelIntegration {
    constructor() {
        this.currentDeal = null;
        this.currentClient = null;
        this.products = [];
        this.init();
    }

    async init() {
        // Загружаем товары
        this.products = await Bitrix24API.getProducts();
        this.renderProducts();
        
        // Загружаем сделки
        await this.loadDeals();
        
        console.log('✅ Панель подключена к Битрикс24');
    }

    // ID текущего менеджера (определяется при входе)
    getCurrentManagerId() {
        // Получаем из URL параметра или localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const managerId = urlParams.get('manager') || localStorage.getItem('manager_id') || '1';
        return managerId;
    }

    // Загрузка сделок из Битрикс24 (только свои)
    async loadDeals() {
        const managerId = this.getCurrentManagerId();
        const deals = await Bitrix24API.getDeals({ 
            '>OPPORTUNITY': 0,
            'ASSIGNED_BY_ID': managerId // Только сделки текущего менеджера
        });
        
        const clientList = document.querySelector('.sidebar');
        clientList.innerHTML = '<h3>👥 Клиенты из CRM</h3>';
        
        for (const deal of deals.slice(0, 10)) {
            const company = deal.COMPANY_ID ? await Bitrix24API.getCompany(deal.COMPANY_ID) : null;
            const contact = deal.CONTACT_ID ? await Bitrix24API.getContact(deal.CONTACT_ID) : null;
            
            const clientName = company ? company.TITLE : (contact ? `${contact.NAME} ${contact.LAST_NAME}` : deal.TITLE);
            const status = this.getStatusBadge(deal.STAGE_ID);
            const amount = parseInt(deal.OPPORTUNITY).toLocaleString('ru-RU');
            
            const clientDiv = document.createElement('div');
            clientDiv.className = 'client-item';
            clientDiv.onclick = () => this.selectDeal(deal, company, contact);
            clientDiv.innerHTML = `
                <div class="client-name">${clientName}</div>
                <div class="client-status">Сделка #${deal.ID} • ${amount}₽</div>
                <span class="client-badge ${status.class}">${status.text}</span>
            `;
            clientList.appendChild(clientDiv);
        }
    }

    // Получить статус сделки
    getStatusBadge(stageId) {
        const stages = {
            'NEW': { class: 'badge-new', text: '🌱 Новая' },
            'PREPARATION': { class: 'badge-warm', text: '⚡ Подготовка' },
            'PREPAYMENT_INVOICE': { class: 'badge-hot', text: '🔥 Счёт' },
            'EXECUTING': { class: 'badge-hot', text: '🔥 В работе' },
            'FINAL_INVOICE': { class: 'badge-hot', text: '🔥 Финал' },
            'WON': { class: 'badge-new', text: '✅ Закрыта' }
        };
        return stages[stageId] || { class: 'badge-warm', text: '⚡ В работе' };
    }

    // Выбор сделки
    async selectDeal(deal, company, contact) {
        this.currentDeal = deal;
        this.currentClient = { company, contact };
        
        // Обновляем заголовок чата
        const clientName = company ? company.TITLE : (contact ? `${contact.NAME} ${contact.LAST_NAME}` : deal.TITLE);
        const clientPhone = contact && contact.PHONE ? contact.PHONE[0].VALUE : '';
        
        document.querySelector('.chat-header-info h3').textContent = clientName;
        document.querySelector('.chat-header-info p').textContent = 
            contact ? `${contact.NAME} ${contact.LAST_NAME} • ${clientPhone}` : `Сделка #${deal.ID}`;
        
        // Обновляем информацию о сделке
        document.querySelector('.deal-info').innerHTML = `
            <div class="deal-row">
                <span class="deal-label">Статус:</span>
                <span class="deal-value" style="color: #667eea;">${this.getStatusText(deal.STAGE_ID)}</span>
            </div>
            <div class="deal-row">
                <span class="deal-label">Сумма:</span>
                <span class="deal-value">${parseInt(deal.OPPORTUNITY).toLocaleString('ru-RU')}₽</span>
            </div>
            <div class="deal-row">
                <span class="deal-label">Сделка #:</span>
                <span class="deal-value">${deal.ID}</span>
            </div>
            <div class="deal-row">
                <span class="deal-label">Создана:</span>
                <span class="deal-value">${new Date(deal.DATE_CREATE).toLocaleDateString('ru-RU')}</span>
            </div>
        `;
        
        // Загружаем историю комментариев
        await this.loadDealHistory(deal.ID);
    }

    getStatusText(stageId) {
        const stages = {
            'NEW': 'Новая',
            'PREPARATION': 'Подготовка',
            'PREPAYMENT_INVOICE': 'Счёт выставлен',
            'EXECUTING': 'В работе',
            'FINAL_INVOICE': 'Финальный счёт',
            'WON': 'Успешно закрыта',
            'LOSE': 'Отказ'
        };
        return stages[stageId] || 'В работе';
    }

    // Загрузка истории сделки
    async loadDealHistory(dealId) {
        // Здесь можно загрузить комментарии из timeline
        // Пока оставляем демо-историю
    }

    // Отображение товаров
    renderProducts() {
        const container = document.querySelector('.panel-section:first-child');
        container.innerHTML = '<h4>📦 Наличие товара (из CRM)</h4>';
        
        for (const product of this.products) {
            const stockClass = product.stock < 10 ? 'low' : '';
            const stockText = product.stock < 10 ? `⚠️ Осталось: ${product.stock}` : `✅ В наличии: ${product.stock}`;
            
            const productDiv = document.createElement('div');
            productDiv.className = 'product-card';
            productDiv.onclick = () => this.insertProduct(product);
            productDiv.innerHTML = `
                <div class="product-name">${product.name}</div>
                <div class="product-price">${product.price.toLocaleString('ru-RU')}₽</div>
                <div class="product-stock ${stockClass}">${stockText} ${product.unit}</div>
            `;
            container.appendChild(productDiv);
        }
    }

    insertProduct(product) {
        const input = document.getElementById('messageInput');
        input.value = `Предлагаю ${product.name} — ${product.price.toLocaleString('ru-RU')}₽/${product.unit}. ${product.stock > 0 ? 'Есть в наличии.' : 'Под заказ.'}`;
        input.focus();
    }

    // Отправка сообщения клиенту
    async sendMessageToClient(text) {
        if (!this.currentDeal) {
            alert('Сначала выберите клиента из списка слева');
            return;
        }
        
        // Добавляем комментарий в сделку
        await Bitrix24API.addComment(this.currentDeal.ID, `Сообщение клиенту: ${text}`);
        
        // Если есть email — отправляем письмо
        const contact = this.currentClient.contact;
        if (contact && contact.EMAIL && contact.EMAIL.length > 0) {
            const email = contact.EMAIL[0].VALUE;
            await Bitrix24API.sendEmail(
                this.currentDeal.ID,
                email,
                `Re: ${this.currentDeal.TITLE}`,
                text,
                this.currentDeal.ASSIGNED_BY_ID
            );
        }
        
        return true;
    }

    // Создание КП от имени текущего менеджера
    async createKP(data) {
        if (!this.currentDeal) return;
        
        const managerId = this.getCurrentManagerId();
        const { company, email, product, quantity, discount } = data;
        const productInfo = this.products.find(p => p.name === product);
        const totalPrice = productInfo.price * quantity * (1 - discount / 100);
        
        // Формируем текст КП
        const kpText = `
Коммерческое предложение

Компания: ${company}
Продукт: ${product}
Количество: ${quantity} ${productInfo.unit}
Цена за единицу: ${productInfo.price.toLocaleString('ru-RU')}₽
Скидка: ${discount}%
Итого: ${totalPrice.toLocaleString('ru-RU')}₽

Срок поставки: 1-2 рабочих дня
Условия оплаты: 100% предоплата или по договору
        `.trim();
        
        // Отправляем email от имени текущего менеджера
        if (email) {
            await Bitrix24API.sendEmail(
                this.currentDeal.ID,
                email,
                `Коммерческое предложение — ${product}`,
                kpText.replace(/\n/g, '<br>'),
                managerId // Отправитель — текущий менеджер
            );
        }
        
        // Добавляем комментарий
        await Bitrix24API.addComment(this.currentDeal.ID, `Отправлено КП на ${email}. Сумма: ${totalPrice.toLocaleString('ru-RU')}₽`);
        
        // Обновляем сделку
        await Bitrix24API.updateDeal(this.currentDeal.ID, {
            COMMENTS: `КП отправлено: ${totalPrice.toLocaleString('ru-RU')}₽`
        });
        
        return { success: true, totalPrice };
    }
}

// Инициализация при загрузке страницы
window.addEventListener('load', () => {
    window.salesPanel = new SalesPanelIntegration();
});

// API для связи с Битрикс24
const BITRIX24_WEBHOOK = 'https://ex.positive-energy.ru/rest/3241/0wnhghwj2duazs3r/';

// Получить сделки из Битрикс24
async function getDeals(filter = {}) {
    try {
        const response = await fetch(`${BITRIX24_WEBHOOK}crm.deal.list.json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filter: filter,
                select: ['ID', 'TITLE', 'COMPANY_ID', 'CONTACT_ID', 'OPPORTUNITY', 'STAGE_ID', 'ASSIGNED_BY_ID', 'DATE_CREATE'],
                order: { DATE_CREATE: 'DESC' }
            })
        });
        const data = await response.json();
        return data.result || [];
    } catch (error) {
        console.error('Error fetching deals:', error);
        return [];
    }
}

// Получить контакт
async function getContact(contactId) {
    try {
        const response = await fetch(`${BITRIX24_WEBHOOK}crm.contact.get.json?ID=${contactId}`);
        const data = await response.json();
        return data.result;
    } catch (error) {
        console.error('Error fetching contact:', error);
        return null;
    }
}

// Получить компанию
async function getCompany(companyId) {
    try {
        const response = await fetch(`${BITRIX24_WEBHOOK}crm.company.get.json?ID=${companyId}`);
        const data = await response.json();
        return data.result;
    } catch (error) {
        console.error('Error fetching company:', error);
        return null;
    }
}

// Получить товары (через catalog.product.list если есть доступ)
async function getProducts() {
    // Пока возвращаем статичные данные, позже заменим на API
    return [
        { id: 1, name: 'G-Energy Synthetic 5W-30', price: 45000, stock: 50, unit: 'бочка 205л' },
        { id: 2, name: 'G-Energy Professional 10W-40', price: 38000, stock: 32, unit: 'бочка 205л' },
        { id: 3, name: 'G-Energy Truck 15W-40', price: 32000, stock: 8, unit: 'бочка 205л' },
        { id: 4, name: 'G-Energy Synthetic 5W-40', price: 47000, stock: 25, unit: 'бочка 205л' }
    ];
}

// Создать сделку
async function createDeal(fields) {
    try {
        const response = await fetch(`${BITRIX24_WEBHOOK}crm.deal.add.json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields: fields })
        });
        const data = await response.json();
        return data.result;
    } catch (error) {
        console.error('Error creating deal:', error);
        return null;
    }
}

// Обновить сделку
async function updateDeal(dealId, fields) {
    try {
        const response = await fetch(`${BITRIX24_WEBHOOK}crm.deal.update.json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: dealId, fields: fields })
        });
        const data = await response.json();
        return data.result;
    } catch (error) {
        console.error('Error updating deal:', error);
        return false;
    }
}

// Добавить комментарий к сделке
async function addComment(dealId, text) {
    try {
        const response = await fetch(`${BITRIX24_WEBHOOK}crm.timeline.comment.add.json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fields: {
                    ENTITY_ID: dealId,
                    ENTITY_TYPE: 'deal',
                    COMMENT: text
                }
            })
        });
        const data = await response.json();
        return data.result;
    } catch (error) {
        console.error('Error adding comment:', error);
        return null;
    }
}

// Отправить email через Битрикс24
async function sendEmail(dealId, toEmail, subject, body, fromUserId = 1) {
    try {
        const response = await fetch(`${BITRIX24_WEBHOOK}crm.activity.add.json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fields: {
                    OWNER_TYPE_ID: 2, // DEAL
                    OWNER_ID: dealId,
                    TYPE_ID: 4, // EMAIL
                    SUBJECT: subject,
                    DESCRIPTION: body,
                    DESCRIPTION_TYPE: 2, // HTML
                    DIRECTION: 2, // OUTGOING
                    COMMUNICATIONS: [{ VALUE: toEmail, TYPE: 'EMAIL' }],
                    RESPONSIBLE_ID: fromUserId
                }
            })
        });
        const data = await response.json();
        return data.result;
    } catch (error) {
        console.error('Error sending email:', error);
        return null;
    }
}

// Получить список клиентов (компаний)
async function getCompanies(filter = {}) {
    try {
        const response = await fetch(`${BITRIX24_WEBHOOK}crm.company.list.json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filter: filter,
                select: ['ID', 'TITLE', 'PHONE', 'EMAIL', 'ADDRESS']
            })
        });
        const data = await response.json();
        return data.result || [];
    } catch (error) {
        console.error('Error fetching companies:', error);
        return [];
    }
}

// Экспорт функций
window.Bitrix24API = {
    getDeals,
    getContact,
    getCompany,
    getProducts,
    createDeal,
    updateDeal,
    addComment,
    sendEmail,
    getCompanies
};

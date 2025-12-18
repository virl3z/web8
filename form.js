document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const openFormBtn = document.getElementById('openFormBtn');
    const closeFormBtn = document.getElementById('closeFormBtn');
    const formPopup = document.getElementById('formPopup');
    const feedbackForm = document.getElementById('feedbackForm');
    const resetFormBtn = document.getElementById('resetFormBtn');
    const formMessage = document.getElementById('formMessage');
    
    // Поля формы
    const formFields = {
        fullName: document.getElementById('fullName'),
        email: document.getElementById('email'),
        phone: document.getElementById('phone'),
        organization: document.getElementById('organization'),
        message: document.getElementById('message'),
        privacyPolicy: document.getElementById('privacyPolicy')
    };
    
    // Ключ для LocalStorage
    const STORAGE_KEY = 'feedback_form_data';
    
    // URL для отправки формы (ВАШ УНИКАЛЬНЫЙ КОД)
    const FORM_SUBMIT_URL = 'https://formspree.io/f/meejqlzw';
    
    // Инициализация
    function init() {
        // Загружаем сохраненные данные
        loadFormData();
        
        // Назначаем обработчики событий
        openFormBtn.addEventListener('click', openForm);
        closeFormBtn.addEventListener('click', closeForm);
        resetFormBtn.addEventListener('click', resetForm);
        feedbackForm.addEventListener('submit', handleSubmit);
        
        // Обработчик для сохранения данных при изменении
        Object.values(formFields).forEach(field => {
            if (field.type === 'checkbox') {
                field.addEventListener('change', saveFormData);
            } else {
                field.addEventListener('input', saveFormData);
            }
        });
        
        // Обработчик для телефона - только цифры
        formFields.phone.addEventListener('input', formatPhoneNumber);
        formFields.phone.addEventListener('keypress', restrictToNumbers);
        
        // Обработчик кнопки "Назад" в браузере
        window.addEventListener('popstate', handlePopState);
    }
    
    // Функция для ограничения ввода только цифр
    function restrictToNumbers(event) {
        const key = event.key;
        
        // Разрешаем: цифры 0-9, Backspace, Delete, Tab, стрелки
        if (!/[\d]/.test(key) && 
            key !== 'Backspace' && 
            key !== 'Delete' && 
            key !== 'Tab' &&
            key !== 'ArrowLeft' &&
            key !== 'ArrowRight' &&
            key !== 'ArrowUp' &&
            key !== 'ArrowDown') {
            event.preventDefault();
        }
    }
    
    // Функция для форматирования номера телефона
    function formatPhoneNumber() {
        let value = formFields.phone.value;
        
        // Удаляем все нецифровые символы
        let numbers = value.replace(/\D/g, '');
        
        // Ограничиваем длину (максимум 15 цифр)
        numbers = numbers.substring(0, 15);
        
        // Форматируем номер
        let formatted = '';
        if (numbers.length > 0) {
            formatted = '+7 ';
            if (numbers.length > 1) {
                formatted += '(' + numbers.substring(1, 4);
            }
            if (numbers.length >= 4) {
                formatted += ') ' + numbers.substring(4, 7);
            }
            if (numbers.length >= 7) {
                formatted += '-' + numbers.substring(7, 9);
            }
            if (numbers.length >= 9) {
                formatted += '-' + numbers.substring(9, 11);
            }
        }
        
        formFields.phone.value = formatted;
    }
    
    // Открытие формы
    function openForm() {
        formPopup.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Добавляем состояние в историю браузера
        history.pushState({ formOpen: true }, '', '#feedback');
    }
    
    // Закрытие формы
    function closeForm() {
        formPopup.style.display = 'none';
        document.body.style.overflow = 'auto';
        hideMessage();
        
        // Возвращаемся к предыдущему состоянию
        if (history.state && history.state.formOpen) {
            history.back();
        }
    }
    
    // Обработчик кнопки "Назад"
    function handlePopState(event) {
        if (!(event.state && event.state.formOpen)) {
            closeForm();
        }
    }
    
    // Сохранение данных в LocalStorage
    function saveFormData() {
        const formData = {
            fullName: formFields.fullName.value,
            email: formFields.email.value,
            phone: formFields.phone.value,
            organization: formFields.organization.value,
            message: formFields.message.value,
            privacyPolicy: formFields.privacyPolicy.checked
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }
    
    // Загрузка данных из LocalStorage
    function loadFormData() {
        const savedData = localStorage.getItem(STORAGE_KEY);
        
        if (savedData) {
            try {
                const formData = JSON.parse(savedData);
                
                formFields.fullName.value = formData.fullName || '';
                formFields.email.value = formData.email || '';
                formFields.phone.value = formData.phone || '';
                formFields.organization.value = formData.organization || '';
                formFields.message.value = formData.message || '';
                formFields.privacyPolicy.checked = formData.privacyPolicy || false;
            } catch (error) {
                console.error('Ошибка при загрузке данных:', error);
                clearStorage();
            }
        }
    }
    
    // Очистка LocalStorage
    function clearStorage() {
        localStorage.removeItem(STORAGE_KEY);
    }
    
    // Сброс формы
    function resetForm() {
        if (confirm('Вы уверены, что хотите очистить все поля формы?')) {
            feedbackForm.reset();
            clearStorage();
            hideMessage();
        }
    }
    
    // Отображение сообщения
    function showMessage(text, isSuccess) {
        formMessage.textContent = text;
        formMessage.className = `form-message ${isSuccess ? 'success' : 'error'}`;
        formMessage.style.display = 'block';
        
        // Автоматическое скрытие сообщения
        setTimeout(hideMessage, 5000);
    }
    
    // Скрытие сообщения
    function hideMessage() {
        formMessage.style.display = 'none';
        formMessage.textContent = '';
    }
    
    // Валидация формы
    function validateForm() {
        const errors = [];
        
        if (!formFields.fullName.value.trim()) {
            errors.push('ФИО является обязательным полем');
        }
        
        if (!formFields.email.value.trim()) {
            errors.push('Email является обязательным полем');
        } else if (!isValidEmail(formFields.email.value)) {
            errors.push('Введите корректный email адрес');
        }
        
        // Валидация телефона (если заполнен)
        if (formFields.phone.value.trim()) {
            const phoneNumbers = formFields.phone.value.replace(/\D/g, '');
            if (phoneNumbers.length < 11) {
                errors.push('Введите корректный номер телефона (минимум 11 цифр)');
            }
        }
        
        if (!formFields.message.value.trim()) {
            errors.push('Сообщение является обязательным полем');
        }
        
        if (!formFields.privacyPolicy.checked) {
            errors.push('Необходимо согласие с политикой обработки данных');
        }
        
        return errors;
    }
    
    // Проверка email
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Обработка отправки формы
    async function handleSubmit(event) {
        event.preventDefault();
        
        // Валидация
        const errors = validateForm();
        if (errors.length > 0) {
            showMessage(errors.join('<br>'), false);
            return;
        }
        
        // Подготовка данных для отправки
        const formData = new FormData();
        formData.append('fullName', formFields.fullName.value);
        formData.append('email', formFields.email.value);
        formData.append('phone', formFields.phone.value);
        formData.append('organization', formFields.organization.value);
        formData.append('message', formFields.message.value);
        formData.append('_replyto', formFields.email.value);
        formData.append('_subject', 'Новое сообщение с формы обратной связи');
        
        // Отправка данных
        try {
            const submitBtn = feedbackForm.querySelector('.submit-btn');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
            submitBtn.disabled = true;
            
            const response = await fetch(FORM_SUBMIT_URL, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                showMessage('Сообщение успешно отправлено! Мы свяжемся с вами в ближайшее время.', true);
                feedbackForm.reset();
                clearStorage();
            } else {
                throw new Error('Ошибка при отправке формы');
            }
            
        } catch (error) {
            console.error('Ошибка:', error);
            showMessage('Произошла ошибка при отправке формы. Пожалуйста, попробуйте еще раз.', false);
        } finally {
            const submitBtn = feedbackForm.querySelector('.submit-btn');
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Отправить';
            submitBtn.disabled = false;
        }
    }
    
    // Проверяем, открыта ли форма при загрузке страницы
    function checkInitialState() {
        if (window.location.hash === '#feedback') {
            openForm();
        }
    }
    
    // Запуск инициализации
    init();
    checkInitialState();
});

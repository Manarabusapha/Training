// ============ إدارة تسجيل الدخول والمصادقة ============

// بيانات الأدمن الثابتة
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: '0000'
};

function openPaymentImage() {
  const lightbox = document.getElementById('payment-image-lightbox');
  lightbox.classList.add('is-visible');
  lightbox.setAttribute('aria-hidden', 'false');
}

function closePaymentImage(event) {
  if (event.target !== event.currentTarget && !event.target.classList.contains('lightbox-close')) {
    return;
  }

  const lightbox = document.getElementById('payment-image-lightbox');
  lightbox.classList.remove('is-visible');
  lightbox.setAttribute('aria-hidden', 'true');
}

// التحقق من حالة الدخول عند تحميل الصفحة
window.addEventListener('DOMContentLoaded', function() {
  const isAdminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
  
  if (isAdminLoggedIn) {
    // إذا كان الأدمن مسجل دخول، عرض Dashboard
    document.getElementById('landing-page').style.display = 'none';
    document.getElementById('dashboard-page').style.display = 'block';
    loadDashboard();
  } else {
    // عرض صفحة الاختيار
    document.getElementById('landing-page').style.display = 'flex';
    document.getElementById('dashboard-page').style.display = 'none';
    document.getElementById('welcome').style.display = 'none';
    document.getElementById('home').style.display = 'none';
  }
  
  setupFormHandlers();
});

// دالة دخول المستخدم العادي
function loginAsUser() {
  document.getElementById('landing-page').style.display = 'none';
  document.getElementById('welcome').style.display = 'flex';
}

// دالة عرض نموذج تسجيل دخول الأدمن
function showAdminLogin() {
  document.getElementById('landing-page').style.display = 'none';
  document.getElementById('admin-login-page').style.display = 'flex';
}

// العودة إلى صفحة الاختيار
function backToLanding() {
  document.getElementById('landing-page').style.display = 'flex';
  document.getElementById('admin-login-page').style.display = 'none';
  document.getElementById('admin-error-message').style.display = 'none';
  document.getElementById('admin-login-form').reset();
}

// معالجة تسجيل دخول الأدمن
function handleAdminLogin(event) {
  event.preventDefault();
  
  const username = document.getElementById('admin-username').value;
  const password = document.getElementById('admin-password').value;
  const errorMessage = document.getElementById('admin-error-message');
  
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    // تسجيل دخول ناجح
    localStorage.setItem('adminLoggedIn', 'true');
    document.getElementById('admin-login-page').style.display = 'none';
    document.getElementById('dashboard-page').style.display = 'block';
    loadDashboard();
  } else {
    // رسالة خطأ
    errorMessage.textContent = 'بيانات الدخول غير صحيحة. اسم المستخدم أو كلمة المرور خاطئة.';
    errorMessage.style.display = 'block';
  }
}

// تسجيل الخروج
function logoutAdmin() {
  localStorage.removeItem('adminLoggedIn');
  document.getElementById('dashboard-page').style.display = 'none';
  document.getElementById('landing-page').style.display = 'flex';
  document.getElementById('admin-login-form').reset();
}

// ============ إدارة الطلبات والـ LocalStorage ============

// دالة حفظ الطلب في LocalStorage
function saveRequest(formData, formType) {
  let requests = JSON.parse(localStorage.getItem('requests')) || [];
  
  const request = {
    id: Date.now(),
    type: formType,
    timestamp: new Date().toLocaleString('ar-PS'),
    timestampISO: new Date().toISOString(),
    status: 'pending', // الحالة الافتراضية: قيد المراجعة
    data: formData
  };
  
  requests.push(request);
  localStorage.setItem('requests', JSON.stringify(requests));
  
  // تحديث Dashboard إذا كان الأدمن مسجل دخول
  if (localStorage.getItem('adminLoggedIn') === 'true') {
    loadDashboard();
  }
}

// دالة تحميل لوحة التحكم
function loadDashboard() {
  const requestsList = document.getElementById('requests-list');
  const requests = JSON.parse(localStorage.getItem('requests')) || [];
  
  if (requests.length === 0) {
    requestsList.innerHTML = '<p class="no-requests">لا توجد طلبات حتى الآن</p>';
    return;
  }
  
  // إذا كانت فلاتر موجودة، استخدمها لعرض النتائج المفلترة
  const filterExists = document.getElementById('request-filter') || document.getElementById('branch-filter') || document.getElementById('status-filter') || document.getElementById('date-filter');
  if (filterExists) {
    filterRequests();
  } else {
    displayRequests(requests);
  }
}

// دالة عرض الطلبات
function displayRequests(requests) {
  const requestsList = document.getElementById('requests-list');
  
  if (requests.length === 0) {
    requestsList.innerHTML = '<p class="no-requests">لا توجد طلبات حتى الآن</p>';
    return;
  }
  
  requestsList.innerHTML = '';
  
  requests.forEach(request => {
    const requestElement = document.createElement('div');
    requestElement.className = 'request-item';
    
    const typeLabel = {
      'subscription': 'طلب اشتراك',
      'request': 'طلب عام',
      'complaint': 'شكوى',
      'theft': 'بلاغ سرقة'
    }[request.type] || request.type;
    
    requestElement.innerHTML = `
      <div class="request-header">
        <div>
          <h3>${typeLabel}</h3>
          <span class="request-time">${request.timestamp}</span>
        </div>
        <div class="request-status-container">
          <select class="request-status status-${request.status || 'pending'}" onchange="changeRequestStatus(${request.id}, this.value)">
            <option value="pending" ${(request.status === 'pending' || !request.status) ? 'selected' : ''}>قيد المراجعة</option>
            <option value="approved" ${request.status === 'approved' ? 'selected' : ''}>مقبول</option>
            <option value="rejected" ${request.status === 'rejected' ? 'selected' : ''}>مرفوض</option>
            <option value="completed" ${request.status === 'completed' ? 'selected' : ''}>مكتمل</option>
          </select>
        </div>
      </div>
      <div class="request-body">
        <button class="btn view-btn" onclick="viewRequestDetails(${request.id})">عرض التفاصيل</button>
        <button class="btn download-btn" onclick="downloadRequestPDF(${request.id})">تنزيل كـ PDF</button>
        <button class="btn delete-btn" onclick="deleteRequest(${request.id})">حذف</button>
      </div>
    `;
    
    requestsList.appendChild(requestElement);
  });
}

// دالة تصفية الطلبات
function filterRequests() {
  const filterType = document.getElementById('request-filter').value;
  const filterDate = document.getElementById('date-filter').value;
  const filterBranch = document.getElementById('branch-filter').value;
  const filterStatus = document.getElementById('status-filter').value;
  const requests = JSON.parse(localStorage.getItem('requests')) || [];
  
  let filteredRequests = requests;
  
  // تصفية حسب النوع
  if (filterType !== 'all') {
    filteredRequests = filteredRequests.filter(req => req.type === filterType);
  }
  
  // تصفية حسب التاريخ
  if (filterDate) {
    filteredRequests = filteredRequests.filter(req => {
      const iso = req.timestampISO || (req.timestamp ? new Date(req.timestamp).toISOString() : '');
      const reqDate = iso ? iso.split('T')[0] : '';
      return reqDate === filterDate;
    });
  }
  
  // تصفية حسب الفرع
  if (filterBranch !== 'all') {
    filteredRequests = filteredRequests.filter(req => {
      const branch = req.data.branch || req.data['theft-branch'];
      return branch === filterBranch;
    });
  }
  
  // تصفية حسب الحالة
  if (filterStatus !== 'all') {
    filteredRequests = filteredRequests.filter(req => {
      const status = req.status || 'pending';
      return status === filterStatus;
    });
  }
  
  displayRequests(filteredRequests);
}

// دالة تغيير حالة الطلب
function changeRequestStatus(requestId, newStatus) {
  let requests = JSON.parse(localStorage.getItem('requests')) || [];
  const request = requests.find(r => r.id === requestId);
  
  if (request) {
    request.status = newStatus;
    localStorage.setItem('requests', JSON.stringify(requests));
    loadDashboard();
  }
}

// دالة عرض تفاصيل الطلب
function viewRequestDetails(requestId) {
  const requests = JSON.parse(localStorage.getItem('requests')) || [];
  const request = requests.find(r => r.id === requestId);
  
  if (request) {
    const fieldLabels = {
      name: 'الاسم',
      phone: 'رقم الهاتف',
      subscription_type: 'نوع الاشتراك',
      branch: 'الفرع',
      address: 'العنوان',
      phase: 'نوع الفاز',
      id_image: 'ملف الهوية',
      clearance_image: 'اذن اشغال',
      completion_certificate: 'شهادة اكتمال',
      request_type: 'نوع الطلب',
      details: 'تفاصيل',
      complaint_type: 'نوع الشكوى',
      'theft-branch': 'الفرع (بلاغ سرقة)',
      'theft-details': 'تفاصيل البلاغ',
      'theft-location': 'موقع السرقة',
      'theft-file': 'مرفق البلاغ',
      'theft-reported-name': 'اسم المبلَّغ عنه',
      'theft-reported-address': 'عنوان المبلَّغ عنه'
    };

    let detailsText = '';
    detailsText += `نوع الطلب: ${request.type}\n`;
    detailsText += `الحالة: ${request.status || 'pending'}\n`;
    detailsText += `التاريخ والوقت: ${request.timestamp || ''}\n\n`;
    detailsText += `التفاصيل:\n`;

    for (const [key, value] of Object.entries(request.data)) {
      const label = fieldLabels[key] || key;
      const display = (value === undefined || value === '') ? 'غير متوفر' : value;
      detailsText += `${label}: ${display}\n`;
    }

    alert(detailsText);
  }
}

// دالة تنزيل الطلب كـ PDF
function downloadRequestPDF(requestId) {
  const requests = JSON.parse(localStorage.getItem('requests')) || [];
  const request = requests.find(r => r.id === requestId);
  
  if (request) {
    const typeLabel = {
      'subscription': 'طلب اشتراك',
      'request': 'طلب عام',
      'complaint': 'شكوى',
      'theft': 'بلاغ سرقة'
    }[request.type] || request.type;
    
    // map field keys to readable labels
    const fieldLabels = {
      name: 'الاسم',
      phone: 'رقم الهاتف',
      subscription_type: 'نوع الاشتراك',
      branch: 'الفرع',
      address: 'العنوان',
      phase: 'نوع الفاز',
      id_image: 'ملف الهوية',
      clearance_image: 'اذن اشغال',
      completion_certificate: 'شهادة اكتمال',
      request_type: 'نوع الطلب',
      details: 'تفاصيل',
      complaint_type: 'نوع الشكوى',
      'theft-branch': 'الفرع (بلاغ سرقة)',
      'theft-details': 'تفاصيل البلاغ',
      'theft-location': 'موقع السرقة',
      'theft-file': 'مرفق البلاغ',
      'theft-reported-name': 'اسم المبلَّغ عنه',
      'theft-reported-address': 'عنوان المبلَّغ عنه'
    };

    const element = document.createElement('div');
    element.innerHTML = `
      <h2 style="text-align: center;">شركة كهرباء الجنوب - SELCO</h2>
      <h3 style="text-align: center;">${typeLabel}</h3>
      <hr>
      <p><strong>التاريخ والوقت:</strong> ${request.timestamp || ''}</p>
      <p><strong>الحالة:</strong> ${request.status || 'قيد المراجعة'}</p>
      <h4>بيانات الطلب:</h4>
      <table style="width: 100%; border-collapse: collapse;">
    `;

    for (const [key, value] of Object.entries(request.data)) {
      const label = fieldLabels[key] || key;
      const display = (value === undefined || value === '') ? 'غير متوفر' : value;
      element.innerHTML += `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;"><strong>${label}:</strong></td>
          <td style="border: 1px solid #ddd; padding: 8px;">${display}</td>
        </tr>
      `;
    }

    element.innerHTML += `</table>`;
    
    const options = {
      margin: 10,
      filename: `طلب_${typeLabel}_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { 
        orientation: 'portrait', 
        unit: 'mm', 
        format: 'a4'
      }
    };
    
    html2pdf().set(options).from(element).save();
  }
}

// دالة حذف الطلب
function deleteRequest(requestId) {
  if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
    let requests = JSON.parse(localStorage.getItem('requests')) || [];
    requests = requests.filter(r => r.id !== requestId);
    localStorage.setItem('requests', JSON.stringify(requests));
    loadDashboard();
  }
}

// ============ وظائف النماذج الأصلية ============

// دالة إعداد معالجات النماذج
function setupFormHandlers() {
  const subForm = document.getElementById('sub-form');
  const reqForm = document.getElementById('req-form');
  const compForm = document.getElementById('comp-form');
  const theftForm = document.getElementById('theft-form-element');
  
  if (subForm) {
    subForm.addEventListener('submit', function(e) {
      e.preventDefault();
      submitForm(this, 'subscription');
    });
  }
  
  if (reqForm) {
    reqForm.addEventListener('submit', function(e) {
      e.preventDefault();
      submitForm(this, 'request');
    });
  }
  
  if (compForm) {
    compForm.addEventListener('submit', function(e) {
      e.preventDefault();
      submitForm(this, 'complaint');
    });
  }
  
  if (theftForm) {
    theftForm.addEventListener('submit', function(e) {
      e.preventDefault();
      submitForm(this, 'theft');
    });
  }
  
  // معالجات الملاحة
  const navLinks = document.querySelectorAll('.nav-links li');
  const sections = document.querySelectorAll('section');
  
  navLinks.forEach(link => {
    link.addEventListener('click', function() {
      navLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
      
      sections.forEach(section => section.style.display = 'none');

      const footer = document.querySelector('.site-footer');
      if (footer) {
        footer.style.display = this.getAttribute('data-section') === 'home' ? '' : 'none';
      }
      
      document.getElementById('subscription-form').style.display = 'none';
      document.getElementById('request-form').style.display = 'none';
      document.getElementById('complaint-form').style.display = 'none';
      document.getElementById('theft-form').style.display = 'none';
      
      const sectionId = this.getAttribute('data-section') + '-section';
      document.getElementById(sectionId).style.display = 'block';

      if (this.getAttribute('data-section') === 'home') {
        document.querySelectorAll('#home-section .home-static-section').forEach(section => {
          section.style.display = section.dataset.homeDisplay || 'block';
        });
      }
    });
  });
}

// Function to submit form data (محدث لاستخدام LocalStorage)
function submitForm(form, formType) {
  const formData = new FormData(form);
  const data = {};

  formData.forEach((value, key) => {
    // If the field is a file, store the filename instead of the File object
    if (value instanceof File) {
      data[key] = value.name || '(مرفق)';
    } else {
      data[key] = value;
    }
  });
  
  // حفظ الطلب في LocalStorage
  saveRequest(data, formType);
  
  // عرض رسالة نجاح
  let message = '';
  if (formType === 'subscription' || formType === 'request' || formType === 'complaint') {
    message = 'تم تاكيد طلبك وسيتم التواصل معك قريبا';
  } else if (formType === 'theft') {
    message = 'تم تقديم البلاغ وسيتم التعامل مع البلاغ بسرية تامة';
  }
  alert(message);
  form.reset();
  
  // إخفاء النموذج
  const formContainer = form.closest('.form-container');
  if (formContainer) {
    formContainer.style.display = 'none';
  }
}

// Function to go to the next page (from welcome to home)
function goNext() {
  document.getElementById('welcome').style.display = 'none';
  document.getElementById('home').style.display = 'block';
}

// دالة الانتقال بين الأقسام المختلفة
function navigateToSection(sectionName) {
  // إخفاء جميع الأقسام
  const sections = document.querySelectorAll('section');
  sections.forEach(section => section.style.display = 'none');

  const footer = document.querySelector('.site-footer');
  if (footer) {
    footer.style.display = sectionName === 'home' ? '' : 'none';
  }
  
  // إخفاء جميع النماذج
  document.getElementById('subscription-form').style.display = 'none';
  document.getElementById('request-form').style.display = 'none';
  document.getElementById('complaint-form').style.display = 'none';
  document.getElementById('theft-form').style.display = 'none';
  
  // إزالة الفئة النشطة من جميع روابط الملاحة
  const navLinks = document.querySelectorAll('.nav-links li');
  navLinks.forEach(link => link.classList.remove('active'));
  
  // عرض القسم المطلوب
  if (sectionName === 'services') {
    const servicesSection = document.getElementById('services-section');
    servicesSection.style.display = 'block';
    document.querySelector('[data-section="services"]').classList.add('active');
    servicesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else if (sectionName === 'about') {
    document.getElementById('about-section').style.display = 'block';
    document.querySelector('[data-section="about"]').classList.add('active');
  } else if (sectionName === 'contact') {
    document.getElementById('contact-section').style.display = 'block';
    document.querySelector('[data-section="contact"]').classList.add('active');
  }

  if (sectionName === 'home') {
    document.querySelectorAll('#home-section .home-static-section').forEach(section => {
      section.style.display = section.dataset.homeDisplay || 'block';
    });
  }
}

// Function to show the selected form
function showForm(formType) {
  // Hide all forms
  document.getElementById('subscription-form').style.display = 'none';
  document.getElementById('request-form').style.display = 'none';
  document.getElementById('complaint-form').style.display = 'none';
  document.getElementById('theft-form').style.display = 'none';

  // Show the selected form
  if (formType === 'subscription') {
    document.getElementById('subscription-form').style.display = 'block';
  } else if (formType === 'request') {
    document.getElementById('request-form').style.display = 'block';
  } else if (formType === 'complaint') {
    document.getElementById('complaint-form').style.display = 'block';
  } else if (formType === 'theft') {
    document.getElementById('theft-form').style.display = 'block';
  }
}

// Customer authentication functions (frontend only)
function showLogin() {
  document.getElementById('welcome').style.display = 'none';
  document.getElementById('login-form').style.display = 'block';
}

function showRegister() {
  document.getElementById('welcome').style.display = 'none';
  document.getElementById('register-form').style.display = 'block';
}

function hideAuthForms() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'none';
  document.getElementById('welcome').style.display = 'block';
}

"use strict";

/* =========================================================
   لغات النظام
========================================================= */

const TRANSLATIONS = {
    ar: {
        languageCode: "ar",
        languageName: "العربية",
        direction: "rtl",
        locale: "ar-SA",

        appName: "منصة عمليات المبيعات",
        appShortName: "Sales Operations",
        developedBy: "تطوير: Adel Elesawy",

        common: {
            loading: "جاري التحميل...",
            save: "حفظ",
            cancel: "إلغاء",
            confirm: "تأكيد",
            close: "إغلاق",
            search: "بحث",
            filter: "تصفية",
            apply: "تطبيق",
            reset: "إعادة ضبط",
            refresh: "تحديث",
            exportExcel: "تصدير Excel",
            print: "طباعة",
            view: "عرض",
            details: "التفاصيل",
            all: "الكل",
            yes: "نعم",
            no: "لا",
            previous: "السابق",
            next: "التالي",
            records: "عدد السجلات",
            noData: "لا توجد بيانات متاحة",
            notAvailable: "غير متاح",
            unknown: "غير محدد",
            currency: "ر.س",
            percentage: "النسبة",
            status: "الحالة",
            actions: "الإجراءات",
            fromDate: "من تاريخ",
            toDate: "إلى تاريخ",
            allBranches: "جميع الفروع",
            allSalesmen: "جميع المندوبين",
            lastUpdate: "آخر تحديث",
            today: "اليوم",
            month: "الشهر",
            year: "السنة"
        },

        login: {
            welcome: "مرحبًا بك",
            title: "تسجيل الدخول",
            subtitle: "أدخل بيانات حسابك للوصول إلى النظام",
            username: "اسم المستخدم",
            usernamePlaceholder: "أدخل اسم المستخدم",
            password: "كلمة المرور",
            passwordPlaceholder: "أدخل كلمة المرور",
            loginButton: "تسجيل الدخول",
            security: "يتم التحقق من بيانات الدخول بشكل آمن",
            invalidCredentials: "اسم المستخدم أو كلمة المرور غير صحيحة",
            missingCredentials: "يرجى إدخال اسم المستخدم وكلمة المرور",
            logout: "تسجيل الخروج",
            logoutTitle: "تسجيل الخروج",
            logoutMessage: "هل أنت متأكد من رغبتك في تسجيل الخروج؟",
            loginSuccess: "تم تسجيل الدخول بنجاح",
            logoutSuccess: "تم تسجيل الخروج بنجاح"
        },

        navigation: {
            mainMenu: "القائمة الرئيسية",
            dashboard: "لوحة التحكم",
            invoices: "الفواتير",
            collections: "التحصيلات",
            dueOverdue: "المستحقات والمتأخرات",
            targets: "الأهداف",
            salesmanProfiles: "ملفات المندوبين",
            salesIntelligence: "ذكاء المبيعات",
            alerts: "مركز التنبيهات",
            reports: "التقارير",
            settings: "الإعدادات"
        },

        dashboard: {
            title: "لوحة التحكم",
            subtitle: "نظرة شاملة على أداء المبيعات والتحصيلات",

            netSales: "صافي المبيعات",
            collections: "إجمالي التحصيلات",
            due: "المستحقات",
            overdue: "المتأخرات",
            outstanding: "الرصيد القائم",
            monthlyTarget: "الهدف الشهري",
            achievement: "تحقيق الهدف",
            remainingTarget: "المتبقي من الهدف",
            averageInvoice: "متوسط الفاتورة",
            invoiceCount: "عدد الفواتير",
            activeCustomers: "العملاء النشطون",
            newCustomers: "العملاء الجدد",
            collectionRate: "نسبة التحصيل",

            salesCollectionsTrend: "اتجاه المبيعات والتحصيلات",
            dueVsOverdue: "المستحقات مقابل المتأخرات",
            targetAchievement: "نسبة تحقيق الهدف",
            salesmanPerformance: "أداء المندوبين",
            branchPerformance: "أداء الفروع",
            recentInvoices: "أحدث الفواتير",
            topOverdue: "أعلى المتأخرات",
            viewAll: "عرض الكل"
        },

        invoices: {
            title: "بيانات الفواتير",
            subtitle: "متابعة تفاصيل المبيعات والفواتير",
            searchPlaceholder: "بحث في الفواتير...",
            invoiceDate: "تاريخ الفاتورة",
            invoiceNumber: "رقم الفاتورة",
            customerCode: "كود العميل",
            customerName: "اسم العميل",
            salesmanCode: "كود المندوب",
            salesmanName: "اسم المندوب",
            branch: "الفرع",
            invoiceType: "نوع الفاتورة",
            netSales: "صافي المبيعات"
        },

        collections: {
            title: "بيانات التحصيلات",
            subtitle: "متابعة المدفوعات والتحصيلات المستلمة",
            searchPlaceholder: "بحث في التحصيلات...",
            collectionDate: "تاريخ التحصيل",
            receiptNumber: "رقم الإيصال",
            paymentReceiptNumber: "رقم سند القبض",
            customerCode: "كود العميل",
            customerName: "اسم العميل",
            salesmanCode: "كود المندوب",
            salesmanName: "اسم المندوب",
            branch: "الفرع",
            collectionAmount: "المبلغ المحصل"
        },

        dueOverdue: {
            title: "المستحقات والمتأخرات",
            subtitle: "متابعة أرصدة العملاء وحالات التأخير",
            searchPlaceholder: "بحث في المستحقات والمتأخرات...",
            customerCode: "كود العميل",
            customerName: "اسم العميل",
            salesmanCode: "كود المندوب",
            salesmanName: "اسم المندوب",
            branch: "الفرع",
            creditLimit: "الحد الائتماني",
            dueAmount: "المستحق",
            overdueAmount: "المتأخر",
            totalBalance: "إجمالي الرصيد",
            outstandingDays: "أيام التأخير",
            dueStatus: "مستحق",
            overdueStatus: "متأخر",
            overCreditLimit: "تجاوز الحد الائتماني",
            aging: "فترة التأخير",
            days1To30: "من 1 إلى 30 يومًا",
            days31To60: "من 31 إلى 60 يومًا",
            days61To90: "من 61 إلى 90 يومًا",
            moreThan90Days: "أكثر من 90 يومًا"
        },

        targets: {
            title: "الأهداف البيعية",
            subtitle: "متابعة الهدف ونسبة تحقيق كل مندوب",
            searchPlaceholder: "بحث في الأهداف...",
            salesmanCode: "كود المندوب",
            salesmanName: "اسم المندوب",
            branch: "الفرع",
            monthlyTarget: "الهدف الشهري",
            quarterTarget: "الهدف الربع سنوي",
            sales: "المبيعات",
            achievement: "نسبة التحقيق",
            remaining: "المتبقي",
            achieved: "تم تحقيق الهدف",
            belowTarget: "أقل من الهدف"
        },

        salesmanProfiles: {
            title: "ملفات المندوبين",
            subtitle: "عرض جميع بيانات المندوبين والعملاء التابعين لهم",
            selectSalesman: "اختر المندوب",
            salesmanInformation: "بيانات المندوب",
            customersList: "قائمة العملاء",
            salesmanCode: "كود المندوب",
            salesmanName: "اسم المندوب",
            branch: "الفرع",
            monthlyTarget: "الهدف الشهري",
            sales: "المبيعات",
            collections: "التحصيلات",
            due: "المستحقات",
            overdue: "المتأخرات",
            achievement: "تحقيق الهدف",
            invoiceCount: "عدد الفواتير",
            customerCount: "عدد العملاء",
            averageInvoice: "متوسط الفاتورة",
            customerCode: "كود العميل",
            customerName: "اسم العميل",
            lastPurchase: "آخر عملية شراء",
            customerSales: "إجمالي المبيعات",
            customerCollections: "إجمالي التحصيل",
            customerDue: "المستحق",
            customerOverdue: "المتأخر",
            outstandingDays: "أيام التأخير",
            creditLimit: "الحد الائتماني",
            customerStatus: "حالة العميل",
            active: "نشط",
            inactive: "غير نشط",
            overdueCustomer: "متأخر",
            overCreditLimit: "متجاوز الحد الائتماني",
            viewProfile: "عرض الملف"
        },

        intelligence: {
            title: "ذكاء المبيعات",
            subtitle: "تحليلات متقدمة لدعم قرارات الإدارة",
            topSalesmen: "أفضل المندوبين",
            lowestSalesmen: "أقل المندوبين أداءً",
            topBranches: "أفضل الفروع",
            lowestBranches: "أقل الفروع أداءً",
            inactiveCustomers: "عملاء لم يشتروا منذ 30 يومًا",
            overCreditCustomers: "عملاء تجاوزوا الحد الائتماني",
            salesForecast: "توقع المبيعات",
            collectionForecast: "توقع التحصيل",
            riskCustomers: "العملاء المعرضون للتوقف"
        },

        alerts: {
            title: "مركز التنبيهات",
            subtitle: "متابعة الحالات التي تحتاج إلى إجراء سريع",
            noPurchase30Days: "عميل لم يشترِ منذ أكثر من 30 يومًا",
            targetAchieved: "مندوب حقق الهدف",
            lowAchievement: "مندوب منخفض الأداء",
            overCreditLimit: "عميل تجاوز الحد الائتماني",
            upcomingOverdue: "مستحقات ستتحول إلى متأخرات",
            severeOverdue: "عميل متأخر أكثر من 90 يومًا",
            critical: "حرج",
            warning: "تحذير",
            success: "إيجابي",
            information: "معلومة"
        },

        reports: {
            title: "التقارير",
            subtitle: "إعداد وطباعة تقارير الأداء",
            salesReport: "تقرير المبيعات",
            collectionsReport: "تقرير التحصيلات",
            overdueReport: "تقرير المتأخرات",
            targetReport: "تقرير تحقيق الأهداف",
            salesmanReport: "تقرير المندوب",
            branchReport: "تقرير الفرع",
            daily: "يومي",
            weekly: "أسبوعي",
            monthly: "شهري",
            quarterly: "ربع سنوي",
            yearly: "سنوي",
            generateReport: "إنشاء التقرير"
        },

        settings: {
            title: "الإعدادات",
            subtitle: "تخصيص إعدادات النظام",
            language: "اللغة",
            arabic: "العربية",
            english: "English",
            appearance: "المظهر",
            lightMode: "الوضع الفاتح",
            darkMode: "الوضع الداكن",
            userInformation: "معلومات المستخدم"
        },

        messages: {
            loadingData: "جاري تحميل البيانات...",
            dataLoaded: "تم تحميل البيانات بنجاح",
            refreshSuccess: "تم تحديث البيانات بنجاح",
            filterApplied: "تم تطبيق الفلاتر",
            filtersReset: "تمت إعادة ضبط الفلاتر",
            noExportData: "لا توجد بيانات لتصديرها",
            excelCreated: "تم تجهيز ملف Excel",
            serverError: "حدث خطأ أثناء الاتصال بالخادم",
            connectionError: "تعذر الاتصال بالخادم",
            sessionExpired: "انتهت جلسة تسجيل الدخول",
            managementOnly: "هذه الصفحة متاحة للإدارة فقط"
        }
    },

    en: {
        languageCode: "en",
        languageName: "English",
        direction: "ltr",
        locale: "en-US",

        appName: "Sales Operations Platform",
        appShortName: "Sales Operations",
        developedBy: "Developed by Adel Elesawy",

        common: {
            loading: "Loading...",
            save: "Save",
            cancel: "Cancel",
            confirm: "Confirm",
            close: "Close",
            search: "Search",
            filter: "Filter",
            apply: "Apply",
            reset: "Reset",
            refresh: "Refresh",
            exportExcel: "Export Excel",
            print: "Print",
            view: "View",
            details: "Details",
            all: "All",
            yes: "Yes",
            no: "No",
            previous: "Previous",
            next: "Next",
            records: "Records",
            noData: "No data available",
            notAvailable: "Not available",
            unknown: "Unknown",
            currency: "SAR",
            percentage: "Percentage",
            status: "Status",
            actions: "Actions",
            fromDate: "From Date",
            toDate: "To Date",
            allBranches: "All Branches",
            allSalesmen: "All Salesmen",
            lastUpdate: "Last Update",
            today: "Today",
            month: "Month",
            year: "Year"
        },

        login: {
            welcome: "Welcome",
            title: "Sign In",
            subtitle: "Enter your account details to access the platform",
            username: "Username",
            usernamePlaceholder: "Enter username",
            password: "Password",
            passwordPlaceholder: "Enter password",
            loginButton: "Sign In",
            security: "Your login details are securely verified",
            invalidCredentials: "Invalid username or password",
            missingCredentials: "Please enter username and password",
            logout: "Sign Out",
            logoutTitle: "Sign Out",
            logoutMessage: "Are you sure you want to sign out?",
            loginSuccess: "Signed in successfully",
            logoutSuccess: "Signed out successfully"
        },

        navigation: {
            mainMenu: "Main Menu",
            dashboard: "Dashboard",
            invoices: "Invoices",
            collections: "Collections",
            dueOverdue: "Due & Overdue",
            targets: "Targets",
            salesmanProfiles: "Salesman Profiles",
            salesIntelligence: "Sales Intelligence",
            alerts: "Alerts Center",
            reports: "Reports",
            settings: "Settings"
        },

        dashboard: {
            title: "Dashboard",
            subtitle: "A comprehensive overview of sales and collections performance",

            netSales: "Net Sales",
            collections: "Total Collections",
            due: "Due",
            overdue: "Overdue",
            outstanding: "Outstanding Balance",
            monthlyTarget: "Monthly Target",
            achievement: "Target Achievement",
            remainingTarget: "Remaining Target",
            averageInvoice: "Average Invoice",
            invoiceCount: "Invoice Count",
            activeCustomers: "Active Customers",
            newCustomers: "New Customers",
            collectionRate: "Collection Rate",

            salesCollectionsTrend: "Sales and Collections Trend",
            dueVsOverdue: "Due vs Overdue",
            targetAchievement: "Target Achievement",
            salesmanPerformance: "Salesman Performance",
            branchPerformance: "Branch Performance",
            recentInvoices: "Recent Invoices",
            topOverdue: "Top Overdue Customers",
            viewAll: "View All"
        },

        invoices: {
            title: "Invoices Data",
            subtitle: "Track sales and invoice details",
            searchPlaceholder: "Search invoices...",
            invoiceDate: "Invoice Date",
            invoiceNumber: "Invoice Number",
            customerCode: "Customer Code",
            customerName: "Customer Name",
            salesmanCode: "Salesman Code",
            salesmanName: "Salesman Name",
            branch: "Branch",
            invoiceType: "Invoice Type",
            netSales: "Net Sales"
        },

        collections: {
            title: "Collections Data",
            subtitle: "Track received payments and collections",
            searchPlaceholder: "Search collections...",
            collectionDate: "Collection Date",
            receiptNumber: "Receipt Number",
            paymentReceiptNumber: "Payment Receipt Number",
            customerCode: "Customer Code",
            customerName: "Customer Name",
            salesmanCode: "Salesman Code",
            salesmanName: "Salesman Name",
            branch: "Branch",
            collectionAmount: "Collection Amount"
        },

        dueOverdue: {
            title: "Due & Overdue",
            subtitle: "Track customer balances and overdue status",
            searchPlaceholder: "Search due and overdue...",
            customerCode: "Customer Code",
            customerName: "Customer Name",
            salesmanCode: "Salesman Code",
            salesmanName: "Salesman Name",
            branch: "Branch",
            creditLimit: "Credit Limit",
            dueAmount: "Due",
            overdueAmount: "Overdue",
            totalBalance: "Total Balance",
            outstandingDays: "Outstanding Days",
            dueStatus: "Due",
            overdueStatus: "Overdue",
            overCreditLimit: "Over Credit Limit",
            aging: "Aging",
            days1To30: "1–30 Days",
            days31To60: "31–60 Days",
            days61To90: "61–90 Days",
            moreThan90Days: "More Than 90 Days"
        },

        targets: {
            title: "Sales Targets",
            subtitle: "Track targets and achievement by salesman",
            searchPlaceholder: "Search targets...",
            salesmanCode: "Salesman Code",
            salesmanName: "Salesman Name",
            branch: "Branch",
            monthlyTarget: "Monthly Target",
            quarterTarget: "Quarter Target",
            sales: "Sales",
            achievement: "Achievement",
            remaining: "Remaining",
            achieved: "Target Achieved",
            belowTarget: "Below Target"
        },

        salesmanProfiles: {
            title: "Salesman Profiles",
            subtitle: "View complete salesman and customer information",
            selectSalesman: "Select Salesman",
            salesmanInformation: "Salesman Information",
            customersList: "Customers List",
            salesmanCode: "Salesman Code",
            salesmanName: "Salesman Name",
            branch: "Branch",
            monthlyTarget: "Monthly Target",
            sales: "Sales",
            collections: "Collections",
            due: "Due",
            overdue: "Overdue",
            achievement: "Achievement",
            invoiceCount: "Invoice Count",
            customerCount: "Customer Count",
            averageInvoice: "Average Invoice",
            customerCode: "Customer Code",
            customerName: "Customer Name",
            lastPurchase: "Last Purchase",
            customerSales: "Total Sales",
            customerCollections: "Total Collections",
            customerDue: "Due",
            customerOverdue: "Overdue",
            outstandingDays: "Outstanding Days",
            creditLimit: "Credit Limit",
            customerStatus: "Customer Status",
            active: "Active",
            inactive: "Inactive",
            overdueCustomer: "Overdue",
            overCreditLimit: "Over Credit Limit",
            viewProfile: "View Profile"
        },

        intelligence: {
            title: "Sales Intelligence",
            subtitle: "Advanced analytics to support management decisions",
            topSalesmen: "Top Salesmen",
            lowestSalesmen: "Lowest Performing Salesmen",
            topBranches: "Top Branches",
            lowestBranches: "Lowest Performing Branches",
            inactiveCustomers: "Customers Inactive for 30 Days",
            overCreditCustomers: "Customers Over Credit Limit",
            salesForecast: "Sales Forecast",
            collectionForecast: "Collection Forecast",
            riskCustomers: "At-Risk Customers"
        },

        alerts: {
            title: "Alerts Center",
            subtitle: "Track cases requiring immediate action",
            noPurchase30Days: "Customer inactive for more than 30 days",
            targetAchieved: "Salesman achieved the target",
            lowAchievement: "Low-performing salesman",
            overCreditLimit: "Customer exceeded credit limit",
            upcomingOverdue: "Due balance becoming overdue soon",
            severeOverdue: "Customer overdue for more than 90 days",
            critical: "Critical",
            warning: "Warning",
            success: "Positive",
            information: "Information"
        },

        reports: {
            title: "Reports",
            subtitle: "Create and print performance reports",
            salesReport: "Sales Report",
            collectionsReport: "Collections Report",
            overdueReport: "Overdue Report",
            targetReport: "Target Achievement Report",
            salesmanReport: "Salesman Report",
            branchReport: "Branch Report",
            daily: "Daily",
            weekly: "Weekly",
            monthly: "Monthly",
            quarterly: "Quarterly",
            yearly: "Yearly",
            generateReport: "Generate Report"
        },

        settings: {
            title: "Settings",
            subtitle: "Customize platform settings",
            language: "Language",
            arabic: "العربية",
            english: "English",
            appearance: "Appearance",
            lightMode: "Light Mode",
            darkMode: "Dark Mode",
            userInformation: "User Information"
        },

        messages: {
            loadingData: "Loading data...",
            dataLoaded: "Data loaded successfully",
            refreshSuccess: "Data refreshed successfully",
            filterApplied: "Filters applied",
            filtersReset: "Filters reset",
            noExportData: "No data available for export",
            excelCreated: "Excel file created",
            serverError: "Server connection error",
            connectionError: "Unable to connect to the server",
            sessionExpired: "Your login session has expired",
            managementOnly: "This page is available to management only"
        }
    }
};

/* =========================================================
   أدوات الترجمة
========================================================= */

const LANGUAGE_STORAGE_KEY = "sales_operations_language";

function getSavedLanguage() {
    const savedLanguage =
        localStorage.getItem(LANGUAGE_STORAGE_KEY);

    return TRANSLATIONS[savedLanguage]
        ? savedLanguage
        : "ar";
}

function saveLanguage(language) {
    if (!TRANSLATIONS[language]) {
        return;
    }

    localStorage.setItem(
        LANGUAGE_STORAGE_KEY,
        language
    );
}

function getTranslations(language = getSavedLanguage()) {
    return TRANSLATIONS[language] || TRANSLATIONS.ar;
}

function translatePath(path, language = getSavedLanguage()) {
    const translation = getTranslations(language);

    return path.split(".").reduce(
        (value, key) => value?.[key],
        translation
    ) ?? path;
}
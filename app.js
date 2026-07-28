"use strict";

/* =========================================================
   Sales Operations Platform
   app.js
========================================================= */

window.DashboardApp = (() => {
    const config = window.DashboardConfig;
    const utils = window.DashboardUtils;
    const api = window.DashboardAPI;
    const auth = window.DashboardAuth;

    if (!config || !utils || !api || !auth) {
        throw new Error(
            "Dashboard core files are not available."
        );
    }

    const state = {
        language:
            config.DEFAULT_LANGUAGE || "ar",

        theme:
            config.DEFAULT_THEME || "light",

        currentPage: "dashboard",

        rawData: {
            summary: {},
            counts: {},
            filters: {},
            filterOptions: {},
            target: [],
            invoices: [],
            collections: [],
            dueOverdue: [],
            updatedAt: ""
        },

        filteredData: {
            summary: {},
            counts: {},
            filters: {},
            target: [],
            invoices: [],
            collections: [],
            dueOverdue: [],
            updatedAt: ""
        }
    };

    let eventsBound = false;


    /* =====================================================
       تشغيل دالة من أي Module بأمان
    ===================================================== */

    function callModule(
        module,
        method,
        ...parameters
    ) {
        if (
            module &&
            typeof module[method] ===
                "function"
        ) {
            return module[method](
                ...parameters
            );
        }

        return null;
    }


    /* =====================================================
       اللغة
    ===================================================== */

    function getCurrentLanguage() {
        if (
            typeof window.getSavedLanguage ===
            "function"
        ) {
            return (
                window.getSavedLanguage() ||
                config.DEFAULT_LANGUAGE ||
                "ar"
            );
        }

        return (
            localStorage.getItem(
                config.LANGUAGE_STORAGE_KEY
            ) ||
            config.DEFAULT_LANGUAGE ||
            "ar"
        );
    }

    function saveCurrentLanguage(language) {
        if (
            typeof window.saveLanguage ===
            "function"
        ) {
            window.saveLanguage(language);
            return;
        }

        localStorage.setItem(
            config.LANGUAGE_STORAGE_KEY,
            language
        );
    }

    function translateInterface() {
        utils
            .$$("[data-i18n]")
            .forEach(element => {
                const key =
                    element.dataset.i18n;

                if (!key) {
                    return;
                }

                const value =
                    typeof window.translatePath ===
                    "function"
                        ? window.translatePath(
                              key,
                              state.language
                          )
                        : key;

                if (
                    value &&
                    value !== key
                ) {
                    element.textContent =
                        value;
                }
            });

        utils
            .$$(
                "[data-i18n-placeholder]"
            )
            .forEach(element => {
                const key =
                    element.dataset
                        .i18nPlaceholder;

                if (!key) {
                    return;
                }

                const value =
                    typeof window.translatePath ===
                    "function"
                        ? window.translatePath(
                              key,
                              state.language
                          )
                        : "";

                if (value) {
                    element.placeholder =
                        value;
                }
            });
    }

    function applyLanguage(language) {
        state.language =
            language === "en"
                ? "en"
                : "ar";

        saveCurrentLanguage(
            state.language
        );

        const translations =
            typeof window.getTranslations ===
            "function"
                ? window.getTranslations(
                      state.language
                  )
                : null;

        document.documentElement.lang =
            translations?.languageCode ||
            state.language;

        document.documentElement.dir =
            translations?.direction ||
            (
                state.language === "ar"
                    ? "rtl"
                    : "ltr"
            );

        translateInterface();

        utils.setText(
            "languageButtonText",
            state.language === "ar"
                ? "English"
                : "العربية"
        );

        utils.setText(
            "loginLanguageText",
            state.language === "ar"
                ? "English"
                : "العربية"
        );

        refreshVisibleModules();
        updatePageHeading();
    }


    /* =====================================================
       المظهر
    ===================================================== */

    function applyTheme(theme) {
        state.theme =
            theme === "dark"
                ? "dark"
                : "light";

        document.body.classList.toggle(
            "dark-mode",
            state.theme === "dark"
        );

        localStorage.setItem(
            config.THEME_STORAGE_KEY,
            state.theme
        );

        callModule(
            window.DashboardDashboard,
            "refresh"
        );
    }


    /* =====================================================
       التحميل
    ===================================================== */

    function showLoading() {
        auth.showLoading();
    }

    function hideLoading() {
        auth.hideLoading();
    }

    function showLogin() {
        hideLoading();
        auth.showLoginPage();
    }

    function showApplication() {
        auth.showApplication();
        hideLoading();
    }


    /* =====================================================
       قراءة الفلاتر
    ===================================================== */

    function getFilterValues() {
        return {
            branch:
                utils.byId(
                    "branchFilter"
                )?.value || "",

            salesmanCode:
                utils.byId(
                    "salesmanFilter"
                )?.value || "",

            dateFrom:
                utils.byId(
                    "fromDateFilter"
                )?.value || "",

            dateTo:
                utils.byId(
                    "toDateFilter"
                )?.value || ""
        };
    }

    function getRowSalesmanCode(row) {
        return utils.normalizeCode(
            utils.firstValue(
                row,
                [
                    "salesmanCode",
                    "Salesman Code",
                    "salesCode"
                ],
                ""
            )
        );
    }

    function getRowBranch(row) {
        return String(
            utils.firstValue(
                row,
                [
                    "branch",
                    "Branch",
                    "sheetBranch"
                ],
                ""
            )
        ).trim();
    }

    function getRowDate(
        row,
        dateFields
    ) {
        return utils.firstValue(
            row,
            dateFields,
            ""
        );
    }

    function rowMatchesFilters(
        row,
        filters,
        dateFields = []
    ) {
        if (
            filters.branch &&
            getRowBranch(row) !==
                filters.branch
        ) {
            return false;
        }

        if (
            filters.salesmanCode &&
            getRowSalesmanCode(row) !==
                filters.salesmanCode
        ) {
            return false;
        }

        if (dateFields.length) {
            const rowDate =
                getRowDate(
                    row,
                    dateFields
                );

            if (
                !utils.isDateInRange(
                    rowDate,
                    filters.dateFrom,
                    filters.dateTo
                )
            ) {
                return false;
            }
        }

        return true;
    }


    /* =====================================================
       تطبيق الفلاتر
    ===================================================== */

    function applyLocalFilters() {
        const filters =
            getFilterValues();

        const currentUser =
            auth.getUser();

        if (
            currentUser &&
            !currentUser.isManagement
        ) {
            filters.salesmanCode =
                currentUser.salesmanCode;
        }

        const target =
            state.rawData.target.filter(
                row =>
                    rowMatchesFilters(
                        row,
                        filters
                    )
            );

        const invoices =
            state.rawData.invoices.filter(
                row =>
                    rowMatchesFilters(
                        row,
                        filters,
                        [
                            "invoiceDate",
                            "Invoice Date",
                            "date"
                        ]
                    )
            );

        const collections =
            state.rawData.collections.filter(
                row =>
                    rowMatchesFilters(
                        row,
                        filters,
                        [
                            "collectionDate",
                            "Collection Date",
                            "paymentDate",
                            "date"
                        ]
                    )
            );

        const dueOverdue =
            state.rawData.dueOverdue.filter(
                row =>
                    rowMatchesFilters(
                        row,
                        filters,
                        [
                            "invoiceDate",
                            "Invoice Date",
                            "date"
                        ]
                    )
            );

        state.filteredData = {
            summary: {},
            counts: {
                target:
                    target.length,

                invoices:
                    invoices.length,

                collections:
                    collections.length,

                dueOverdue:
                    dueOverdue.length
            },

            filters,
            target,
            invoices,
            collections,
            dueOverdue,

            updatedAt:
                state.rawData.updatedAt
        };

        distributeData(
            state.filteredData
        );

        return state.filteredData;
    }


    /* =====================================================
       توزيع البيانات على الملفات
    ===================================================== */

    function distributeData(data) {
        /*
         * dashboard.js لا يحتوي على setData.
         * يجب إرسال البيانات مباشرة إلى render.
         */
        callModule(
            window.DashboardDashboard,
            "render",
            data
        );

        callModule(
            window.DashboardInvoices,
            "setData",
            data.invoices
        );

        callModule(
            window.DashboardCollections,
            "setData",
            data.collections
        );

        callModule(
            window.DashboardDue,
            "setData",
            data.dueOverdue
        );

        callModule(
            window.DashboardTargets,
            "setTargets",
            data.target
        );

        callModule(
            window.DashboardTargets,
            "setInvoices",
            data.invoices
        );

        callModule(
            window.DashboardProfiles,
            "setData",
            data
        );

        callModule(
            window.DashboardReports,
            "setData",
            data
        );

        callModule(
            window.DashboardSalesIntelligence,
            "setData",
            data
        );

        callModule(
            window.DashboardAlerts,
            "setData",
            data
        );

        updateLastUpdate(
            data.updatedAt
        );
    }


    /* =====================================================
       إعادة الرسم دون مسح البيانات
    ===================================================== */

    function refreshVisibleModules() {
        /*
         * refresh يحافظ على بيانات dashboard.js الحالية.
         * لا نستدعي render بدون بيانات.
         */
        callModule(
            window.DashboardDashboard,
            "refresh"
        );

        callModule(
            window.DashboardInvoices,
            "render"
        );

        callModule(
            window.DashboardCollections,
            "render"
        );

        callModule(
            window.DashboardDue,
            "render"
        );

        callModule(
            window.DashboardTargets,
            "render"
        );

        callModule(
            window.DashboardProfiles,
            "render"
        );

        callModule(
            window.DashboardSalesIntelligence,
            "refresh"
        );

        callModule(
            window.DashboardAlerts,
            "refresh"
        );
    }


    /* =====================================================
       تهيئة الملفات
    ===================================================== */

    function initializeModules() {
        callModule(
            window.DashboardInvoices,
            "initialize"
        );

        callModule(
            window.DashboardCollections,
            "initialize"
        );

        callModule(
            window.DashboardDue,
            "initialize"
        );

        callModule(
            window.DashboardTargets,
            "initialize"
        );

        callModule(
            window.DashboardProfiles,
            "initialize"
        );

        callModule(
            window.DashboardReports,
            "initialize"
        );

        callModule(
            window.DashboardSalesIntelligence,
            "initialize"
        );

        callModule(
            window.DashboardAlerts,
            "initialize"
        );
    }


    /* =====================================================
       خيارات الفروع والمندوبين
    ===================================================== */

    function buildBranchOptions() {
        return utils
            .uniqueValues(
                [
                    ...state.rawData.target.map(
                        getRowBranch
                    ),

                    ...state.rawData.invoices.map(
                        getRowBranch
                    ),

                    ...state.rawData.collections.map(
                        getRowBranch
                    ),

                    ...state.rawData.dueOverdue.map(
                        getRowBranch
                    )
                ]
            )
            .sort((first, second) =>
                first.localeCompare(
                    second,
                    utils.getLocale(),
                    {
                        numeric: true
                    }
                )
            );
    }

    function buildSalesmanOptions() {
        const salesmanMap =
            new Map();

        [
            ...state.rawData.target,
            ...state.rawData.invoices,
            ...state.rawData.collections,
            ...state.rawData.dueOverdue
        ].forEach(row => {
            const code =
                getRowSalesmanCode(row);

            if (!code) {
                return;
            }

            const name =
                String(
                    utils.firstValue(
                        row,
                        [
                            "salesmanName",
                            "Salesman Name",
                            "name"
                        ],
                        code
                    )
                ).trim();

            const branch =
                getRowBranch(row);

            if (
                !salesmanMap.has(code)
            ) {
                salesmanMap.set(
                    code,
                    {
                        code,
                        name:
                            name || code,
                        branch
                    }
                );
            }
        });

        return Array.from(
            salesmanMap.values()
        ).sort(
            (first, second) =>
                first.name.localeCompare(
                    second.name,
                    utils.getLocale(),
                    {
                        numeric: true
                    }
                )
        );
    }

    function populateFilters() {
        const branchSelect =
            utils.byId(
                "branchFilter"
            );

        const salesmanSelect =
            utils.byId(
                "salesmanFilter"
            );

        const profileSelect =
            utils.byId(
                "profileSalesmanSelect"
            );

        const oldBranch =
            branchSelect?.value || "";

        const oldSalesman =
            salesmanSelect?.value || "";

        const oldProfile =
            profileSelect?.value || "";

        const serverBranches =
            state.rawData
                .filterOptions
                ?.branches;

        const branches =
            Array.isArray(
                serverBranches
            )
                ? serverBranches
                : buildBranchOptions();

        const serverSalesmen =
            state.rawData
                .filterOptions
                ?.salesmen;

        const salesmen =
            Array.isArray(
                serverSalesmen
            )
                ? serverSalesmen
                      .map(item => ({
                          code:
                              utils.normalizeCode(
                                  item.salesmanCode ||
                                      item.code
                              ),

                          name:
                              item.salesmanName ||
                              item.name ||
                              item.salesmanCode ||
                              item.code,

                          branch:
                              item.branch || ""
                      }))
                      .filter(
                          item => item.code
                      )
                : buildSalesmanOptions();

        if (branchSelect) {
            branchSelect.innerHTML = `
                <option value="">
                    ${utils.escapeHTML(
                        utils.t(
                            "common.allBranches",
                            "جميع الفروع"
                        )
                    )}
                </option>

                ${branches
                    .filter(Boolean)
                    .map(
                        branch => `
                            <option value="${utils.escapeHTML(
                                branch
                            )}">
                                ${utils.escapeHTML(
                                    branch
                                )}
                            </option>
                        `
                    )
                    .join("")}
            `;

            if (
                branches.includes(
                    oldBranch
                )
            ) {
                branchSelect.value =
                    oldBranch;
            }
        }

        const salesmanOptions =
            salesmen
                .map(
                    salesman => `
                        <option value="${utils.escapeHTML(
                            salesman.code
                        )}">
                            ${utils.escapeHTML(
                                salesman.name ||
                                    salesman.code
                            )}
                        </option>
                    `
                )
                .join("");

        if (salesmanSelect) {
            salesmanSelect.innerHTML = `
                <option value="">
                    ${utils.escapeHTML(
                        utils.t(
                            "common.allSalesmen",
                            "جميع المندوبين"
                        )
                    )}
                </option>

                ${salesmanOptions}
            `;

            if (
                salesmen.some(
                    salesman =>
                        salesman.code ===
                        oldSalesman
                )
            ) {
                salesmanSelect.value =
                    oldSalesman;
            }
        }

        if (profileSelect) {
            profileSelect.innerHTML =
                salesmanOptions;

            const authenticatedCode =
                auth.getSalesmanCode();

            const selectedCode =
                oldProfile ||
                authenticatedCode ||
                salesmen[0]?.code ||
                "";

            profileSelect.value =
                selectedCode;
        }

        auth.applyPermissions();
    }


    /* =====================================================
       تحميل البيانات
    ===================================================== */

    async function loadData() {
        const token =
            auth.getToken();

        if (!token) {
            throw new Error(
                "Session token is missing."
            );
        }

        showLoading();

        try {
            const response =
                await api.dashboard(
                    token
                );

            state.rawData = {
                summary:
                    response.summary ||
                    {},

                counts:
                    response.counts ||
                    {},

                filters:
                    response.filters ||
                    {},

                filterOptions:
                    response.filterOptions ||
                    {},

                target:
                    Array.isArray(
                        response.target
                    )
                        ? response.target
                        : [],

                invoices:
                    Array.isArray(
                        response.invoices
                    )
                        ? response.invoices
                        : [],

                collections:
                    Array.isArray(
                        response.collections
                    )
                        ? response.collections
                        : [],

                dueOverdue:
                    Array.isArray(
                        response.dueOverdue
                    )
                        ? response.dueOverdue
                        : [],

                updatedAt:
                    response.updatedAt ||
                    ""
            };

            if (response.user) {
                auth.updateUser(
                    response.user
                );
            }

            populateFilters();
            applyLocalFilters();

            return state.rawData;
        } finally {
            hideLoading();
        }
    }


    /* =====================================================
       آخر تحديث
    ===================================================== */

    function updateLastUpdate(value) {
        const formatted =
            value
                ? utils.formatDateTime(
                      value
                  )
                : utils.formatDateTime(
                      new Date()
                  );

        [
            "lastUpdateText",
            "lastUpdated",
            "updatedAt"
        ].forEach(id => {
            utils.setText(
                id,
                formatted
            );
        });

        utils
            .$$(
                "[data-last-updated]"
            )
            .forEach(element => {
                element.textContent =
                    formatted;
            });
    }


    /* =====================================================
       الصفحات
    ===================================================== */

    const pageTranslations = {
        dashboard: {
            title:
                "navigation.dashboard",

            subtitle:
                "dashboard.subtitle"
        },

        invoices: {
            title:
                "invoices.title",

            subtitle:
                "invoices.subtitle"
        },

        collections: {
            title:
                "collections.title",

            subtitle:
                "collections.subtitle"
        },

        dueOverdue: {
            title:
                "dueOverdue.title",

            subtitle:
                "dueOverdue.subtitle"
        },

        targets: {
            title:
                "targets.title",

            subtitle:
                "targets.subtitle"
        },

        salesmanProfiles: {
            title:
                "salesmanProfiles.title",

            subtitle:
                "salesmanProfiles.subtitle"
        },

        salesIntelligence: {
            title:
                "intelligence.title",

            subtitle:
                "intelligence.subtitle"
        },

        alerts: {
            title:
                "alerts.title",

            subtitle:
                "alerts.subtitle"
        },

        reports: {
            title:
                "reports.title",

            subtitle:
                "reports.subtitle"
        },

        settings: {
            title:
                "settings.title",

            subtitle:
                "settings.subtitle"
        }
    };

    function updatePageHeading() {
        const page =
            pageTranslations[
                state.currentPage
            ];

        if (!page) {
            return;
        }

        utils.setText(
            "pageTitle",
            utils.t(
                page.title,
                state.currentPage
            )
        );

        utils.setText(
            "pageSubtitle",
            utils.t(
                page.subtitle,
                ""
            )
        );
    }

    function showPage(pageName) {
        const currentUser =
            auth.getUser();

        let selectedPage =
            String(
                pageName || "dashboard"
            ).trim();

        if (
            currentUser &&
            !currentUser.isManagement &&
            [
                "salesmanProfiles",
                "salesIntelligence"
            ].includes(selectedPage)
        ) {
            selectedPage =
                "dashboard";
        }

        state.currentPage =
            selectedPage;

        utils
            .$$(".page-section")
            .forEach(section => {
                const active =
                    section.dataset
                        .pageSection ===
                    selectedPage;

                section.classList.toggle(
                    "active",
                    active
                );

                section.classList.toggle(
                    "hidden",
                    !active
                );
            });

        utils
            .$$(
                ".navigation-item[data-page]"
            )
            .forEach(button => {
                button.classList.toggle(
                    "active",
                    button.dataset.page ===
                        selectedPage
                );
            });

        updatePageHeading();
        closeSidebar();

        if (
            selectedPage ===
            "dashboard"
        ) {
            callModule(
                window.DashboardDashboard,
                "refresh"
            );
        }

        if (
            selectedPage ===
            "salesmanProfiles"
        ) {
            callModule(
                window.DashboardProfiles,
                "render"
            );
        }

        if (
            selectedPage ===
            "salesIntelligence"
        ) {
            callModule(
                window.DashboardSalesIntelligence,
                "refresh"
            );
        }

        if (
            selectedPage ===
            "alerts"
        ) {
            callModule(
                window.DashboardAlerts,
                "refresh"
            );
        }

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }


    /* =====================================================
       القائمة الجانبية
    ===================================================== */

    function openSidebar() {
        utils.byId(
            "sidebar"
        )?.classList.add("open");

        utils.byId(
            "sidebarOverlay"
        )?.classList.add(
            "active"
        );
    }

    function closeSidebar() {
        utils.byId(
            "sidebar"
        )?.classList.remove(
            "open"
        );

        utils.byId(
            "sidebarOverlay"
        )?.classList.remove(
            "active"
        );
    }


    /* =====================================================
       كلمة المرور
    ===================================================== */

    function togglePassword() {
        const input =
            utils.byId(
                "passwordInput"
            );

        const icon =
            utils
                .byId(
                    "passwordToggle"
                )
                ?.querySelector("i");

        if (!input) {
            return;
        }

        const showPassword =
            input.type === "password";

        input.type =
            showPassword
                ? "text"
                : "password";

        icon?.classList.toggle(
            "fa-eye",
            !showPassword
        );

        icon?.classList.toggle(
            "fa-eye-slash",
            showPassword
        );
    }


    /* =====================================================
       تسجيل الدخول
    ===================================================== */

    async function handleLogin(event) {
        event.preventDefault();

        const username =
            utils.byId(
                "usernameInput"
            )?.value.trim() || "";

        const password =
            utils.byId(
                "passwordInput"
            )?.value || "";

        const message =
            utils.byId(
                "loginMessage"
            );

        const button =
            utils.byId(
                "loginButton"
            );

        if (message) {
            message.textContent = "";
        }

        if (button) {
            button.disabled = true;
        }

        try {
            const result =
                await auth.login(
                    username,
                    password
                );

            if (message) {
                message.textContent =
                    result.message || "";
            }

            await openApplication();
        } catch (error) {
            if (message) {
                message.textContent =
                    error.message;
            }
        } finally {
            if (button) {
                button.disabled =
                    false;
            }
        }
    }


    /* =====================================================
       تسجيل الخروج
    ===================================================== */

    async function handleLogout() {
        showLoading();

        try {
            await auth.logout();
        } finally {
            window.location.reload();
        }
    }


    /* =====================================================
       إعادة ضبط الفلاتر
    ===================================================== */

    function resetFilters() {
        [
            "branchFilter",
            "salesmanFilter",
            "fromDateFilter",
            "toDateFilter"
        ].forEach(id => {
            const element =
                utils.byId(id);

            if (element) {
                element.value = "";
            }
        });

        applyLocalFilters();
    }


    /* =====================================================
       الأحداث
    ===================================================== */

    function bindEvents() {
        if (eventsBound) {
            return;
        }

        utils.byId(
            "loginForm"
        )?.addEventListener(
            "submit",
            handleLogin
        );

        utils.byId(
            "passwordToggle"
        )?.addEventListener(
            "click",
            togglePassword
        );

        utils
            .$$(
                ".navigation-item[data-page]"
            )
            .forEach(button => {
                button.addEventListener(
                    "click",
                    () => {
                        showPage(
                            button.dataset.page
                        );
                    }
                );
            });

        utils.byId(
            "applyFiltersButton"
        )?.addEventListener(
            "click",
            applyLocalFilters
        );

        utils.byId(
            "resetFiltersButton"
        )?.addEventListener(
            "click",
            resetFilters
        );

        utils.byId(
            "refreshButton"
        )?.addEventListener(
            "click",
            async () => {
                try {
                    await loadData();

                    utils.showToast(
                        utils.t(
                            "common.refresh",
                            "تم تحديث البيانات"
                        ),
                        "success"
                    );
                } catch (error) {
                    utils.showToast(
                        error.message,
                        "error"
                    );
                }
            }
        );

        [
            "languageButton",
            "loginLanguageButton"
        ].forEach(id => {
            utils.byId(id)
                ?.addEventListener(
                    "click",
                    () => {
                        applyLanguage(
                            state.language ===
                                "ar"
                                ? "en"
                                : "ar"
                        );
                    }
                );
        });

        utils.byId(
            "themeButton"
        )?.addEventListener(
            "click",
            () => {
                applyTheme(
                    state.theme ===
                        "dark"
                        ? "light"
                        : "dark"
                );
            }
        );

        utils.byId(
            "menuButton"
        )?.addEventListener(
            "click",
            openSidebar
        );

        utils.byId(
            "sidebarCloseButton"
        )?.addEventListener(
            "click",
            closeSidebar
        );

        utils.byId(
            "sidebarOverlay"
        )?.addEventListener(
            "click",
            closeSidebar
        );

        utils.byId(
            "logoutButton"
        )?.addEventListener(
            "click",
            () => {
                utils.show(
                    "logoutModal"
                );
            }
        );

        utils.byId(
            "cancelLogoutButton"
        )?.addEventListener(
            "click",
            () => {
                utils.hide(
                    "logoutModal"
                );
            }
        );

        utils.byId(
            "confirmLogoutButton"
        )?.addEventListener(
            "click",
            handleLogout
        );

        eventsBound = true;
    }


    /* =====================================================
       فتح التطبيق
    ===================================================== */

    async function openApplication() {
        showLoading();

        auth.updateUserInterface();
        auth.applyPermissions();

        await loadData();

        auth.updateUserInterface();
        auth.applyPermissions();

        showApplication();
        showPage("dashboard");
    }


    /* =====================================================
       بدء التطبيق
    ===================================================== */

    async function initialize() {
        state.language =
            getCurrentLanguage();

        state.theme =
            localStorage.getItem(
                config.THEME_STORAGE_KEY
            ) ||
            config.DEFAULT_THEME ||
            "light";

        applyLanguage(
            state.language
        );

        applyTheme(
            state.theme
        );

        bindEvents();
        initializeModules();

        showLoading();

        const storedSession =
            auth.readSession();

        if (!storedSession) {
            showLogin();
            return;
        }

        try {
            const validation =
                await auth.validateSession();

            if (!validation.valid) {
                auth.clearSession();
                showLogin();
                return;
            }

            await openApplication();
        } catch (error) {
            console.error(error);

            auth.clearSession();
            showLogin();
        }
    }


    /* =====================================================
       الدوال المتاحة
    ===================================================== */

    return Object.freeze({
        initialize,
        bindEvents,

        getState() {
            return state;
        },

        applyLanguage,
        applyTheme,

        loadData,
        applyLocalFilters,
        populateFilters,
        distributeData,

        showPage,
        openSidebar,
        closeSidebar,

        openApplication,
        showLogin
    });
})();


document.addEventListener(
    "DOMContentLoaded",
    () => {
        window.DashboardApp
            .initialize()
            .catch(error => {
                console.error(error);

                window.DashboardUtils
                    ?.showToast(
                        error.message,
                        "error"
                    );
            });
    }
);
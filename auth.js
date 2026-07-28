"use strict";

/* =========================================================
   Sales Operations Platform
   auth.js
   إدارة تسجيل الدخول والجلسات والصلاحيات
========================================================= */

window.DashboardAuth = (() => {
    const config = window.DashboardConfig;
    const utils = window.DashboardUtils;
    const api = window.DashboardAPI;

    if (!config) {
        throw new Error(
            "DashboardConfig is not available. Load utils.js before auth.js."
        );
    }

    if (!utils) {
        throw new Error(
            "DashboardUtils is not available. Load utils.js before auth.js."
        );
    }

    if (!api) {
        throw new Error(
            "DashboardAPI is not available. Load api.js before auth.js."
        );
    }

    let currentSession = null;

    /* =====================================================
       توحيد بيانات المستخدم
    ===================================================== */

    function normalizeUser(user = {}) {
        const salesmanCode =
            utils.normalizeCode(
                utils.firstValue(
                    user,
                    [
                        "salesmanCode",
                        "Salesman Code",
                        "salesCode",
                        "code"
                    ],
                    ""
                )
            );

        const username =
            String(
                utils.firstValue(
                    user,
                    [
                        "username",
                        "Username",
                        "userName"
                    ],
                    ""
                )
            ).trim();

        const salesmanName =
            String(
                utils.firstValue(
                    user,
                    [
                        "salesmanName",
                        "Salesman Name",
                        "name",
                        "fullName"
                    ],
                    username || "Management"
                )
            ).trim();

        const branch =
            String(
                utils.firstValue(
                    user,
                    [
                        "branch",
                        "Branch"
                    ],
                    ""
                )
            ).trim();

        const roleValue =
            String(
                utils.firstValue(
                    user,
                    [
                        "role",
                        "Role",
                        "userType"
                    ],
                    salesmanCode
                        ? "salesman"
                        : "management"
                )
            )
                .trim()
                .toLowerCase();

        const isManagement =
            user.isManagement === true ||
            !salesmanCode ||
            roleValue === "management" ||
            roleValue === "admin" ||
            roleValue === "manager" ||
            roleValue.includes("management") ||
            roleValue.includes("admin");

        return {
            username:
                username ||
                salesmanName ||
                "Management",

            salesmanCode,

            salesmanName:
                salesmanName ||
                username ||
                "Management",

            name:
                salesmanName ||
                username ||
                "Management",

            branch,

            role:
                isManagement
                    ? "management"
                    : "salesman",

            isManagement
        };
    }

    /* =====================================================
       توحيد بيانات الجلسة
    ===================================================== */

    function normalizeSession(session) {
        if (
            !session ||
            typeof session !== "object"
        ) {
            return null;
        }

        const token =
            String(
                session.token ?? ""
            ).trim();

        if (!token) {
            return null;
        }

        return {
            token,

            expiresAt:
                session.expiresAt || "",

            sessionHours:
                utils.toNumber(
                    session.sessionHours
                ),

            user:
                normalizeUser(
                    session.user || {}
                )
        };
    }

    /* =====================================================
       حفظ واسترجاع الجلسة
    ===================================================== */

    function saveSession(session) {
        const normalized =
            normalizeSession(session);

        if (!normalized) {
            throw new Error(
                "Unable to save an invalid session."
            );
        }

        const saved =
            utils.writeJSON(
                config.SESSION_STORAGE_KEY,
                normalized
            );

        if (!saved) {
            throw new Error(
                "Unable to save the user session."
            );
        }

        currentSession = normalized;

        return normalized;
    }

    function readSession() {
        if (currentSession) {
            return currentSession;
        }

        const stored =
            utils.readJSON(
                config.SESSION_STORAGE_KEY,
                null
            );

        currentSession =
            normalizeSession(stored);

        if (
            stored &&
            !currentSession
        ) {
            clearSession();
        }

        return currentSession;
    }

    function clearSession() {
        currentSession = null;

        utils.removeStorage(
            config.SESSION_STORAGE_KEY
        );
    }

    /* =====================================================
       بيانات الجلسة الحالية
    ===================================================== */

    function getSession() {
        return readSession();
    }

    function getToken() {
        return (
            readSession()?.token ||
            ""
        );
    }

    function getUser() {
        return (
            readSession()?.user ||
            null
        );
    }

    function isLoggedIn() {
        return Boolean(
            getToken()
        );
    }

    function isManagement() {
        return Boolean(
            getUser()?.isManagement
        );
    }

    function getSalesmanCode() {
        return (
            getUser()?.salesmanCode ||
            ""
        );
    }

    /* =====================================================
       فحص انتهاء تاريخ الجلسة محليًا
    ===================================================== */

    function isSessionExpiredLocally(
        session = readSession()
    ) {
        if (!session) {
            return true;
        }

        if (!session.expiresAt) {
            return false;
        }

        const expiresAt =
            utils.parseDate(
                session.expiresAt
            );

        if (!expiresAt) {
            return false;
        }

        return (
            expiresAt.getTime() <=
            Date.now()
        );
    }

    /* =====================================================
       تسجيل الدخول
    ===================================================== */

    async function login(
        username,
        password
    ) {
        const result =
            await api.login(
                username,
                password
            );

        const session =
            saveSession({
                token:
                    result.token,

                expiresAt:
                    result.expiresAt,

                sessionHours:
                    result.sessionHours,

                user:
                    result.user
            });

        return {
            success: true,
            session,
            user: session.user,
            message:
                result.message ||
                utils.t(
                    "login.loginSuccess",
                    "تم تسجيل الدخول بنجاح"
                )
        };
    }

    /* =====================================================
       التحقق من الجلسة على السيرفر
    ===================================================== */

    async function validateSession() {
        const session =
            readSession();

        if (!session) {
            return {
                valid: false,
                reason: "NO_SESSION"
            };
        }

        if (
            isSessionExpiredLocally(
                session
            )
        ) {
            clearSession();

            return {
                valid: false,
                reason: "SESSION_EXPIRED"
            };
        }

        try {
            const response =
                await api.session(
                    session.token
                );

            if (
                response?.authenticated !== true &&
                response?.success === false
            ) {
                clearSession();

                return {
                    valid: false,
                    reason:
                        response?.error ||
                        "INVALID_SESSION"
                };
            }

            const updatedSession =
                saveSession({
                    token:
                        session.token,

                    expiresAt:
                        response?.expiresAt ||
                        session.expiresAt,

                    sessionHours:
                        session.sessionHours,

                    user:
                        response?.user ||
                        session.user
                });

            return {
                valid: true,
                session:
                    updatedSession,
                user:
                    updatedSession.user
            };
        } catch (error) {
            const errorCode =
                String(
                    error?.code || ""
                ).toUpperCase();

            const errorMessage =
                String(
                    error?.message || ""
                ).toLowerCase();

            const sessionInvalid =
                errorCode.includes("SESSION") ||
                errorCode.includes("TOKEN") ||
                errorMessage.includes("session") ||
                errorMessage.includes("token") ||
                errorMessage.includes("expired");

            if (sessionInvalid) {
                clearSession();

                return {
                    valid: false,
                    reason:
                        errorCode ||
                        "INVALID_SESSION",
                    error
                };
            }

            /*
             * في حالة انقطاع الإنترنت لا نحذف الجلسة مباشرة.
             */
            return {
                valid: true,
                offline: true,
                session,
                user:
                    session.user,
                error
            };
        }
    }

    /* =====================================================
       تسجيل الخروج
    ===================================================== */

    async function logout() {
        const token =
            getToken();

        try {
            if (token) {
                await api.logout(token);
            }
        } catch (error) {
            console.warn(
                "Server logout failed:",
                error
            );
        } finally {
            clearSession();
        }

        return {
            success: true,
            message:
                utils.t(
                    "login.logoutSuccess",
                    "تم تسجيل الخروج بنجاح"
                )
        };
    }

    /* =====================================================
       تحديث بيانات المستخدم من استجابة الداشبورد
    ===================================================== */

    function updateUser(user) {
        const session =
            readSession();

        if (!session || !user) {
            return null;
        }

        return saveSession({
            ...session,
            user:
                normalizeUser(user)
        });
    }

    /* =====================================================
       التحكم في صلاحيات عناصر الصفحة
    ===================================================== */

    function applyPermissions() {
        const user =
            getUser();

        const management =
            Boolean(
                user?.isManagement
            );

        utils
            .$$(".management-only")
            .forEach(element => {
                element.classList.toggle(
                    "hidden",
                    !management
                );
            });

        const salesmanFilter =
            utils.byId(
                "salesmanFilter"
            );

        if (salesmanFilter) {
            if (management) {
                salesmanFilter.disabled =
                    false;
            } else {
                salesmanFilter.value =
                    user?.salesmanCode ||
                    "";

                salesmanFilter.disabled =
                    true;
            }
        }

        const profileSalesmanSelect =
            utils.byId(
                "profileSalesmanSelect"
            );

        if (profileSalesmanSelect) {
            if (management) {
                profileSalesmanSelect.disabled =
                    false;
            } else {
                profileSalesmanSelect.value =
                    user?.salesmanCode ||
                    "";

                profileSalesmanSelect.disabled =
                    true;
            }
        }
    }

    /* =====================================================
       تحديث اسم المستخدم داخل الواجهة
    ===================================================== */

    function updateUserInterface() {
        const user =
            getUser();

        if (!user) {
            return;
        }

        const displayName =
            user.salesmanName ||
            user.name ||
            user.username ||
            "Management";

        const roleText =
            user.isManagement
                ? "Management"
                : (
                    user.salesmanCode ||
                    "Salesman"
                );

        utils.setText(
            "sidebarUserName",
            displayName
        );

        utils.setText(
            "sidebarUserRole",
            roleText
        );

        utils.setText(
            "topbarUserName",
            displayName
        );

        utils.setText(
            "topbarUserRole",
            roleText
        );

        utils.setText(
            "settingsUsername",
            user.username ||
            displayName
        );

        utils.setText(
            "settingsSalesmanCode",
            user.salesmanCode ||
            utils.t(
                "common.notAvailable",
                "--"
            )
        );

        utils.setText(
            "settingsBranch",
            user.branch ||
            utils.t(
                "common.notAvailable",
                "--"
            )
        );

        applyPermissions();
    }

    /* =====================================================
       فتح شاشة الدخول أو التطبيق
    ===================================================== */

    function showLoginPage() {
        utils.show("loginPage");
        utils.hide("appShell");
        utils.hide("loadingScreen");

        const passwordInput =
            utils.byId(
                "passwordInput"
            );

        if (passwordInput) {
            passwordInput.value = "";
        }

        const loginMessage =
            utils.byId(
                "loginMessage"
            );

        if (loginMessage) {
            loginMessage.textContent = "";
        }
    }

    function showApplication() {
        utils.hide("loginPage");
        utils.show("appShell");

        updateUserInterface();
    }

    function showLoading() {
        utils.show("loadingScreen");
    }

    function hideLoading() {
        utils.hide("loadingScreen");
    }

    /* =====================================================
       إتاحة وظائف المصادقة لباقي الملفات
    ===================================================== */

    return Object.freeze({
        normalizeUser,
        normalizeSession,

        saveSession,
        readSession,
        clearSession,

        getSession,
        getToken,
        getUser,
        getSalesmanCode,

        isLoggedIn,
        isManagement,
        isSessionExpiredLocally,

        login,
        logout,
        validateSession,
        updateUser,

        applyPermissions,
        updateUserInterface,

        showLoginPage,
        showApplication,
        showLoading,
        hideLoading
    });
})();
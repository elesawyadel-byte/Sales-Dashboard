"use strict";

/* =========================================================
   Sales Operations Platform
   api.js
   الاتصال مع Google Apps Script
========================================================= */

window.DashboardAPI = (() => {
    const config = window.DashboardConfig;
    const utils = window.DashboardUtils;

    if (!config) {
        throw new Error(
            "DashboardConfig is not available. Load utils.js before api.js."
        );
    }

    if (!utils) {
        throw new Error(
            "DashboardUtils is not available. Load utils.js before api.js."
        );
    }

    const DEFAULT_TIMEOUT = 30000;

    /* =====================================================
       إنشاء رابط الطلب
    ===================================================== */

    function buildURL(parameters = {}) {
        const url = new URL(config.API_URL);

        Object.entries(parameters).forEach(
            ([key, value]) => {
                if (
                    value === undefined ||
                    value === null ||
                    value === ""
                ) {
                    return;
                }

                url.searchParams.set(
                    key,
                    String(value)
                );
            }
        );

        /*
         * منع استخدام نسخة مخزنة قديمة من الاستجابة.
         */
        url.searchParams.set(
            "_timestamp",
            String(Date.now())
        );

        return url.toString();
    }

    /* =====================================================
       قراءة استجابة السيرفر
    ===================================================== */

    async function parseResponse(response) {
        const responseText =
            await response.text();

        if (!responseText.trim()) {
            throw new Error(
                "The server returned an empty response."
            );
        }

        try {
            return JSON.parse(responseText);
        } catch (error) {
            console.error(
                "Invalid API response:",
                responseText
            );

            throw new Error(
                "The server response is not valid JSON."
            );
        }
    }

    /* =====================================================
       استخراج رسالة الخطأ
    ===================================================== */

    function getErrorMessage(
        payload,
        fallbackMessage = ""
    ) {
        return (
            payload?.message ||
            payload?.errorMessage ||
            payload?.error ||
            fallbackMessage ||
            "An unexpected API error occurred."
        );
    }

    /* =====================================================
       الطلب العام
    ===================================================== */

    async function request(
        parameters = {},
        options = {}
    ) {
        const timeout =
            Number(options.timeout) ||
            DEFAULT_TIMEOUT;

        const controller =
            new AbortController();

        const timeoutId =
            window.setTimeout(
                () => controller.abort(),
                timeout
            );

        try {
            const requestURL =
                buildURL(parameters);

            const response =
                await fetch(requestURL, {
                    method: "GET",
                    cache: "no-store",
                    redirect: "follow",
                    signal: controller.signal,
                    headers: {
                        Accept: "application/json"
                    }
                });

            if (!response.ok) {
                throw new Error(
                    `Server request failed: HTTP ${response.status}`
                );
            }

            const payload =
                await parseResponse(response);

            if (
                payload &&
                payload.success === false
            ) {
                const apiError =
                    new Error(
                        getErrorMessage(
                            payload,
                            "The API request failed."
                        )
                    );

                apiError.code =
                    payload.error ||
                    "API_ERROR";

                apiError.payload =
                    payload;

                throw apiError;
            }

            return payload;
        } catch (error) {
            if (error.name === "AbortError") {
                throw new Error(
                    "The server request timed out. Please try again."
                );
            }

            if (
                error instanceof TypeError &&
                String(error.message)
                    .toLowerCase()
                    .includes("fetch")
            ) {
                throw new Error(
                    "Unable to connect to Google Apps Script."
                );
            }

            throw error;
        } finally {
            window.clearTimeout(timeoutId);
        }
    }

    /* =====================================================
       فحص حالة السيرفر
    ===================================================== */

    async function health() {
        return request({
            action: "health"
        });
    }

    /* =====================================================
       تسجيل الدخول
    ===================================================== */

    async function login(
        username,
        password
    ) {
        const normalizedUsername =
            String(username ?? "").trim();

        const normalizedPassword =
            String(password ?? "");

        if (
            !normalizedUsername ||
            !normalizedPassword
        ) {
            throw new Error(
                utils.t(
                    "login.missingCredentials",
                    "يرجى إدخال اسم المستخدم وكلمة المرور"
                )
            );
        }

        const response =
            await request({
                action: "login",
                username:
                    normalizedUsername,
                password:
                    normalizedPassword
            });

        if (
            !response?.token ||
            !response?.user
        ) {
            console.error(
                "Invalid login response:",
                response
            );

            throw new Error(
                "Login succeeded, but the session information is incomplete."
            );
        }

        return {
            success: true,

            token:
                String(response.token),

            expiresAt:
                response.expiresAt || "",

            sessionHours:
                utils.toNumber(
                    response.sessionHours
                ),

            user:
                response.user,

            message:
                response.message || ""
        };
    }

    /* =====================================================
       تسجيل الخروج
    ===================================================== */

    async function logout(token) {
        const normalizedToken =
            String(token ?? "").trim();

        if (!normalizedToken) {
            return {
                success: true
            };
        }

        return request({
            action: "logout",
            token: normalizedToken
        });
    }

    /* =====================================================
       التحقق من صلاحية الجلسة
    ===================================================== */

    async function session(token) {
        const normalizedToken =
            String(token ?? "").trim();

        if (!normalizedToken) {
            throw new Error(
                "Session token is missing."
            );
        }

        return request({
            action: "session",
            token: normalizedToken
        });
    }

    /* =====================================================
       تحميل بيانات الداشبورد
    ===================================================== */

    async function dashboard(
        token,
        filters = {}
    ) {
        const normalizedToken =
            String(token ?? "").trim();

        if (!normalizedToken) {
            throw new Error(
                "Session token is missing."
            );
        }

        const parameters = {
            action: "dashboard",
            token: normalizedToken,

            dateFrom:
                filters.dateFrom || "",

            dateTo:
                filters.dateTo || "",

            branch:
                filters.branch || "",

            salesmanCode:
                filters.salesmanCode || "",

            customerCode:
                filters.customerCode || "",

            customerName:
                filters.customerName || "",

            invoiceType:
                filters.invoiceType || "",

            dueStatus:
                filters.dueStatus || ""
        };

        const response =
            await request(parameters, {
                timeout: 60000
            });

        /*
         * الاستجابة الصحيحة من Code.gs تحتوي مباشرة على:
         * target
         * invoices
         * collections
         * dueOverdue
         */
        return {
            success:
                response?.success !== false,

            updatedAt:
                response?.updatedAt || "",

            user:
                response?.user || null,

            filters:
                response?.filters || {},

            filterOptions:
                response?.filterOptions || {},

            summary:
                response?.summary || {},

            counts:
                response?.counts || {},

            target:
                Array.isArray(
                    response?.target
                )
                    ? response.target
                    : [],

            invoices:
                Array.isArray(
                    response?.invoices
                )
                    ? response.invoices
                    : [],

            collections:
                Array.isArray(
                    response?.collections
                )
                    ? response.collections
                    : [],

            dueOverdue:
                Array.isArray(
                    response?.dueOverdue
                )
                    ? response.dueOverdue
                    : []
        };
    }

    /* =====================================================
       اختبار سريع للاتصال من Console
    ===================================================== */

    async function testConnection() {
        try {
            const result =
                await health();

            console.log(
                "API connection successful:",
                result
            );

            return result;
        } catch (error) {
            console.error(
                "API connection failed:",
                error
            );

            throw error;
        }
    }

    /* =====================================================
       إتاحة الوظائف لباقي النظام
    ===================================================== */

    return Object.freeze({
        request,
        health,
        login,
        logout,
        session,
        dashboard,
        testConnection
    });
})();
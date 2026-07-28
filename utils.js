"use strict";

/* =========================================================
   Sales Operations Platform
   utils.js
   أدوات عامة مشتركة بين جميع ملفات النظام
========================================================= */

window.DashboardConfig = Object.freeze({
    API_URL:
        "https://script.google.com/macros/s/AKfycbzXfVCQpoYw7r7QDQpwvJqg95PdB1cBV-xzJlB6ne5BDowq1-GDnHpxYolgVTr-0gmx/exec",

    SESSION_STORAGE_KEY: "sales_operations_session",
    LANGUAGE_STORAGE_KEY: "sales_operations_language",
    THEME_STORAGE_KEY: "sales_operations_theme",

    PAGE_SIZE: 25,
    CURRENCY: "SAR",

    DEFAULT_LANGUAGE: "ar",
    DEFAULT_THEME: "light"
});


window.DashboardUtils = (() => {
    const config = window.DashboardConfig;

    /* =====================================================
       عناصر الصفحة
    ===================================================== */

    function $(selector, parent = document) {
        return parent.querySelector(selector);
    }

    function $$(selector, parent = document) {
        return Array.from(
            parent.querySelectorAll(selector)
        );
    }

    function byId(id) {
        return document.getElementById(id);
    }

    function setText(id, value) {
        const element = byId(id);

        if (element) {
            element.textContent = value ?? "";
        }
    }

    function setHTML(id, value) {
        const element = byId(id);

        if (element) {
            element.innerHTML = value ?? "";
        }
    }

    function show(elementOrId) {
        const element =
            typeof elementOrId === "string"
                ? byId(elementOrId)
                : elementOrId;

        element?.classList.remove("hidden");
    }

    function hide(elementOrId) {
        const element =
            typeof elementOrId === "string"
                ? byId(elementOrId)
                : elementOrId;

        element?.classList.add("hidden");
    }

    function toggleHidden(
        elementOrId,
        shouldHide
    ) {
        const element =
            typeof elementOrId === "string"
                ? byId(elementOrId)
                : elementOrId;

        element?.classList.toggle(
            "hidden",
            Boolean(shouldHide)
        );
    }


    /* =====================================================
       معالجة النصوص والأرقام
    ===================================================== */

    function normalizeText(value) {
        return String(value ?? "")
            .trim()
            .toLowerCase();
    }

    function normalizeCode(value) {
        return String(value ?? "").trim();
    }

    function toNumber(value) {
        if (typeof value === "number") {
            return Number.isFinite(value)
                ? value
                : 0;
        }

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return 0;
        }

        const normalized = String(value)
            .replace(/[٬,]/g, "")
            .replace(/[−–—]/g, "-")
            .replace(/[^0-9.\-]/g, "")
            .trim();

        const number = Number(normalized);

        return Number.isFinite(number)
            ? number
            : 0;
    }

    function firstValue(
        object,
        keys,
        fallback = ""
    ) {
        if (
            !object ||
            typeof object !== "object"
        ) {
            return fallback;
        }

        for (const key of keys) {
            if (
                Object.prototype.hasOwnProperty.call(
                    object,
                    key
                ) &&
                object[key] !== null &&
                object[key] !== undefined &&
                object[key] !== ""
            ) {
                return object[key];
            }
        }

        return fallback;
    }

    function sumBy(rows, getter) {
        if (!Array.isArray(rows)) {
            return 0;
        }

        return rows.reduce(
            (total, row) =>
                total + toNumber(getter(row)),
            0
        );
    }

    function uniqueValues(values) {
        if (!Array.isArray(values)) {
            return [];
        }

        return [
            ...new Set(
                values
                    .map(value =>
                        String(value ?? "").trim()
                    )
                    .filter(Boolean)
            )
        ];
    }

    function clamp(
        value,
        minimum,
        maximum
    ) {
        return Math.min(
            Math.max(toNumber(value), minimum),
            maximum
        );
    }

    function escapeHTML(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    /* =====================================================
       اللغة والتنسيق
    ===================================================== */

    function getLanguage() {
        if (
            typeof window.getSavedLanguage ===
            "function"
        ) {
            return window.getSavedLanguage();
        }

        return (
            localStorage.getItem(
                config.LANGUAGE_STORAGE_KEY
            ) ||
            config.DEFAULT_LANGUAGE
        );
    }

    function getLocale(
        language = getLanguage()
    ) {
        if (
            typeof window.getTranslations ===
            "function"
        ) {
            const translations =
                window.getTranslations(language);

            if (translations?.locale) {
                return translations.locale;
            }
        }

        return language === "en"
            ? "en-SA"
            : "ar-SA";
    }

    function t(key, fallback = "") {
        if (
            typeof window.translatePath ===
            "function"
        ) {
            const value =
                window.translatePath(
                    key,
                    getLanguage()
                );

            if (
                value &&
                value !== key
            ) {
                return value;
            }
        }

        return fallback || key;
    }

    function formatNumber(
        value,
        options = {}
    ) {
        return new Intl.NumberFormat(
            getLocale(),
            {
                maximumFractionDigits: 0,
                ...options
            }
        ).format(toNumber(value));
    }

    function formatCurrency(
        value,
        options = {}
    ) {
        return new Intl.NumberFormat(
            getLocale(),
            {
                style: "currency",
                currency: config.CURRENCY,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
                ...options
            }
        ).format(toNumber(value));
    }

    function formatPercentage(
        value,
        options = {}
    ) {
        return (
            new Intl.NumberFormat(
                getLocale(),
                {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                    ...options
                }
            ).format(toNumber(value)) + "%"
        );
    }


    /* =====================================================
       التواريخ
    ===================================================== */

    function parseDate(value) {
        if (!value) {
            return null;
        }

        if (value instanceof Date) {
            return Number.isNaN(
                value.getTime()
            )
                ? null
                : new Date(value);
        }

        if (typeof value === "number") {
            const numericDate =
                new Date(value);

            return Number.isNaN(
                numericDate.getTime()
            )
                ? null
                : numericDate;
        }

        const text =
            String(value).trim();

        if (!text) {
            return null;
        }

        const directDate =
            new Date(text);

        if (
            !Number.isNaN(
                directDate.getTime()
            )
        ) {
            return directDate;
        }

        const parts = text
            .split(/[\/\-.]/)
            .map(part => part.trim());

        if (parts.length !== 3) {
            return null;
        }

        let year;
        let month;
        let day;

        if (parts[0].length === 4) {
            year = Number(parts[0]);
            month = Number(parts[1]) - 1;
            day = Number(parts[2]);
        } else {
            day = Number(parts[0]);
            month = Number(parts[1]) - 1;
            year = Number(parts[2]);
        }

        const parsed =
            new Date(year, month, day);

        return Number.isNaN(
            parsed.getTime()
        )
            ? null
            : parsed;
    }

    function formatDate(
        value,
        options = {}
    ) {
        const date = parseDate(value);

        if (!date) {
            return t(
                "common.notAvailable",
                "--"
            );
        }

        return new Intl.DateTimeFormat(
            getLocale(),
            {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                ...options
            }
        ).format(date);
    }

    function formatDateTime(
        value,
        options = {}
    ) {
        const date =
            parseDate(value) ||
            new Date();

        return new Intl.DateTimeFormat(
            getLocale(),
            {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                ...options
            }
        ).format(date);
    }

    function dateToInputValue(value) {
        const date = parseDate(value);

        if (!date) {
            return "";
        }

        const year =
            date.getFullYear();

        const month =
            String(
                date.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                date.getDate()
            ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function isDateInRange(
        value,
        fromDate,
        toDate
    ) {
        const date = parseDate(value);

        if (!date) {
            return true;
        }

        date.setHours(0, 0, 0, 0);

        if (fromDate) {
            const from =
                new Date(
                    `${fromDate}T00:00:00`
                );

            if (
                !Number.isNaN(
                    from.getTime()
                ) &&
                date < from
            ) {
                return false;
            }
        }

        if (toDate) {
            const to =
                new Date(
                    `${toDate}T23:59:59`
                );

            if (
                !Number.isNaN(
                    to.getTime()
                ) &&
                date > to
            ) {
                return false;
            }
        }

        return true;
    }

    function daysBetween(
        firstDate,
        secondDate = new Date()
    ) {
        const first =
            parseDate(firstDate);

        const second =
            parseDate(secondDate);

        if (!first || !second) {
            return null;
        }

        first.setHours(0, 0, 0, 0);
        second.setHours(0, 0, 0, 0);

        return Math.floor(
            (
                second.getTime() -
                first.getTime()
            ) /
            (1000 * 60 * 60 * 24)
        );
    }


    /* =====================================================
       المجموعات وتقسيم الصفحات
    ===================================================== */

    function groupBy(rows, getter) {
        if (!Array.isArray(rows)) {
            return {};
        }

        return rows.reduce(
            (groups, row) => {
                const key = getter(row);

                if (!groups[key]) {
                    groups[key] = [];
                }

                groups[key].push(row);

                return groups;
            },
            {}
        );
    }

    function paginate(
        rows,
        page = 1,
        pageSize = config.PAGE_SIZE
    ) {
        const safeRows =
            Array.isArray(rows)
                ? rows
                : [];

        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    safeRows.length /
                    pageSize
                )
            );

        const currentPage =
            clamp(
                page,
                1,
                totalPages
            );

        const start =
            (currentPage - 1) *
            pageSize;

        return {
            rows: safeRows.slice(
                start,
                start + pageSize
            ),

            page: currentPage,
            pageSize,

            totalRows:
                safeRows.length,

            totalPages,

            firstRecord:
                safeRows.length
                    ? start + 1
                    : 0,

            lastRecord:
                Math.min(
                    start + pageSize,
                    safeRows.length
                )
        };
    }


    /* =====================================================
       التخزين المحلي
    ===================================================== */

    function readJSON(
        key,
        fallback = null
    ) {
        try {
            const value =
                localStorage.getItem(key);

            return value
                ? JSON.parse(value)
                : fallback;
        } catch (error) {
            console.warn(
                `Unable to read localStorage key: ${key}`,
                error
            );

            return fallback;
        }
    }

    function writeJSON(key, value) {
        try {
            localStorage.setItem(
                key,
                JSON.stringify(value)
            );

            return true;
        } catch (error) {
            console.warn(
                `Unable to write localStorage key: ${key}`,
                error
            );

            return false;
        }
    }

    function removeStorage(key) {
        localStorage.removeItem(key);
    }


    /* =====================================================
       رسائل الجداول والتنبيهات
    ===================================================== */

    function emptyTableRow(
        columnCount,
        message = ""
    ) {
        return `
            <tr>
                <td
                    colspan="${Number(columnCount) || 1}"
                    class="empty-table-message"
                >
                    ${escapeHTML(
                        message ||
                        t(
                            "common.noData",
                            "لا توجد بيانات متاحة"
                        )
                    )}
                </td>
            </tr>
        `;
    }

    function showToast(
        message,
        type = "info"
    ) {
        const container =
            byId("toastContainer");

        if (!container) {
            console.log(
                `[${type}] ${message}`
            );

            return;
        }

        const iconMap = {
            success:
                "fa-solid fa-circle-check",

            error:
                "fa-solid fa-circle-xmark",

            warning:
                "fa-solid fa-triangle-exclamation",

            info:
                "fa-solid fa-circle-info"
        };

        const normalizedType =
            Object.hasOwn(
                iconMap,
                type
            )
                ? type
                : "info";

        const toast =
            document.createElement("div");

        toast.className =
            `toast toast-${normalizedType}`;

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="${iconMap[normalizedType]}"></i>
            </div>

            <div class="toast-content">
                <strong>
                    ${escapeHTML(message)}
                </strong>
            </div>
        `;

        container.appendChild(toast);

        window.setTimeout(() => {
            toast.style.opacity = "0";

            toast.style.transform =
                "translateY(-8px)";

            window.setTimeout(
                () => toast.remove(),
                250
            );
        }, 3500);
    }


    /* =====================================================
       إتاحة الأدوات لباقي الملفات
    ===================================================== */

    return Object.freeze({
        $,
        $$,
        byId,

        setText,
        setHTML,
        show,
        hide,
        toggleHidden,

        normalizeText,
        normalizeCode,
        toNumber,
        firstValue,
        sumBy,
        uniqueValues,
        clamp,
        escapeHTML,

        getLanguage,
        getLocale,
        t,

        formatNumber,
        formatCurrency,
        formatPercentage,

        parseDate,
        formatDate,
        formatDateTime,
        dateToInputValue,
        isDateInRange,
        daysBetween,

        groupBy,
        paginate,

        readJSON,
        writeJSON,
        removeStorage,

        emptyTableRow,
        showToast
    });
})();
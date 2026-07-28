"use strict";

/* =========================================================
   Sales Operations Platform
   targets.js
   عرض الأهداف الفردية وحساب المبيعات ونسبة التحقيق
========================================================= */

window.DashboardTargets = (() => {
    const config = window.DashboardConfig;
    const utils = window.DashboardUtils;

    if (!config) {
        throw new Error(
            "DashboardConfig is not available. Load utils.js before targets.js."
        );
    }

    if (!utils) {
        throw new Error(
            "DashboardUtils is not available. Load utils.js before targets.js."
        );
    }

    let targetRows = [];
    let invoiceRows = [];
    let searchText = "";
    let referenceDate = new Date();
    let eventsBound = false;

    /* =====================================================
       أدوات داخلية
    ===================================================== */

    function firstValue(
        row,
        keys,
        fallback = ""
    ) {
        if (
            utils &&
            typeof utils.firstValue === "function"
        ) {
            return utils.firstValue(
                row,
                keys,
                fallback
            );
        }

        for (const key of keys) {
            if (
                row &&
                row[key] !== undefined &&
                row[key] !== null &&
                row[key] !== ""
            ) {
                return row[key];
            }
        }

        return fallback;
    }

    function toNumber(value) {
        if (
            utils &&
            typeof utils.toNumber === "function"
        ) {
            return utils.toNumber(value);
        }

        const number = Number(
            String(value ?? "")
                .replace(/,/g, "")
                .trim()
        );

        return Number.isFinite(number)
            ? number
            : 0;
    }

    function normalizeCode(value) {
        if (
            utils &&
            typeof utils.normalizeCode === "function"
        ) {
            return utils.normalizeCode(value);
        }

        return String(value ?? "").trim();
    }

    function normalizeText(value) {
        if (
            utils &&
            typeof utils.normalizeText === "function"
        ) {
            return utils.normalizeText(value);
        }

        return String(value ?? "")
            .trim()
            .toLowerCase();
    }

    function escapeHTML(value) {
        if (
            utils &&
            typeof utils.escapeHTML === "function"
        ) {
            return utils.escapeHTML(value);
        }

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function byId(id) {
        if (
            utils &&
            typeof utils.byId === "function"
        ) {
            return utils.byId(id);
        }

        return document.getElementById(id);
    }

    function translate(
        key,
        fallback
    ) {
        if (
            utils &&
            typeof utils.t === "function"
        ) {
            return utils.t(key, fallback);
        }

        return fallback;
    }

    function formatCurrency(value) {
        if (
            utils &&
            typeof utils.formatCurrency === "function"
        ) {
            return utils.formatCurrency(value);
        }

        return new Intl.NumberFormat(
            "ar-EG",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        ).format(toNumber(value)) + " ر.س";
    }

    function formatPercentage(value) {
        if (
            utils &&
            typeof utils.formatPercentage === "function"
        ) {
            return utils.formatPercentage(value);
        }

        return new Intl.NumberFormat(
            "ar-EG",
            {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
            }
        ).format(toNumber(value)) + "%";
    }

    function clamp(
        value,
        minimum,
        maximum
    ) {
        if (
            utils &&
            typeof utils.clamp === "function"
        ) {
            return utils.clamp(
                value,
                minimum,
                maximum
            );
        }

        return Math.min(
            Math.max(value, minimum),
            maximum
        );
    }

    /* =====================================================
       تحديد الربع والشهر الحالي
    ===================================================== */

    function normalizeReferenceDate(value) {
        if (value instanceof Date) {
            return Number.isNaN(value.getTime())
                ? new Date()
                : new Date(value);
        }

        const parsedDate = new Date(value);

        return Number.isNaN(parsedDate.getTime())
            ? new Date()
            : parsedDate;
    }

    function getQuarter(date = referenceDate) {
        const safeDate =
            normalizeReferenceDate(date);

        return Math.floor(
            safeDate.getMonth() / 3
        ) + 1;
    }

    function getQuarterName(
        quarter = getQuarter()
    ) {
        return `Q${quarter}`;
    }

    function setReferenceDate(value) {
        referenceDate =
            normalizeReferenceDate(value);

        render();

        return new Date(referenceDate);
    }

    function getReferenceDate() {
        return new Date(referenceDate);
    }

    /* =====================================================
       توحيد بيانات Target
    ===================================================== */

    function normalizeTargetRow(row = {}) {
        return {
            salesmanCode:
                normalizeCode(
                    firstValue(
                        row,
                        [
                            "salesmanCode",
                            "Salesman Code",
                            "salesCode",
                            "code"
                        ],
                        ""
                    )
                ),

            salesmanName:
                String(
                    firstValue(
                        row,
                        [
                            "salesmanName",
                            "Salesman Name",
                            "name"
                        ],
                        ""
                    )
                ).trim(),

            branch:
                String(
                    firstValue(
                        row,
                        [
                            "branch",
                            "Branch"
                        ],
                        ""
                    )
                ).trim(),

            targetQ1:
                toNumber(
                    firstValue(
                        row,
                        [
                            "targetQ1",
                            "Target Q1",
                            "quarter1Target"
                        ],
                        0
                    )
                ),

            monthlyTargetQ1:
                toNumber(
                    firstValue(
                        row,
                        [
                            "monthlyTargetQ1",
                            "Quarter 1 Monthly Target",
                            "monthlyTarget1"
                        ],
                        0
                    )
                ),

            targetQ2:
                toNumber(
                    firstValue(
                        row,
                        [
                            "targetQ2",
                            "Target Q2",
                            "quarter2Target"
                        ],
                        0
                    )
                ),

            monthlyTargetQ2:
                toNumber(
                    firstValue(
                        row,
                        [
                            "monthlyTargetQ2",
                            "Quarter 2 Monthly Target",
                            "monthlyTarget2"
                        ],
                        0
                    )
                ),

            targetQ3:
                toNumber(
                    firstValue(
                        row,
                        [
                            "targetQ3",
                            "Target Q3",
                            "quarter3Target"
                        ],
                        0
                    )
                ),

            monthlyTargetQ3:
                toNumber(
                    firstValue(
                        row,
                        [
                            "monthlyTargetQ3",
                            "Quarter 3 Monthly Target",
                            "monthlyTarget3"
                        ],
                        0
                    )
                ),

            targetQ4:
                toNumber(
                    firstValue(
                        row,
                        [
                            "targetQ4",
                            "Target Q4",
                            "quarter4Target"
                        ],
                        0
                    )
                ),

            monthlyTargetQ4:
                toNumber(
                    firstValue(
                        row,
                        [
                            "monthlyTargetQ4",
                            "Quarter 4 Monthly Target",
                            "monthlyTarget4"
                        ],
                        0
                    )
                ),

            annualTarget:
                toNumber(
                    firstValue(
                        row,
                        [
                            "annualTarget",
                            "Annual Target",
                            "yearTarget"
                        ],
                        0
                    )
                ),

            /*
             * دعم احتياطي لأي نسخة قديمة من البيانات.
             */
            fallbackMonthlyTarget:
                toNumber(
                    firstValue(
                        row,
                        [
                            "monthlyTarget",
                            "Monthly Target",
                            "target",
                            "Target"
                        ],
                        0
                    )
                )
        };
    }

    function normalizeTargetRows(rows) {
        if (!Array.isArray(rows)) {
            return [];
        }

        return rows
            .filter(
                row =>
                    row &&
                    typeof row === "object"
            )
            .map(normalizeTargetRow)
            .filter(row => row.salesmanCode);
    }

    /* =====================================================
       توحيد بيانات الفواتير
    ===================================================== */

    function normalizeInvoiceRow(row = {}) {
        return {
            salesmanCode:
                normalizeCode(
                    firstValue(
                        row,
                        [
                            "salesmanCode",
                            "Salesman Code",
                            "salesCode"
                        ],
                        ""
                    )
                ),

            invoiceDate:
                firstValue(
                    row,
                    [
                        "invoiceDate",
                        "Invoice Date",
                        "date"
                    ],
                    ""
                ),

            salesWithoutTax:
                toNumber(
                    firstValue(
                        row,
                        [
                            "salesWithoutTax",
                            "netSale",
                            "netSales",
                            "Net Sales",
                            "amount"
                        ],
                        0
                    )
                )
        };
    }

    function normalizeInvoiceRows(rows) {
        if (!Array.isArray(rows)) {
            return [];
        }

        return rows
            .filter(
                row =>
                    row &&
                    typeof row === "object"
            )
            .map(normalizeInvoiceRow);
    }

    /* =====================================================
       تحديد الهدف المناسب
    ===================================================== */

    function getMonthlyTarget(
        row,
        quarter = getQuarter()
    ) {
        const monthlyTargets = {
            1: row.monthlyTargetQ1,
            2: row.monthlyTargetQ2,
            3: row.monthlyTargetQ3,
            4: row.monthlyTargetQ4
        };

        const selected =
            toNumber(monthlyTargets[quarter]);

        if (selected > 0) {
            return selected;
        }

        if (row.fallbackMonthlyTarget > 0) {
            return row.fallbackMonthlyTarget;
        }

        const quarterTarget =
            getQuarterTarget(
                row,
                quarter
            );

        return quarterTarget > 0
            ? quarterTarget / 3
            : 0;
    }

    function getQuarterTarget(
        row,
        quarter = getQuarter()
    ) {
        const quarterTargets = {
            1: row.targetQ1,
            2: row.targetQ2,
            3: row.targetQ3,
            4: row.targetQ4
        };

        return toNumber(
            quarterTargets[quarter]
        );
    }

    /* =====================================================
       تحديد نطاق مبيعات الشهر الحالي
    ===================================================== */

    function isSameMonth(
        value,
        date = referenceDate
    ) {
        if (!value) {
            /*
             * إذا كانت الفواتير مصفاة أصلًا بواسطة app.js
             * ولا يوجد تاريخ صالح، لا يتم حذفها.
             */
            return true;
        }

        const invoiceDate =
            new Date(value);

        if (
            Number.isNaN(
                invoiceDate.getTime()
            )
        ) {
            return true;
        }

        const safeReferenceDate =
            normalizeReferenceDate(date);

        return (
            invoiceDate.getFullYear() ===
                safeReferenceDate.getFullYear() &&
            invoiceDate.getMonth() ===
                safeReferenceDate.getMonth()
        );
    }

    function calculateSalesBySalesman() {
        const salesMap = new Map();

        invoiceRows.forEach(invoice => {
            if (!invoice.salesmanCode) {
                return;
            }

            if (
                !isSameMonth(
                    invoice.invoiceDate,
                    referenceDate
                )
            ) {
                return;
            }

            const previousValue =
                salesMap.get(
                    invoice.salesmanCode
                ) || 0;

            salesMap.set(
                invoice.salesmanCode,
                previousValue +
                    invoice.salesWithoutTax
            );
        });

        return salesMap;
    }

    /* =====================================================
       بناء أداء الأهداف
    ===================================================== */

    function buildPerformanceRows() {
        const quarter =
            getQuarter(referenceDate);

        const salesBySalesman =
            calculateSalesBySalesman();

        return targetRows
            .map(row => {
                const monthlyTarget =
                    getMonthlyTarget(
                        row,
                        quarter
                    );

                const quarterTarget =
                    getQuarterTarget(
                        row,
                        quarter
                    );

                const sales =
                    salesBySalesman.get(
                        row.salesmanCode
                    ) || 0;

                const achievement =
                    monthlyTarget > 0
                        ? (
                            sales /
                            monthlyTarget
                        ) * 100
                        : 0;

                const remaining =
                    Math.max(
                        monthlyTarget - sales,
                        0
                    );

                const excess =
                    Math.max(
                        sales - monthlyTarget,
                        0
                    );

                return {
                    ...row,
                    quarter,
                    quarterName:
                        getQuarterName(quarter),
                    monthlyTarget,
                    quarterTarget,
                    sales,
                    achievement,
                    remaining,
                    excess,
                    achieved:
                        monthlyTarget > 0 &&
                        achievement >= 100
                };
            })
            .sort(
                (first, second) =>
                    second.achievement -
                    first.achievement
            );
    }

    /* =====================================================
       حفظ البيانات
    ===================================================== */

    function setData(
        targets = [],
        invoices = []
    ) {
        targetRows =
            normalizeTargetRows(targets);

        if (Array.isArray(invoices)) {
            invoiceRows =
                normalizeInvoiceRows(invoices);
        }

        render();

        return getPerformanceRows();
    }

    function setTargets(rows = []) {
        targetRows =
            normalizeTargetRows(rows);

        render();

        return [...targetRows];
    }

    function setInvoices(rows = []) {
        invoiceRows =
            normalizeInvoiceRows(rows);

        render();

        return [...invoiceRows];
    }

    function getTargets() {
        return [...targetRows];
    }

    function getInvoices() {
        return [...invoiceRows];
    }

    function getPerformanceRows() {
        return buildPerformanceRows();
    }

    /* =====================================================
       البحث
    ===================================================== */

    function getFilteredRows() {
        const rows =
            buildPerformanceRows();

        const search =
            normalizeText(searchText);

        if (!search) {
            return rows;
        }

        return rows.filter(row => {
            const values = [
                row.salesmanCode,
                row.salesmanName,
                row.branch,
                row.quarterName,
                row.monthlyTarget,
                row.quarterTarget,
                row.annualTarget,
                row.sales,
                row.achievement,
                row.remaining
            ];

            return values.some(value =>
                normalizeText(value)
                    .includes(search)
            );
        });
    }

    function setSearch(value = "") {
        searchText =
            String(value ?? "").trim();

        render();

        return searchText;
    }

    function clearSearch() {
        searchText = "";

        const input =
            byId("targetsSearchInput");

        if (input) {
            input.value = "";
        }

        render();
    }

    /* =====================================================
       حالة تحقيق الهدف
    ===================================================== */

    function getStatus(row) {
        if (row.achievement >= 100) {
            return {
                text:
                    translate(
                        "targets.achieved",
                        "تم تحقيق الهدف"
                    ),

                className:
                    "status-success"
            };
        }

        if (row.achievement >= 50) {
            return {
                text:
                    translate(
                        "targets.belowTarget",
                        "أقل من الهدف"
                    ),

                className:
                    "status-warning"
            };
        }

        return {
            text:
                translate(
                    "targets.belowTarget",
                    "أقل من الهدف"
                ),

            className:
                "status-danger"
        };
    }

    /* =====================================================
       إنشاء صف الجدول
    ===================================================== */

    function createTableRow(row) {
        const status =
            getStatus(row);

        const progressWidth =
            clamp(
                row.achievement,
                0,
                100
            );

        return `
            <tr>
                <td>
                    ${escapeHTML(
                        row.salesmanCode ||
                        "--"
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        row.salesmanName ||
                        "--"
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        row.branch ||
                        "--"
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        formatCurrency(
                            row.monthlyTarget
                        )
                    )}
                </td>

                <td class="amount-positive">
                    ${escapeHTML(
                        formatCurrency(
                            row.sales
                        )
                    )}
                </td>

                <td>
                    <strong>
                        ${escapeHTML(
                            formatPercentage(
                                row.achievement
                            )
                        )}
                    </strong>

                    <div class="progress-track">
                        <div
                            class="progress-value"
                            style="width: ${progressWidth}%"
                        ></div>
                    </div>
                </td>

                <td>
                    ${escapeHTML(
                        formatCurrency(
                            row.remaining
                        )
                    )}
                </td>

                <td>
                    <span
                        class="status-badge ${status.className}"
                    >
                        ${escapeHTML(
                            status.text
                        )}
                    </span>
                </td>
            </tr>
        `;
    }

    /* =====================================================
       عرض الجدول
    ===================================================== */

    function renderTable(rows) {
        const body =
            byId("targetsTableBody");

        if (!body) {
            return;
        }

        if (!rows.length) {
            if (
                utils &&
                typeof utils.emptyTableRow ===
                    "function"
            ) {
                body.innerHTML =
                    utils.emptyTableRow(8);
            } else {
                body.innerHTML = `
                    <tr>
                        <td
                            colspan="8"
                            class="empty-table-cell"
                        >
                            ${escapeHTML(
                                translate(
                                    "common.noData",
                                    "لا توجد بيانات متاحة"
                                )
                            )}
                        </td>
                    </tr>
                `;
            }

            return;
        }

        body.innerHTML = rows
            .map(createTableRow)
            .join("");
    }

    /* =====================================================
       العرض الكامل
    ===================================================== */

    function render() {
        const rows =
            getFilteredRows();

        renderTable(rows);

        return {
            rows,
            totalRows: rows.length,
            quarter:
                getQuarter(referenceDate),
            quarterName:
                getQuarterName(
                    getQuarter(referenceDate)
                )
        };
    }

    /* =====================================================
       ملخص الأهداف
    ===================================================== */

    function calculateSummary(
        rows = buildPerformanceRows()
    ) {
        const safeRows =
            Array.isArray(rows)
                ? rows
                : [];

        const totalMonthlyTarget =
            safeRows.reduce(
                (total, row) =>
                    total +
                    toNumber(
                        row.monthlyTarget
                    ),
                0
            );

        const totalSales =
            safeRows.reduce(
                (total, row) =>
                    total +
                    toNumber(row.sales),
                0
            );

        const totalRemaining =
            Math.max(
                totalMonthlyTarget -
                    totalSales,
                0
            );

        const achievement =
            totalMonthlyTarget > 0
                ? (
                    totalSales /
                    totalMonthlyTarget
                ) * 100
                : 0;

        return {
            totalMonthlyTarget,
            totalSales,
            totalRemaining,
            achievement,
            achievedCount:
                safeRows.filter(
                    row =>
                        row.achievement >= 100
                ).length,
            belowTargetCount:
                safeRows.filter(
                    row =>
                        row.achievement < 100
                ).length,
            salesmenCount:
                safeRows.length
        };
    }

    /* =====================================================
       تجهيز بيانات Excel
    ===================================================== */

    function getExportRows() {
        return getFilteredRows().map(
            row => ({
                [translate(
                    "targets.salesmanCode",
                    "كود المندوب"
                )]:
                    row.salesmanCode,

                [translate(
                    "targets.salesmanName",
                    "اسم المندوب"
                )]:
                    row.salesmanName,

                [translate(
                    "targets.branch",
                    "الفرع"
                )]:
                    row.branch,

                ["الربع الحالي"]:
                    row.quarterName,

                [translate(
                    "targets.monthlyTarget",
                    "الهدف الشهري"
                )]:
                    row.monthlyTarget,

                [translate(
                    "targets.quarterTarget",
                    "الهدف الربع سنوي"
                )]:
                    row.quarterTarget,

                ["الهدف السنوي"]:
                    row.annualTarget,

                [translate(
                    "targets.sales",
                    "المبيعات"
                )]:
                    row.sales,

                [translate(
                    "targets.achievement",
                    "نسبة التحقيق"
                )]:
                    row.achievement,

                [translate(
                    "targets.remaining",
                    "المتبقي"
                )]:
                    row.remaining,

                [translate(
                    "common.status",
                    "الحالة"
                )]:
                    getStatus(row).text
            })
        );
    }

    /* =====================================================
       تصدير Excel
    ===================================================== */

    function exportExcel() {
        const rows =
            getExportRows();

        if (!rows.length) {
            if (
                utils &&
                typeof utils.showToast ===
                    "function"
            ) {
                utils.showToast(
                    translate(
                        "messages.noExportData",
                        "لا توجد بيانات لتصديرها"
                    ),
                    "warning"
                );
            }

            return false;
        }

        if (
            typeof window.XLSX ===
            "undefined"
        ) {
            if (
                utils &&
                typeof utils.showToast ===
                    "function"
            ) {
                utils.showToast(
                    "XLSX library is not available.",
                    "error"
                );
            }

            return false;
        }

        const worksheet =
            window.XLSX.utils
                .json_to_sheet(rows);

        /*
         * تحديد عرض الأعمدة لتحسين ملف Excel.
         */
        worksheet["!cols"] = [
            { wch: 16 },
            { wch: 24 },
            { wch: 18 },
            { wch: 12 },
            { wch: 18 },
            { wch: 20 },
            { wch: 18 },
            { wch: 18 },
            { wch: 16 },
            { wch: 18 },
            { wch: 20 }
        ];

        const workbook =
            window.XLSX.utils
                .book_new();

        window.XLSX.utils
            .book_append_sheet(
                workbook,
                worksheet,
                "Targets"
            );

        const dateValue =
            referenceDate
                .toISOString()
                .slice(0, 10);

        window.XLSX.writeFile(
            workbook,
            `Targets_${dateValue}.xlsx`
        );

        if (
            utils &&
            typeof utils.showToast ===
                "function"
        ) {
            utils.showToast(
                translate(
                    "messages.excelCreated",
                    "تم تجهيز ملف Excel"
                ),
                "success"
            );
        }

        return true;
    }

    /* =====================================================
       ربط أحداث الصفحة
    ===================================================== */

    function bindEvents() {
        if (eventsBound) {
            return;
        }

        const searchInput =
            byId("targetsSearchInput");

        const exportButton =
            byId("exportTargetsButton");

        searchInput?.addEventListener(
            "input",
            event => {
                setSearch(
                    event.target.value
                );
            }
        );

        exportButton?.addEventListener(
            "click",
            exportExcel
        );

        eventsBound = true;
    }

    /* =====================================================
       تهيئة الوحدة
    ===================================================== */

    function initialize() {
        bindEvents();
        render();

        return true;
    }

    /* =====================================================
       الدوال المتاحة إلى app.js
    ===================================================== */

    return Object.freeze({
        initialize,
        bindEvents,

        setData,
        setTargets,
        setInvoices,

        getTargets,
        getInvoices,
        getPerformanceRows,
        getFilteredRows,

        setSearch,
        clearSearch,

        setReferenceDate,
        getReferenceDate,
        getQuarter,
        getQuarterName,

        getMonthlyTarget,
        getQuarterTarget,
        calculateSalesBySalesman,
        calculateSummary,
        getStatus,

        render,
        exportExcel
    });
})();
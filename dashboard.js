"use strict";

/* =========================================================
   Sales Operations Platform
   dashboard.js
   مؤشرات لوحة التحكم والجداول المختصرة والرسوم
========================================================= */

window.DashboardDashboard = (() => {
    const utils = window.DashboardUtils;
    const charts = window.DashboardCharts;

    if (!utils) {
        throw new Error(
            "DashboardUtils is not available. Load utils.js before dashboard.js."
        );
    }

    if (!charts) {
        throw new Error(
            "DashboardCharts is not available. Load charts.js before dashboard.js."
        );
    }

    let currentData = {
        summary: {},
        counts: {},
        filters: {},
        target: [],
        invoices: [],
        collections: [],
        dueOverdue: []
    };

    /* =====================================================
       حماية المصفوفات
    ===================================================== */

    function safeArray(value) {
        return Array.isArray(value)
            ? value
            : [];
    }

    /* =====================================================
       توحيد بيانات الداشبورد
    ===================================================== */

    function normalizeData(data = {}) {
        return {
            summary:
                data.summary &&
                typeof data.summary === "object"
                    ? data.summary
                    : {},

            counts:
                data.counts &&
                typeof data.counts === "object"
                    ? data.counts
                    : {},

            filters:
                data.filters &&
                typeof data.filters === "object"
                    ? data.filters
                    : {},

            target:
                safeArray(data.target),

            invoices:
                safeArray(data.invoices),

            collections:
                safeArray(data.collections),

            dueOverdue:
                safeArray(data.dueOverdue),

            updatedAt:
                data.updatedAt || ""
        };
    }

    /* =====================================================
       حساب المؤشرات احتياطيًا من الصفوف
    ===================================================== */

    function calculateFallbackSummary(data) {
        const invoices =
            safeArray(data.invoices);

        const collections =
            safeArray(data.collections);

        const dueOverdue =
            safeArray(data.dueOverdue);

        const targetRows =
            safeArray(data.target);

        const totalSalesWithoutTax =
            utils.sumBy(
                invoices,
                row =>
                    utils.firstValue(
                        row,
                        [
                            "salesWithoutTax",
                            "netSale",
                            "netSales",
                            "amount"
                        ],
                        0
                    )
            );

        const totalInvoiceAmount =
            utils.sumBy(
                invoices,
                row =>
                    utils.firstValue(
                        row,
                        [
                            "invoiceAmount",
                            "totalAmount",
                            "amount"
                        ],
                        0
                    )
            );

        const totalCollections =
            utils.sumBy(
                collections,
                row =>
                    utils.firstValue(
                        row,
                        [
                            "collectionAmount",
                            "collection",
                            "amount"
                        ],
                        0
                    )
            );

        const dueRows =
            dueOverdue.filter(
                row =>
                    String(
                        row.status || ""
                    ).toLowerCase() === "due"
            );

        const overdueRows =
            dueOverdue.filter(
                row =>
                    String(
                        row.status || ""
                    ).toLowerCase() === "overdue"
            );

        const totalDue =
            utils.sumBy(
                dueRows,
                row =>
                    utils.firstValue(
                        row,
                        [
                            "invoiceBalance",
                            "dueAmount",
                            "balance"
                        ],
                        0
                    )
            );

        const totalOverdue =
            utils.sumBy(
                overdueRows,
                row =>
                    utils.firstValue(
                        row,
                        [
                            "invoiceBalance",
                            "overdueAmount",
                            "balance"
                        ],
                        0
                    )
            );

        const selectedTarget =
            calculateSelectedTarget(
                targetRows,
                data.filters || {}
            );

        const totalOutstanding =
            totalDue + totalOverdue;

        const targetAchievementPercent =
            selectedTarget > 0
                ? (
                    totalSalesWithoutTax /
                    selectedTarget
                ) * 100
                : 0;

        const collectionRatePercent =
            totalSalesWithoutTax > 0
                ? (
                    totalCollections /
                    totalSalesWithoutTax
                ) * 100
                : 0;

        const overdueRatePercent =
            totalOutstanding > 0
                ? (
                    totalOverdue /
                    totalOutstanding
                ) * 100
                : 0;

        const activeCustomers =
            new Set(
                invoices
                    .map(row =>
                        utils.normalizeCode(
                            row.customerCode
                        )
                    )
                    .filter(Boolean)
            );

        const overdueCustomers =
            new Set(
                overdueRows
                    .map(row =>
                        utils.normalizeCode(
                            row.customerCode
                        )
                    )
                    .filter(Boolean)
            );

        return {
            totalSalesWithoutTax,
            totalInvoiceAmount,
            totalCollections,
            totalDue,
            totalOverdue,
            totalOutstanding,
            selectedTarget,
            targetAchievementPercent,
            collectionRatePercent,
            overdueRatePercent,

            invoiceCount:
                invoices.length,

            collectionCount:
                collections.length,

            dueInvoiceCount:
                dueRows.length,

            overdueInvoiceCount:
                overdueRows.length,

            activeCustomerCount:
                activeCustomers.size,

            overdueCustomerCount:
                overdueCustomers.size
        };
    }

    /* =====================================================
       دمج Summary القادم من Code.gs مع الحساب الاحتياطي
    ===================================================== */

    function calculateSummary(data = currentData) {
        const fallback =
            calculateFallbackSummary(data);

        const serverSummary =
            data.summary || {};

        return {
            totalSalesWithoutTax:
                utils.toNumber(
                    serverSummary.totalSalesWithoutTax ??
                    fallback.totalSalesWithoutTax
                ),

            totalInvoiceAmount:
                utils.toNumber(
                    serverSummary.totalInvoiceAmount ??
                    fallback.totalInvoiceAmount
                ),

            totalCollections:
                utils.toNumber(
                    serverSummary.totalCollections ??
                    fallback.totalCollections
                ),

            totalDue:
                utils.toNumber(
                    serverSummary.totalDue ??
                    fallback.totalDue
                ),

            totalOverdue:
                utils.toNumber(
                    serverSummary.totalOverdue ??
                    fallback.totalOverdue
                ),

            totalOutstanding:
                utils.toNumber(
                    serverSummary.totalOutstanding ??
                    fallback.totalOutstanding
                ),

            selectedTarget:
                utils.toNumber(
                    serverSummary.selectedTarget ??
                    fallback.selectedTarget
                ),

            targetAchievementPercent:
                utils.toNumber(
                    serverSummary.targetAchievementPercent ??
                    fallback.targetAchievementPercent
                ),

            collectionRatePercent:
                utils.toNumber(
                    serverSummary.collectionRatePercent ??
                    fallback.collectionRatePercent
                ),

            overdueRatePercent:
                utils.toNumber(
                    serverSummary.overdueRatePercent ??
                    fallback.overdueRatePercent
                ),

            invoiceCount:
                utils.toNumber(
                    serverSummary.invoiceCount ??
                    data.counts?.invoices ??
                    fallback.invoiceCount
                ),

            collectionCount:
                utils.toNumber(
                    serverSummary.collectionCount ??
                    data.counts?.collections ??
                    fallback.collectionCount
                ),

            dueInvoiceCount:
                utils.toNumber(
                    serverSummary.dueInvoiceCount ??
                    fallback.dueInvoiceCount
                ),

            overdueInvoiceCount:
                utils.toNumber(
                    serverSummary.overdueInvoiceCount ??
                    fallback.overdueInvoiceCount
                ),

            activeCustomerCount:
                utils.toNumber(
                    serverSummary.activeCustomerCount ??
                    fallback.activeCustomerCount
                ),

            overdueCustomerCount:
                utils.toNumber(
                    serverSummary.overdueCustomerCount ??
                    fallback.overdueCustomerCount
                )
        };
    }

    /* =====================================================
       تحديد الهدف حسب الأشهر المختارة
    ===================================================== */

    function calculateSelectedTarget(
        targetRows,
        filters = {}
    ) {
        const months =
            getSelectedMonths(
                filters.dateFrom,
                filters.dateTo
            );

        return safeArray(targetRows).reduce(
            (grandTotal, row) => {
                const salesmanTarget =
                    months.reduce(
                        (monthTotal, monthNumber) =>
                            monthTotal +
                            getMonthlyTarget(
                                row,
                                monthNumber
                            ),
                        0
                    );

                return grandTotal +
                    salesmanTarget;
            },
            0
        );
    }

    function getSelectedMonths(
        dateFrom,
        dateTo
    ) {
        const from =
            utils.parseDate(
                dateFrom || dateTo
            );

        const to =
            utils.parseDate(
                dateTo || dateFrom
            );

        if (!from && !to) {
            return [
                new Date().getMonth() + 1
            ];
        }

        const start =
            from || to;

        const end =
            to || from;

        const startDate =
            start <= end
                ? new Date(start)
                : new Date(end);

        const endDate =
            start <= end
                ? new Date(end)
                : new Date(start);

        const months = [];

        const cursor =
            new Date(
                startDate.getFullYear(),
                startDate.getMonth(),
                1
            );

        const finalMonth =
            new Date(
                endDate.getFullYear(),
                endDate.getMonth(),
                1
            );

        while (cursor <= finalMonth) {
            months.push(
                cursor.getMonth() + 1
            );

            cursor.setMonth(
                cursor.getMonth() + 1
            );
        }

        return months;
    }

    function getMonthlyTarget(
        targetRow,
        monthNumber
    ) {
        if (
            monthNumber >= 1 &&
            monthNumber <= 3
        ) {
            return utils.toNumber(
                targetRow.monthlyTargetQ1
            );
        }

        if (
            monthNumber >= 4 &&
            monthNumber <= 6
        ) {
            return utils.toNumber(
                targetRow.monthlyTargetQ2
            );
        }

        if (
            monthNumber >= 7 &&
            monthNumber <= 9
        ) {
            return utils.toNumber(
                targetRow.monthlyTargetQ3
            );
        }

        return utils.toNumber(
            targetRow.monthlyTargetQ4
        );
    }

    /* =====================================================
       عرض بطاقات المؤشرات
    ===================================================== */

    function renderKPIs(summary) {
        const averageInvoice =
            summary.invoiceCount > 0
                ? (
                    summary.totalSalesWithoutTax /
                    summary.invoiceCount
                )
                : 0;

        const remainingTarget =
            Math.max(
                summary.selectedTarget -
                summary.totalSalesWithoutTax,
                0
            );

        utils.setText(
            "netSalesKpi",
            utils.formatCurrency(
                summary.totalSalesWithoutTax
            )
        );

        utils.setText(
            "collectionsKpi",
            utils.formatCurrency(
                summary.totalCollections
            )
        );

        utils.setText(
            "dueKpi",
            utils.formatCurrency(
                summary.totalDue
            )
        );

        utils.setText(
            "overdueKpi",
            utils.formatCurrency(
                summary.totalOverdue
            )
        );

        utils.setText(
            "monthlyTargetKpi",
            utils.formatCurrency(
                summary.selectedTarget
            )
        );

        utils.setText(
            "achievementKpi",
            utils.formatPercentage(
                summary.targetAchievementPercent
            )
        );

        utils.setText(
            "invoiceCountKpi",
            utils.formatNumber(
                summary.invoiceCount
            )
        );

        utils.setText(
            "averageInvoiceKpi",
            utils.formatCurrency(
                averageInvoice
            )
        );

        utils.setText(
            "netSalesNote",
            `${utils.formatNumber(
                summary.invoiceCount
            )} ${utils.t(
                "dashboard.invoiceCount",
                "فاتورة"
            )}`
        );

        utils.setText(
            "collectionsNote",
            `${utils.t(
                "dashboard.collectionRate",
                "نسبة التحصيل"
            )}: ${utils.formatPercentage(
                summary.collectionRatePercent
            )}`
        );

        utils.setText(
            "dueNote",
            utils.formatCurrency(
                summary.totalOutstanding
            )
        );

        utils.setText(
            "overdueNote",
            `${utils.formatNumber(
                summary.overdueInvoiceCount
            )} ${utils.t(
                "common.records",
                "سجل"
            )}`
        );

        utils.setText(
            "monthlyTargetNote",
            `${utils.t(
                "dashboard.remainingTarget",
                "المتبقي من الهدف"
            )}: ${utils.formatCurrency(
                remainingTarget
            )}`
        );

        utils.setText(
            "invoiceCountNote",
            `${utils.formatNumber(
                summary.activeCustomerCount
            )} ${utils.t(
                "dashboard.activeCustomers",
                "عميل نشط"
            )}`
        );

        utils.setText(
            "averageInvoiceNote",
            `${utils.formatNumber(
                summary.invoiceCount
            )} ${utils.t(
                "common.records",
                "سجل"
            )}`
        );

        const progress =
            utils.byId(
                "achievementProgress"
            );

        if (progress) {
            progress.style.width =
                `${utils.clamp(
                    summary.targetAchievementPercent,
                    0,
                    100
                )}%`;
        }
    }

    /* =====================================================
       أحدث الفواتير
    ===================================================== */

    function renderRecentInvoices() {
        const body =
            utils.byId(
                "recentInvoicesTableBody"
            );

        if (!body) {
            return;
        }

        const rows =
            [...currentData.invoices]
                .sort((first, second) => {
                    const firstDate =
                        utils.parseDate(
                            first.invoiceDate
                        )?.getTime() || 0;

                    const secondDate =
                        utils.parseDate(
                            second.invoiceDate
                        )?.getTime() || 0;

                    return secondDate -
                        firstDate;
                })
                .slice(0, 8);

        if (!rows.length) {
            body.innerHTML =
                utils.emptyTableRow(5);

            return;
        }

        body.innerHTML =
            rows.map(row => `
                <tr>
                    <td>
                        ${utils.escapeHTML(
                            row.invoiceNo || "--"
                        )}
                    </td>

                    <td>
                        ${utils.escapeHTML(
                            utils.formatDate(
                                row.invoiceDate
                            )
                        )}
                    </td>

                    <td>
                        ${utils.escapeHTML(
                            row.customerName || "--"
                        )}
                    </td>

                    <td>
                        ${utils.escapeHTML(
                            row.salesmanName ||
                            row.salesmanCode ||
                            "--"
                        )}
                    </td>

                    <td class="amount-positive">
                        ${utils.escapeHTML(
                            utils.formatCurrency(
                                row.salesWithoutTax
                            )
                        )}
                    </td>
                </tr>
            `).join("");
    }

    /* =====================================================
       أعلى المتأخرات
    ===================================================== */

    function renderTopOverdue() {
        const body =
            utils.byId(
                "topOverdueTableBody"
            );

        if (!body) {
            return;
        }

        const rows =
            currentData.dueOverdue
                .filter(
                    row =>
                        String(
                            row.status || ""
                        ).toLowerCase() ===
                        "overdue"
                )
                .sort(
                    (first, second) =>
                        utils.toNumber(
                            second.invoiceBalance
                        ) -
                        utils.toNumber(
                            first.invoiceBalance
                        )
                )
                .slice(0, 8);

        if (!rows.length) {
            body.innerHTML =
                utils.emptyTableRow(4);

            return;
        }

        body.innerHTML =
            rows.map(row => `
                <tr>
                    <td>
                        ${utils.escapeHTML(
                            row.customerName || "--"
                        )}
                    </td>

                    <td>
                        ${utils.escapeHTML(
                            row.salesmanName ||
                            row.salesmanCode ||
                            "--"
                        )}
                    </td>

                    <td>
                        ${utils.escapeHTML(
                            utils.formatNumber(
                                row.overdueDays
                            )
                        )}
                    </td>

                    <td class="amount-danger">
                        ${utils.escapeHTML(
                            utils.formatCurrency(
                                row.invoiceBalance
                            )
                        )}
                    </td>
                </tr>
            `).join("");
    }

    /* =====================================================
       بيانات الرسم الشهري
    ===================================================== */

    function getMonthKey(value) {
        const date =
            utils.parseDate(value);

        if (!date) {
            return "";
        }

        return (
            `${date.getFullYear()}-` +
            `${String(
                date.getMonth() + 1
            ).padStart(2, "0")}`
        );
    }

    function getMonthLabel(monthKey) {
        if (!monthKey) {
            return "";
        }

        const [year, month] =
            monthKey
                .split("-")
                .map(Number);

        return new Intl.DateTimeFormat(
            utils.getLocale(),
            {
                month: "short",
                year: "numeric"
            }
        ).format(
            new Date(
                year,
                month - 1,
                1
            )
        );
    }

    function buildMonthlySeries() {
        const salesMap = {};
        const collectionsMap = {};

        currentData.invoices.forEach(
            row => {
                const key =
                    getMonthKey(
                        row.invoiceDate
                    );

                if (!key) {
                    return;
                }

                salesMap[key] =
                    (
                        salesMap[key] || 0
                    ) +
                    utils.toNumber(
                        row.salesWithoutTax
                    );
            }
        );

        currentData.collections.forEach(
            row => {
                const key =
                    getMonthKey(
                        row.collectionDate
                    );

                if (!key) {
                    return;
                }

                collectionsMap[key] =
                    (
                        collectionsMap[key] ||
                        0
                    ) +
                    utils.toNumber(
                        row.collectionAmount
                    );
            }
        );

        const monthKeys =
            utils.uniqueValues([
                ...Object.keys(salesMap),
                ...Object.keys(
                    collectionsMap
                )
            ]).sort();

        return {
            labels:
                monthKeys.map(
                    getMonthLabel
                ),

            sales:
                monthKeys.map(
                    key =>
                        salesMap[key] || 0
                ),

            collections:
                monthKeys.map(
                    key =>
                        collectionsMap[key] ||
                        0
                )
        };
    }

    /* =====================================================
       أداء المندوبين
    ===================================================== */

    function buildSalesmanPerformance() {
        const salesMap = {};

        currentData.invoices.forEach(
            row => {
                const code =
                    utils.normalizeCode(
                        row.salesmanCode
                    );

                if (!code) {
                    return;
                }

                salesMap[code] =
                    (
                        salesMap[code] || 0
                    ) +
                    utils.toNumber(
                        row.salesWithoutTax
                    );
            }
        );

        return currentData.target
            .map(row => {
                const target =
                    calculateSelectedTarget(
                        [row],
                        currentData.filters
                    );

                return {
                    salesmanCode:
                        row.salesmanCode,

                    salesmanName:
                        row.salesmanName ||
                        row.salesmanCode,

                    sales:
                        salesMap[
                            row.salesmanCode
                        ] || 0,

                    target
                };
            })
            .sort(
                (first, second) =>
                    second.sales -
                    first.sales
            )
            .slice(0, 10);
    }

    /* =====================================================
       أداء الفروع
    ===================================================== */

    function buildBranchPerformance() {
        const branchMap = {};

        currentData.invoices.forEach(
            row => {
                const branch =
                    String(
                        row.branch ||
                        utils.t(
                            "common.unknown",
                            "غير محدد"
                        )
                    ).trim();

                branchMap[branch] =
                    (
                        branchMap[branch] ||
                        0
                    ) +
                    utils.toNumber(
                        row.salesWithoutTax
                    );
            }
        );

        return Object.entries(
            branchMap
        )
            .map(
                ([branch, sales]) => ({
                    branch,
                    sales
                })
            )
            .sort(
                (first, second) =>
                    second.sales -
                    first.sales
            );
    }

    /* =====================================================
       عرض الرسوم
    ===================================================== */

    function renderCharts(summary) {
        const monthly =
            buildMonthlySeries();

        charts.renderSalesCollections({
            labels:
                monthly.labels,

            sales:
                monthly.sales,

            collections:
                monthly.collections
        });

        charts.renderDueOverdue({
            due:
                summary.totalDue,

            overdue:
                summary.totalOverdue
        });

        const salesmen =
            buildSalesmanPerformance();

        charts.renderSalesmanPerformance({
            labels:
                salesmen.map(
                    row =>
                        row.salesmanName
                ),

            sales:
                salesmen.map(
                    row =>
                        row.sales
                ),

            targets:
                salesmen.map(
                    row =>
                        row.target
                )
        });

        const branches =
            buildBranchPerformance();

        charts.renderBranchPerformance({
            labels:
                branches.map(
                    row =>
                        row.branch
                ),

            values:
                branches.map(
                    row =>
                        row.sales
                )
        });
    }

    /* =====================================================
       العرض الكامل للداشبورد
    ===================================================== */

    function render(data = {}) {
        currentData =
            normalizeData(data);

        const summary =
            calculateSummary(
                currentData
            );

        renderKPIs(summary);
        renderRecentInvoices();
        renderTopOverdue();
        renderCharts(summary);

        if (currentData.updatedAt) {
            utils.setText(
                "lastUpdateText",
                utils.formatDateTime(
                    currentData.updatedAt
                )
            );
        }

        return summary;
    }

    /* =====================================================
       تحديث الرسوم بعد تغيير اللغة أو المظهر
    ===================================================== */

    function refresh() {
        return render(currentData);
    }

    function getData() {
        return currentData;
    }

    /* =====================================================
       إتاحة الوظائف
    ===================================================== */

    return Object.freeze({
        render,
        refresh,
        getData,

        calculateSummary,
        calculateSelectedTarget,
        buildMonthlySeries,
        buildSalesmanPerformance,
        buildBranchPerformance
    });
})();
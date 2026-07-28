"use strict";

/* =========================================================
   Sales Operations Platform
   reports.js
   Reports Preview + Print/PDF + Excel
========================================================= */

window.DashboardReports = (() => {
    const utils = window.DashboardUtils;

    if (!utils) {
        throw new Error(
            "DashboardUtils is not available. Load utils.js before reports.js."
        );
    }

    let currentData = {
        filters: {},
        target: [],
        invoices: [],
        collections: [],
        dueOverdue: [],
        updatedAt: ""
    };

    let eventsBound = false;

    function safeArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function value(row, keys, fallback = "") {
        return utils.firstValue(row || {}, keys, fallback);
    }

    function number(row, keys, fallback = 0) {
        return utils.toNumber(value(row, keys, fallback));
    }

    function text(row, keys, fallback = "") {
        return String(value(row, keys, fallback) ?? fallback).trim();
    }

    function salesmanCode(row) {
        return utils.normalizeCode(
            value(row, ["salesmanCode", "Salesman Code", "salesCode"], "")
        );
    }

    function salesmanName(row) {
        return text(
            row,
            ["salesmanName", "Salesman Name", "name"],
            salesmanCode(row)
        );
    }

    function branch(row) {
        return text(row, ["branch", "Branch", "sheetBranch", "city"], "");
    }

    function customerCode(row) {
        return utils.normalizeCode(
            value(row, ["customerCode", "Customer Code", "accountCode"], "")
        );
    }

    function customerName(row) {
        return text(
            row,
            ["customerName", "Customer Name", "customer", "accountName"],
            customerCode(row)
        );
    }

    function invoiceNumber(row) {
        return text(
            row,
            ["invoiceNumber", "Invoice Number", "invoiceNo", "number"],
            ""
        );
    }

    function invoiceDate(row) {
        return value(row, ["invoiceDate", "Invoice Date", "date"], "");
    }

    function collectionDate(row) {
        return value(
            row,
            ["collectionDate", "Collection Date", "paymentDate", "date"],
            ""
        );
    }

    function sales(row) {
        return number(
            row,
            ["salesWithoutTax", "netSale", "netSales", "Net Sales", "amount"],
            0
        );
    }

    function collection(row) {
        return number(
            row,
            ["collectionAmount", "collection", "Collection Amount", "amount"],
            0
        );
    }

    function balance(row) {
        return number(
            row,
            ["invoiceBalance", "balance", "totalBalance", "Invoice Balance"],
            0
        );
    }

    function overdueDays(row) {
        return Math.max(
            0,
            number(
                row,
                ["overdueDays", "outstandingDays", "agingDays", "Overdue Days"],
                0
            )
        );
    }

    function isOverdue(row) {
        const status = utils
            .normalizeText(text(row, ["status", "Status"], ""))
            .replace(/\s+/g, "");

        return (
            status === "overdue" ||
            status === "متأخر" ||
            status === "متاخر" ||
            overdueDays(row) > 0
        );
    }

    function monthlyTarget(row) {
        const month =
            utils.parseDate(currentData.filters?.dateTo)?.getMonth?.() + 1 ||
            new Date().getMonth() + 1;

        const quarter =
            month <= 3 ? 1 :
            month <= 6 ? 2 :
            month <= 9 ? 3 : 4;

        return number(
            row,
            [
                `monthlyTargetQ${quarter}`,
                `monthlyTarget${quarter}`,
                "monthlyTarget",
                "target"
            ],
            0
        );
    }

    function setData(data = {}) {
        currentData = {
            filters:
                data.filters && typeof data.filters === "object"
                    ? data.filters
                    : {},
            target: safeArray(data.target),
            invoices: safeArray(data.invoices),
            collections: safeArray(data.collections),
            dueOverdue: safeArray(data.dueOverdue),
            updatedAt: data.updatedAt || ""
        };
    }

    function formatDate(value) {
        return value ? utils.formatDate(value) : "--";
    }

    function formatCurrency(value) {
        return utils.formatCurrency(number({ value }, ["value"], 0));
    }

    function reportTitle(type) {
        const titles = {
            sales: utils.t("reports.salesReport", "تقرير المبيعات"),
            collections: utils.t(
                "reports.collectionsReport",
                "تقرير التحصيلات"
            ),
            overdue: utils.t(
                "reports.overdueReport",
                "تقرير المتأخرات"
            ),
            target: utils.t(
                "reports.targetReport",
                "تقرير تحقيق الأهداف"
            ),
            salesman: utils.t(
                "reports.salesmanReport",
                "تقرير المندوب"
            ),
            branch: utils.t("reports.branchReport", "تقرير الفرع")
        };

        return titles[type] || utils.t("reports.title", "التقارير");
    }

    function buildSalesReport() {
        return {
            type: "sales",
            title: reportTitle("sales"),
            rows: currentData.invoices.map(row => ({
                "Invoice Number": invoiceNumber(row),
                "Invoice Date": formatDate(invoiceDate(row)),
                "Customer Code": customerCode(row),
                "Customer Name": customerName(row),
                "Salesman Code": salesmanCode(row),
                "Salesman Name": salesmanName(row),
                "Branch": branch(row),
                "Net Sales": sales(row)
            })),
            currencyColumns: ["Net Sales"]
        };
    }

    function buildCollectionsReport() {
        return {
            type: "collections",
            title: reportTitle("collections"),
            rows: currentData.collections.map(row => ({
                "Collection Date": formatDate(collectionDate(row)),
                "Receipt Number": text(
                    row,
                    ["receiptNumber", "Receipt Number", "paymentReceiptNumber"],
                    ""
                ),
                "Customer Code": customerCode(row),
                "Customer Name": customerName(row),
                "Salesman Code": salesmanCode(row),
                "Salesman Name": salesmanName(row),
                "Branch": branch(row),
                "Collection Amount": collection(row)
            })),
            currencyColumns: ["Collection Amount"]
        };
    }

    function buildOverdueReport() {
        return {
            type: "overdue",
            title: reportTitle("overdue"),
            rows: currentData.dueOverdue
                .filter(isOverdue)
                .sort((a, b) => overdueDays(b) - overdueDays(a))
                .map(row => ({
                    "Customer Code": customerCode(row),
                    "Customer Name": customerName(row),
                    "Salesman Code": salesmanCode(row),
                    "Salesman Name": salesmanName(row),
                    "Branch": branch(row),
                    "Overdue Amount": balance(row),
                    "Overdue Days": overdueDays(row)
                })),
            currencyColumns: ["Overdue Amount"]
        };
    }

    function buildTargetReport() {
        const salesMap = new Map();

        currentData.invoices.forEach(row => {
            const code = salesmanCode(row);
            if (!code) return;

            salesMap.set(
                code,
                (salesMap.get(code) || 0) + sales(row)
            );
        });

        return {
            type: "target",
            title: reportTitle("target"),
            rows: currentData.target.map(row => {
                const code = salesmanCode(row);
                const target = monthlyTarget(row);
                const totalSales = salesMap.get(code) || 0;
                const achievement = target > 0
                    ? (totalSales / target) * 100
                    : 0;

                return {
                    "Salesman Code": code,
                    "Salesman Name": salesmanName(row),
                    "Branch": branch(row),
                    "Monthly Target": target,
                    "Net Sales": totalSales,
                    "Achievement %": achievement,
                    "Remaining": Math.max(0, target - totalSales)
                };
            }),
            currencyColumns: ["Monthly Target", "Net Sales", "Remaining"],
            percentageColumns: ["Achievement %"]
        };
    }

    function aggregateBy(keyGetter, nameGetter) {
        const map = new Map();

        function ensure(row) {
            const key = keyGetter(row);
            if (!key) return null;

            if (!map.has(key)) {
                map.set(key, {
                    key,
                    name: nameGetter(row) || key,
                    sales: 0,
                    collections: 0,
                    due: 0,
                    overdue: 0,
                    invoiceCount: 0
                });
            }

            return map.get(key);
        }

        currentData.invoices.forEach(row => {
            const item = ensure(row);
            if (!item) return;
            item.sales += sales(row);
            item.invoiceCount += 1;
        });

        currentData.collections.forEach(row => {
            const item = ensure(row);
            if (!item) return;
            item.collections += collection(row);
        });

        currentData.dueOverdue.forEach(row => {
            const item = ensure(row);
            if (!item) return;

            if (isOverdue(row)) {
                item.overdue += balance(row);
            } else {
                item.due += balance(row);
            }
        });

        return Array.from(map.values());
    }

    function buildSalesmanReport() {
        return {
            type: "salesman",
            title: reportTitle("salesman"),
            rows: aggregateBy(
                salesmanCode,
                salesmanName
            ).map(item => ({
                "Salesman Code": item.key,
                "Salesman Name": item.name,
                "Net Sales": item.sales,
                "Collections": item.collections,
                "Due": item.due,
                "Overdue": item.overdue,
                "Invoice Count": item.invoiceCount
            })),
            currencyColumns: ["Net Sales", "Collections", "Due", "Overdue"]
        };
    }

    function buildBranchReport() {
        return {
            type: "branch",
            title: reportTitle("branch"),
            rows: aggregateBy(
                branch,
                branch
            ).map(item => ({
                "Branch": item.name,
                "Net Sales": item.sales,
                "Collections": item.collections,
                "Due": item.due,
                "Overdue": item.overdue,
                "Invoice Count": item.invoiceCount
            })),
            currencyColumns: ["Net Sales", "Collections", "Due", "Overdue"]
        };
    }

    function getReport(type) {
        const builders = {
            sales: buildSalesReport,
            collections: buildCollectionsReport,
            overdue: buildOverdueReport,
            target: buildTargetReport,
            salesman: buildSalesmanReport,
            branch: buildBranchReport
        };

        return builders[type]?.() || null;
    }

    function reportSummary(report) {
        const rows = report?.rows || [];

        const totalSales = rows.reduce(
            (sum, row) => sum + utils.toNumber(row["Net Sales"]),
            0
        );

        const totalCollections = rows.reduce(
            (sum, row) => sum + utils.toNumber(row["Collections"] || row["Collection Amount"]),
            0
        );

        const totalOverdue = rows.reduce(
            (sum, row) => sum + utils.toNumber(row["Overdue"] || row["Overdue Amount"]),
            0
        );

        return [
            {
                label: utils.t("common.records", "عدد السجلات"),
                value: utils.formatNumber(rows.length)
            },
            {
                label: utils.t("dashboard.netSales", "صافي المبيعات"),
                value: utils.formatCurrency(totalSales)
            },
            {
                label: utils.t("dashboard.collections", "التحصيلات"),
                value: utils.formatCurrency(totalCollections)
            },
            {
                label: utils.t("dashboard.overdue", "المتأخرات"),
                value: utils.formatCurrency(totalOverdue)
            }
        ];
    }

    function tableHTML(report) {
        const rows = report.rows || [];
        const columns = rows.length ? Object.keys(rows[0]) : [];

        if (!rows.length) {
            return `
                <div class="empty-state">
                    <i class="fa-regular fa-folder-open"></i>
                    <span>${utils.escapeHTML(
                        utils.t("common.noData", "لا توجد بيانات متاحة")
                    )}</span>
                </div>
            `;
        }

        return `
            <div class="table-wrapper">
                <table class="report-preview-table">
                    <thead>
                        <tr>
                            ${columns
                                .map(column => `<th>${utils.escapeHTML(column)}</th>`)
                                .join("")}
                        </tr>
                    </thead>
                    <tbody>
                        ${rows
                            .map(row => `
                                <tr>
                                    ${columns.map(column => {
                                        let cell = row[column];

                                        if (report.currencyColumns?.includes(column)) {
                                            cell = utils.formatCurrency(cell);
                                        }

                                        if (report.percentageColumns?.includes(column)) {
                                            cell = utils.formatPercentage(cell);
                                        }

                                        return `<td>${utils.escapeHTML(cell ?? "")}</td>`;
                                    }).join("")}
                                </tr>
                            `)
                            .join("")}
                    </tbody>
                </table>
            </div>
        `;
    }

    function createPreview(report) {
        const existing = utils.byId("reportPreviewModal");
        existing?.remove();

        const modal = document.createElement("div");
        modal.id = "reportPreviewModal";
        modal.className = "report-preview-overlay";

        const summary = reportSummary(report);

        modal.innerHTML = `
            <section class="report-preview-card">
                <header class="report-preview-header">
                    <div>
                        <h2>${utils.escapeHTML(report.title)}</h2>
                        <p>
                            ${utils.escapeHTML(
                                utils.t(
                                    "reports.subtitle",
                                    "إعداد وطباعة تقارير الأداء"
                                )
                            )}
                        </p>
                    </div>

                    <button
                        type="button"
                        class="icon-button"
                        id="closeReportPreview"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </header>

                <div class="report-preview-actions">
                    <button
                        class="secondary-button"
                        id="exportCurrentReportExcel"
                        type="button"
                    >
                        <i class="fa-solid fa-file-excel"></i>
                        <span>${utils.escapeHTML(
                            utils.t("common.exportExcel", "تصدير Excel")
                        )}</span>
                    </button>

                    <button
                        class="primary-button"
                        id="printCurrentReport"
                        type="button"
                    >
                        <i class="fa-solid fa-print"></i>
                        <span>${utils.escapeHTML(
                            utils.t("common.print", "طباعة / PDF")
                        )}</span>
                    </button>
                </div>

                <div class="report-preview-summary">
                    ${summary.map(item => `
                        <article>
                            <span>${utils.escapeHTML(item.label)}</span>
                            <strong>${utils.escapeHTML(item.value)}</strong>
                        </article>
                    `).join("")}
                </div>

                <div class="report-preview-body" id="reportPreviewBody">
                    ${tableHTML(report)}
                </div>
            </section>
        `;

        document.body.appendChild(modal);

        utils.byId("closeReportPreview")?.addEventListener(
            "click",
            () => modal.remove()
        );

        modal.addEventListener("click", event => {
            if (event.target === modal) {
                modal.remove();
            }
        });

        utils.byId("exportCurrentReportExcel")?.addEventListener(
            "click",
            () => exportExcel(report)
        );

        utils.byId("printCurrentReport")?.addEventListener(
            "click",
            () => printReport(report)
        );

        return modal;
    }

    function exportExcel(report) {
        if (!report?.rows?.length) {
            utils.showToast(
                utils.t("common.noData", "لا توجد بيانات متاحة"),
                "warning"
            );
            return false;
        }

        if (!window.XLSX?.utils) {
            utils.showToast("XLSX library is not loaded.", "error");
            return false;
        }

        const rows = report.rows.map(row => ({ ...row }));
        const worksheet = window.XLSX.utils.json_to_sheet(rows);
        const workbook = window.XLSX.utils.book_new();

        window.XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            report.title.slice(0, 31)
        );

        window.XLSX.writeFile(
            workbook,
            `${report.type}_report_${new Date()
                .toISOString()
                .slice(0, 10)}.xlsx`
        );

        return true;
    }

    function printReport(report) {
        const printWindow = window.open(
            "",
            "_blank",
            "width=1400,height=900"
        );

        if (!printWindow) {
            utils.showToast(
                "Please allow pop-up windows.",
                "warning"
            );
            return false;
        }

        const direction = document.documentElement.dir || "rtl";
        const summary = reportSummary(report);

        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="${direction}">
            <head>
                <meta charset="UTF-8">
                <title>${utils.escapeHTML(report.title)}</title>
                <style>
                    body {
                        margin: 0;
                        padding: 28px;
                        font-family: Arial, sans-serif;
                        color: #172033;
                    }

                    header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding-bottom: 18px;
                        border-bottom: 2px solid #176b87;
                    }

                    header h1 {
                        margin: 0;
                        font-size: 24px;
                    }

                    header p {
                        margin: 6px 0 0;
                        color: #64748b;
                    }

                    .summary {
                        margin: 20px 0;
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 12px;
                    }

                    .summary article {
                        padding: 14px;
                        border: 1px solid #e2e8f0;
                        border-radius: 10px;
                    }

                    .summary span {
                        display: block;
                        color: #64748b;
                        font-size: 11px;
                    }

                    .summary strong {
                        display: block;
                        margin-top: 6px;
                        font-size: 16px;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 10px;
                    }

                    th,
                    td {
                        padding: 8px;
                        text-align: start;
                        border: 1px solid #dbe2ea;
                    }

                    th {
                        background: #edf6f8;
                    }

                    footer {
                        margin-top: 22px;
                        padding-top: 12px;
                        display: flex;
                        justify-content: space-between;
                        color: #64748b;
                        border-top: 1px solid #dbe2ea;
                        font-size: 10px;
                    }

                    @page {
                        size: landscape;
                        margin: 10mm;
                    }
                </style>
            </head>
            <body>
                <header>
                    <div>
                        <h1>${utils.escapeHTML(report.title)}</h1>
                        <p>
                            ${utils.escapeHTML(
                                utils.formatDateTime(
                                    currentData.updatedAt || new Date()
                                )
                            )}
                        </p>
                    </div>

                    <strong>Al-Howail Talbees</strong>
                </header>

                <section class="summary">
                    ${summary.map(item => `
                        <article>
                            <span>${utils.escapeHTML(item.label)}</span>
                            <strong>${utils.escapeHTML(item.value)}</strong>
                        </article>
                    `).join("")}
                </section>

                ${tableHTML(report)}

                <footer>
                    <span>Developed by Adel Elesawy</span>
                    <span>${utils.escapeHTML(
                        utils.formatDateTime(new Date())
                    )}</span>
                </footer>

                <script>
                    window.onload = function () {
                        window.focus();
                        window.print();
                    };
                <\/script>
            </body>
            </html>
        `);

        printWindow.document.close();
        return true;
    }

    function runReport(type) {
        const report = getReport(type);

        if (!report) {
            return false;
        }

        createPreview(report);
        return report;
    }

    function bindEvents() {
        if (eventsBound) return;

        document
            .querySelectorAll(".report-card[data-report]")
            .forEach(button => {
                button.addEventListener("click", () => {
                    runReport(button.dataset.report);
                });
            });

        eventsBound = true;
    }

    function initialize() {
        bindEvents();
    }

    return Object.freeze({
        initialize,
        bindEvents,
        setData,
        runReport,
        exportExcel,
        printReport
    });
})();

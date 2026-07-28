"use strict";

/* =========================================================
   Sales Operations Platform
   alerts.js
========================================================= */

window.DashboardAlerts = (() => {
    const utils = window.DashboardUtils;

    if (!utils) {
        throw new Error(
            "DashboardUtils is not available. Load utils.js before alerts.js."
        );
    }

    let currentData = {
        filters: {},
        target: [],
        invoices: [],
        collections: [],
        dueOverdue: []
    };

    let alerts = [];
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

    function branch(row) {
        return text(row, ["branch", "Branch", "sheetBranch", "city"], "");
    }

    function salesmanName(row) {
        return text(
            row,
            ["salesmanName", "Salesman Name", "name"],
            salesmanCode(row)
        );
    }

    function balance(row) {
        return number(
            row,
            ["invoiceBalance", "balance", "totalBalance", "Invoice Balance"],
            0
        );
    }

    function creditLimit(row) {
        return number(row, ["creditLimit", "Credit Limit", "credit"], 0);
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

    function salesAmount(row) {
        return number(
            row,
            ["salesWithoutTax", "netSale", "netSales", "Net Sales", "amount"],
            0
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
            dueOverdue: safeArray(data.dueOverdue)
        };

        buildAlerts();
        render();

        return alerts;
    }

    function createAlert({
        id,
        type = "warning",
        icon = "fa-triangle-exclamation",
        title,
        message,
        amount = 0,
        meta = ""
    }) {
        return {
            id,
            type,
            icon,
            title,
            message,
            amount,
            meta
        };
    }

    function buildCreditAndOverdueAlerts() {
        const customerMap = new Map();

        currentData.dueOverdue.forEach(row => {
            const code = customerCode(row);
            const name = customerName(row);
            const key = code || utils.normalizeText(name);

            if (!key) return;

            if (!customerMap.has(key)) {
                customerMap.set(key, {
                    code,
                    name: name || code,
                    branch: branch(row),
                    salesman: salesmanName(row),
                    balance: 0,
                    overdue: 0,
                    maxDays: 0,
                    creditLimit: 0
                });
            }

            const customer = customerMap.get(key);
            const rowBalance = balance(row);

            customer.balance += rowBalance;
            customer.creditLimit = Math.max(customer.creditLimit, creditLimit(row));
            customer.maxDays = Math.max(customer.maxDays, overdueDays(row));

            if (isOverdue(row)) {
                customer.overdue += rowBalance;
            }
        });

        const result = [];

        customerMap.forEach(customer => {
            if (customer.maxDays >= 90 && customer.overdue > 0) {
                result.push(
                    createAlert({
                        id: `overdue-90-${customer.code || customer.name}`,
                        type: "critical",
                        icon: "fa-circle-exclamation",
                        title: utils.t(
                            "alerts.customerOver90",
                            `عميل متأخر أكثر من 90 يومًا: ${customer.name}`
                        ),
                        message:
                            `${customer.maxDays} ${utils.t("common.day", "يوم")} — ` +
                            `${utils.formatCurrency(customer.overdue)}`,
                        amount: customer.overdue,
                        meta: [customer.code, customer.branch, customer.salesman]
                            .filter(Boolean)
                            .join(" — ")
                    })
                );
            } else if (customer.maxDays >= 30 && customer.overdue > 0) {
                result.push(
                    createAlert({
                        id: `overdue-30-${customer.code || customer.name}`,
                        type: "warning",
                        icon: "fa-clock",
                        title: utils.t(
                            "alerts.customerOver30",
                            `عميل متأخر أكثر من 30 يومًا: ${customer.name}`
                        ),
                        message:
                            `${customer.maxDays} ${utils.t("common.day", "يوم")} — ` +
                            `${utils.formatCurrency(customer.overdue)}`,
                        amount: customer.overdue,
                        meta: [customer.code, customer.branch, customer.salesman]
                            .filter(Boolean)
                            .join(" — ")
                    })
                );
            }

            if (
                customer.creditLimit > 0 &&
                customer.balance > customer.creditLimit
            ) {
                const excess = customer.balance - customer.creditLimit;

                result.push(
                    createAlert({
                        id: `credit-${customer.code || customer.name}`,
                        type: "critical",
                        icon: "fa-credit-card",
                        title: utils.t(
                            "alerts.creditExceeded",
                            `تجاوز الحد الائتماني: ${customer.name}`
                        ),
                        message:
                            `${utils.t("salesmanProfiles.creditLimit", "الحد الائتماني")}: ` +
                            `${utils.formatCurrency(customer.creditLimit)} — ` +
                            `${utils.t("dashboard.outstanding", "الرصيد")}: ` +
                            `${utils.formatCurrency(customer.balance)}`,
                        amount: excess,
                        meta: [customer.code, customer.branch, customer.salesman]
                            .filter(Boolean)
                            .join(" — ")
                    })
                );
            }
        });

        return result;
    }

    function buildTargetAlerts() {
        const salesBySalesman = new Map();

        currentData.invoices.forEach(row => {
            const code = salesmanCode(row);
            if (!code) return;

            salesBySalesman.set(
                code,
                (salesBySalesman.get(code) || 0) + salesAmount(row)
            );
        });

        return currentData.target
            .map(row => {
                const code = salesmanCode(row);
                const target = monthlyTarget(row);
                const sales = salesBySalesman.get(code) || 0;
                const achievement = target > 0 ? (sales / target) * 100 : 0;

                if (!code || target <= 0 || achievement >= 50) {
                    return null;
                }

                return createAlert({
                    id: `target-${code}`,
                    type: achievement < 30 ? "critical" : "warning",
                    icon: "fa-bullseye",
                    title:
                        `${utils.t("alerts.lowAchievement", "انخفاض تحقيق الهدف")}: ` +
                        `${salesmanName(row) || code}`,
                    message:
                        `${utils.formatPercentage(achievement)} — ` +
                        `${utils.t("targets.sales", "المبيعات")}: ` +
                        `${utils.formatCurrency(sales)} — ` +
                        `${utils.t("targets.monthlyTarget", "الهدف")}: ` +
                        `${utils.formatCurrency(target)}`,
                    amount: Math.max(0, target - sales),
                    meta: [code, branch(row)].filter(Boolean).join(" — ")
                });
            })
            .filter(Boolean);
    }

    function buildPositiveAlerts() {
        const totalOverdue = currentData.dueOverdue
            .filter(isOverdue)
            .reduce((sum, row) => sum + balance(row), 0);

        if (totalOverdue === 0 && currentData.dueOverdue.length > 0) {
            return [
                createAlert({
                    id: "no-overdue",
                    type: "success",
                    icon: "fa-circle-check",
                    title: utils.t(
                        "alerts.noOverdue",
                        "لا توجد متأخرات ضمن الفلاتر الحالية"
                    ),
                    message: utils.t(
                        "alerts.positiveStatus",
                        "جميع الأرصدة الحالية ضمن فترة الاستحقاق."
                    )
                })
            ];
        }

        return [];
    }

    function buildAlerts() {
        alerts = [
            ...buildCreditAndOverdueAlerts(),
            ...buildTargetAlerts(),
            ...buildPositiveAlerts()
        ].sort((first, second) => {
            const order = {
                critical: 0,
                warning: 1,
                success: 2
            };

            return (
                (order[first.type] ?? 9) - (order[second.type] ?? 9) ||
                second.amount - first.amount
            );
        });

        updateBadge();
        return alerts;
    }

    function updateBadge() {
        const badge = utils.byId("alertsBadge");
        if (!badge) return;

        const count = alerts.filter(alert => alert.type !== "success").length;
        badge.textContent = utils.formatNumber(count);
        badge.classList.toggle("hidden", count === 0);
    }

    function filteredAlerts() {
        const selectedType =
            utils.byId("alertsTypeFilter")?.value || "";

        return selectedType
            ? alerts.filter(alert => alert.type === selectedType)
            : alerts;
    }

    function renderAlert(alert) {
        const labels = {
            critical: utils.t("alerts.critical", "حرج"),
            warning: utils.t("alerts.warning", "تحذير"),
            success: utils.t("alerts.success", "إيجابي")
        };

        return `
            <article class="alert-item alert-${utils.escapeHTML(alert.type)}">
                <div class="alert-icon">
                    <i class="fa-solid ${utils.escapeHTML(alert.icon)}"></i>
                </div>

                <div class="alert-content">
                    <div class="alert-title-row">
                        <strong>${utils.escapeHTML(alert.title)}</strong>

                        <span class="status-badge status-${
                            alert.type === "critical"
                                ? "danger"
                                : alert.type
                        }">
                            ${utils.escapeHTML(labels[alert.type] || alert.type)}
                        </span>
                    </div>

                    <p>${utils.escapeHTML(alert.message)}</p>

                    ${
                        alert.meta
                            ? `<small>${utils.escapeHTML(alert.meta)}</small>`
                            : ""
                    }
                </div>
            </article>
        `;
    }

    function render() {
        const container = utils.byId("alertsList");
        if (!container) return [];

        const rows = filteredAlerts();

        container.innerHTML = rows.length
            ? rows.map(renderAlert).join("")
            : `
                <div class="empty-state">
                    <i class="fa-regular fa-bell-slash"></i>
                    <span>
                        ${utils.escapeHTML(
                            utils.t(
                                "alerts.noAlerts",
                                "لا توجد تنبيهات ضمن الفلاتر الحالية"
                            )
                        )}
                    </span>
                </div>
            `;

        updateBadge();
        return rows;
    }

    function bindEvents() {
        if (eventsBound) return;

        utils.byId("alertsTypeFilter")?.addEventListener(
            "change",
            render
        );

        eventsBound = true;
    }

    function initialize() {
        bindEvents();
        buildAlerts();
        render();
    }

    return Object.freeze({
        initialize,
        setData,
        buildAlerts,
        render,
        refresh: render,
        getAlerts() {
            return [...alerts];
        }
    });
})();

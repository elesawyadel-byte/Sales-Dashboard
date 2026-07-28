"use strict";

/* =========================================================
   Sales Operations Platform
   charts.js
   إدارة جميع الرسوم البيانية
========================================================= */

window.DashboardCharts = (() => {
    const utils = window.DashboardUtils;

    if (!utils) {
        throw new Error(
            "DashboardUtils is not available. Load utils.js before charts.js."
        );
    }

    const chartInstances = {
        salesCollections: null,
        dueOverdue: null,
        salesmanPerformance: null,
        branchPerformance: null
    };

    /* =====================================================
       التحقق من مكتبة Chart.js
    ===================================================== */

    function isAvailable() {
        return typeof window.Chart !== "undefined";
    }

    /* =====================================================
       ألوان الرسوم
    ===================================================== */

    function isDarkMode() {
        return document.body.classList.contains(
            "dark-mode"
        );
    }

    function getTextColor() {
        return isDarkMode()
            ? "#9db0c4"
            : "#64748b";
    }

    function getGridColor() {
        return isDarkMode()
            ? "rgba(157, 176, 196, 0.12)"
            : "rgba(100, 116, 139, 0.12)";
    }

    function getSurfaceColor() {
        return isDarkMode()
            ? "#111d2e"
            : "#ffffff";
    }

    function getColors() {
        return {
            primary: "#176b87",
            primaryLight: "#2aa9c5",
            success: "#16a34a",
            warning: "#d97706",
            danger: "#dc2626",
            info: "#2563eb",
            purple: "#7c3aed",
            muted: "#94a3b8"
        };
    }

    /* =====================================================
       إعدادات عامة
    ===================================================== */

    function getDefaultFontFamily() {
        return utils.getLanguage() === "ar"
            ? "Cairo"
            : "Inter";
    }

    function getBaseOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,

            interaction: {
                intersect: false,
                mode: "index"
            },

            animation: {
                duration: 500
            },

            plugins: {
                legend: {
                    labels: {
                        color: getTextColor(),
                        usePointStyle: true,
                        pointStyle: "circle",
                        padding: 18,
                        font: {
                            family: getDefaultFontFamily(),
                            size: 11
                        }
                    }
                },

                tooltip: {
                    backgroundColor: getSurfaceColor(),
                    titleColor: getTextColor(),
                    bodyColor: getTextColor(),
                    borderColor: getGridColor(),
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    titleFont: {
                        family: getDefaultFontFamily()
                    },
                    bodyFont: {
                        family: getDefaultFontFamily()
                    }
                }
            }
        };
    }

    function getCurrencyScaleOptions() {
        return {
            beginAtZero: true,

            ticks: {
                color: getTextColor(),

                callback(value) {
                    return new Intl.NumberFormat(
                        utils.getLocale(),
                        {
                            notation: "compact",
                            maximumFractionDigits: 1
                        }
                    ).format(
                        utils.toNumber(value)
                    );
                }
            },

            grid: {
                color: getGridColor(),
                drawBorder: false
            }
        };
    }

    /* =====================================================
       حذف رسم
    ===================================================== */

    function destroy(name) {
        if (!chartInstances[name]) {
            return;
        }

        chartInstances[name].destroy();
        chartInstances[name] = null;
    }

    function destroyAll() {
        Object.keys(chartInstances).forEach(
            destroy
        );
    }

    /* =====================================================
       اتجاه المبيعات والتحصيلات
    ===================================================== */

    function renderSalesCollections({
        labels = [],
        sales = [],
        collections = []
    } = {}) {
        if (!isAvailable()) {
            return null;
        }

        const canvas = utils.byId(
            "salesCollectionsChart"
        );

        if (!canvas) {
            return null;
        }

        destroy("salesCollections");

        const colors = getColors();
        const baseOptions = getBaseOptions();

        chartInstances.salesCollections =
            new window.Chart(canvas, {
                type: "line",

                data: {
                    labels,

                    datasets: [
                        {
                            label: utils.t(
                                "dashboard.netSales",
                                "صافي المبيعات"
                            ),

                            data: sales,

                            borderColor:
                                colors.primary,

                            backgroundColor:
                                "rgba(23, 107, 135, 0.12)",

                            pointBackgroundColor:
                                colors.primary,

                            pointBorderColor:
                                colors.primary,

                            pointRadius: 3,

                            pointHoverRadius: 5,

                            borderWidth: 3,

                            tension: 0.35,

                            fill: true
                        },

                        {
                            label: utils.t(
                                "dashboard.collections",
                                "إجمالي التحصيلات"
                            ),

                            data: collections,

                            borderColor:
                                colors.success,

                            backgroundColor:
                                "rgba(22, 163, 74, 0.08)",

                            pointBackgroundColor:
                                colors.success,

                            pointBorderColor:
                                colors.success,

                            pointRadius: 3,

                            pointHoverRadius: 5,

                            borderWidth: 3,

                            tension: 0.35,

                            fill: true
                        }
                    ]
                },

                options: {
                    ...baseOptions,

                    plugins: {
                        ...baseOptions.plugins,

                        tooltip: {
                            ...baseOptions.plugins.tooltip,

                            callbacks: {
                                label(context) {
                                    return (
                                        `${context.dataset.label}: ` +
                                        utils.formatCurrency(
                                            context.raw
                                        )
                                    );
                                }
                            }
                        }
                    },

                    scales: {
                        x: {
                            ticks: {
                                color:
                                    getTextColor()
                            },

                            grid: {
                                color:
                                    getGridColor(),
                                display: false
                            }
                        },

                        y: getCurrencyScaleOptions()
                    }
                }
            });

        return chartInstances.salesCollections;
    }

    /* =====================================================
       المستحقات مقابل المتأخرات
    ===================================================== */

    function renderDueOverdue({
        due = 0,
        overdue = 0
    } = {}) {
        if (!isAvailable()) {
            return null;
        }

        const canvas = utils.byId(
            "dueOverdueChart"
        );

        if (!canvas) {
            return null;
        }

        destroy("dueOverdue");

        const colors = getColors();
        const baseOptions = getBaseOptions();

        chartInstances.dueOverdue =
            new window.Chart(canvas, {
                type: "doughnut",

                data: {
                    labels: [
                        utils.t(
                            "dashboard.due",
                            "المستحقات"
                        ),

                        utils.t(
                            "dashboard.overdue",
                            "المتأخرات"
                        )
                    ],

                    datasets: [
                        {
                            data: [
                                utils.toNumber(due),
                                utils.toNumber(overdue)
                            ],

                            backgroundColor: [
                                colors.info,
                                colors.danger
                            ],

                            borderColor:
                                getSurfaceColor(),

                            borderWidth: 3,

                            hoverOffset: 6
                        }
                    ]
                },

                options: {
                    ...baseOptions,

                    cutout: "66%",

                    plugins: {
                        ...baseOptions.plugins,

                        legend: {
                            ...baseOptions.plugins.legend,
                            position: "bottom"
                        },

                        tooltip: {
                            ...baseOptions.plugins.tooltip,

                            callbacks: {
                                label(context) {
                                    return (
                                        `${context.label}: ` +
                                        utils.formatCurrency(
                                            context.raw
                                        )
                                    );
                                }
                            }
                        }
                    }
                }
            });

        return chartInstances.dueOverdue;
    }

    /* =====================================================
       أداء المندوبين
    ===================================================== */

    function renderSalesmanPerformance({
        labels = [],
        sales = [],
        targets = []
    } = {}) {
        if (!isAvailable()) {
            return null;
        }

        const canvas = utils.byId(
            "salesmanPerformanceChart"
        );

        if (!canvas) {
            return null;
        }

        destroy("salesmanPerformance");

        const colors = getColors();
        const baseOptions = getBaseOptions();

        chartInstances.salesmanPerformance =
            new window.Chart(canvas, {
                type: "bar",

                data: {
                    labels,

                    datasets: [
                        {
                            label: utils.t(
                                "targets.sales",
                                "المبيعات"
                            ),

                            data: sales,

                            backgroundColor:
                                "rgba(23, 107, 135, 0.78)",

                            borderColor:
                                colors.primary,

                            borderWidth: 1,

                            borderRadius: 6,

                            maxBarThickness: 34
                        },

                        {
                            label: utils.t(
                                "targets.monthlyTarget",
                                "الهدف الشهري"
                            ),

                            data: targets,

                            backgroundColor:
                                "rgba(217, 119, 6, 0.72)",

                            borderColor:
                                colors.warning,

                            borderWidth: 1,

                            borderRadius: 6,

                            maxBarThickness: 34
                        }
                    ]
                },

                options: {
                    ...baseOptions,

                    plugins: {
                        ...baseOptions.plugins,

                        tooltip: {
                            ...baseOptions.plugins.tooltip,

                            callbacks: {
                                label(context) {
                                    return (
                                        `${context.dataset.label}: ` +
                                        utils.formatCurrency(
                                            context.raw
                                        )
                                    );
                                }
                            }
                        }
                    },

                    scales: {
                        x: {
                            ticks: {
                                color:
                                    getTextColor(),
                                maxRotation: 35,
                                minRotation: 0
                            },

                            grid: {
                                display: false
                            }
                        },

                        y: getCurrencyScaleOptions()
                    }
                }
            });

        return chartInstances.salesmanPerformance;
    }

    /* =====================================================
       أداء الفروع
    ===================================================== */

    function renderBranchPerformance({
        labels = [],
        values = []
    } = {}) {
        if (!isAvailable()) {
            return null;
        }

        const canvas = utils.byId(
            "branchPerformanceChart"
        );

        if (!canvas) {
            return null;
        }

        destroy("branchPerformance");

        const colors = getColors();
        const baseOptions = getBaseOptions();

        chartInstances.branchPerformance =
            new window.Chart(canvas, {
                type: "bar",

                data: {
                    labels,

                    datasets: [
                        {
                            label: utils.t(
                                "dashboard.netSales",
                                "صافي المبيعات"
                            ),

                            data: values,

                            backgroundColor:
                                "rgba(37, 99, 235, 0.72)",

                            borderColor:
                                colors.info,

                            borderWidth: 1,

                            borderRadius: 6,

                            maxBarThickness: 32
                        }
                    ]
                },

                options: {
                    ...baseOptions,

                    indexAxis: "y",

                    plugins: {
                        ...baseOptions.plugins,

                        legend: {
                            display: false
                        },

                        tooltip: {
                            ...baseOptions.plugins.tooltip,

                            callbacks: {
                                label(context) {
                                    return utils.formatCurrency(
                                        context.raw
                                    );
                                }
                            }
                        }
                    },

                    scales: {
                        x: getCurrencyScaleOptions(),

                        y: {
                            ticks: {
                                color:
                                    getTextColor()
                            },

                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });

        return chartInstances.branchPerformance;
    }

    /* =====================================================
       تحديث ألوان الرسوم عند تغيير الوضع
    ===================================================== */

    function refreshTheme() {
        Object.values(
            chartInstances
        ).forEach(chart => {
            if (!chart) {
                return;
            }

            if (
                chart.options?.plugins
                    ?.legend?.labels
            ) {
                chart.options.plugins
                    .legend.labels.color =
                    getTextColor();
            }

            if (
                chart.options?.scales?.x
                    ?.ticks
            ) {
                chart.options.scales
                    .x.ticks.color =
                    getTextColor();
            }

            if (
                chart.options?.scales?.y
                    ?.ticks
            ) {
                chart.options.scales
                    .y.ticks.color =
                    getTextColor();
            }

            if (
                chart.options?.scales?.x
                    ?.grid
            ) {
                chart.options.scales
                    .x.grid.color =
                    getGridColor();
            }

            if (
                chart.options?.scales?.y
                    ?.grid
            ) {
                chart.options.scales
                    .y.grid.color =
                    getGridColor();
            }

            chart.update();
        });
    }

    /* =====================================================
       إتاحة الوظائف
    ===================================================== */

    return Object.freeze({
        isAvailable,

        renderSalesCollections,
        renderDueOverdue,
        renderSalesmanPerformance,
        renderBranchPerformance,

        destroy,
        destroyAll,
        refreshTheme
    });
})();
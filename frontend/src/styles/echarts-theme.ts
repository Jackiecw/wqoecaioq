// ECharts科技蓝主题配置
export const techBlueTheme = {
    color: [
        '#2563eb', // primary-500 - 主色
        '#60a5fa', // primary-400 - 浅蓝
        '#3b82f6', // primary-blue
        '#8b5cf6', // purple - 紫色
        '#10b981', // emerald - 绿色
        '#f59e0b', // amber - 琥珀
        '#ef4444', // red - 红色
        '#06b6d4', // cyan - 青色
    ],
    backgroundColor: 'transparent',
    textStyle: {
        fontFamily: 'Inter, PingFang SC, Microsoft YaHei, sans-serif',
        fontSize: 12,
        color: '#64748b', // text-600
    },
    title: {
        textStyle: {
            color: '#0f172a', // text-900
            fontSize: 18,
            fontWeight: 600,
        },
        subtextStyle: {
            color: '#64748b',
            fontSize: 13,
        },
    },
    line: {
        itemStyle: {
            borderWidth: 2,
        },
        lineStyle: {
            width: 3,
        },
        symbolSize: 8,
        symbol: 'circle',
        smooth: true,
    },
    radar: {
        itemStyle: {
            borderWidth: 2,
        },
        lineStyle: {
            width: 2,
        },
        symbolSize: 6,
        symbol: 'circle',
        smooth: true,
    },
    bar: {
        itemStyle: {
            barBorderWidth: 0,
            barBorderColor: '#ccc',
            borderRadius: [4, 4, 0, 0],
        },
        barMaxWidth: '60%',
    },
    pie: {
        itemStyle: {
            borderWidth: 2,
            borderColor: '#fff',
            borderRadius: 4,
        },
    },
    scatter: {
        itemStyle: {
            borderWidth: 1,
            borderColor: '#fff',
        },
    },
    grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true,
    },
    legend: {
        textStyle: {
            color: '#64748b',
            fontSize: 12,
        },
        itemWidth: 14,
        itemHeight: 14,
    },
    tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: [8, 12],
        textStyle: {
            color: '#0f172a',
            fontSize: 13,
        },
        axisPointer: {
            lineStyle: {
                color: '#cbd5e1',
                width: 1,
            },
            crossStyle: {
                color: '#cbd5e1',
                width: 1,
            },
        },
    },
    categoryAxis: {
        axisLine: {
            show: true,
            lineStyle: {
                color: '#e5e7eb',
            },
        },
        axisTick: {
            show: false,
        },
        axisLabel: {
            color: '#64748b',
            fontSize: 11,
        },
        splitLine: {
            show: false,
        },
    },
    valueAxis: {
        axisLine: {
            show: false,
        },
        axisTick: {
            show: false,
        },
        axisLabel: {
            color: '#64748b',
            fontSize: 11,
        },
        splitLine: {
            lineStyle: {
                color: '#f1f5f9',
                type: 'solid',
            },
        },
    },
    timeline: {
        lineStyle: {
            color: '#2563eb',
            width: 1,
        },
        itemStyle: {
            color: '#2563eb',
            borderWidth: 1,
        },
        controlStyle: {
            color: '#2563eb',
            borderColor: '#2563eb',
            borderWidth: 0.5,
        },
        checkpointStyle: {
            color: '#2563eb',
            borderColor: 'rgba(37,99,235,0.3)',
        },
        label: {
            color: '#64748b',
        },
        emphasis: {
            itemStyle: {
                color: '#1e40af',
            },
            controlStyle: {
                color: '#2563eb',
                borderColor: '#2563eb',
                borderWidth: 0.5,
            },
            label: {
                color: '#64748b',
            },
        },
    },
};

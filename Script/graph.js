"use strict";
//初始化图表
function initGraph() {
    var myChart = echarts.init(document.getElementById('echartsGraph'));
    /** @type EChartsOption */
    var initOptions = {
        title: {
            text: '知识网络图'
        },
        series: [
            {
                type: 'graph',
                layout: 'force',
                label: {
                    show: true,
                    formatter: (data) => { return data.data.label}
                }
            },
        ]
    }
    myChart.setOption(initOptions);
    return myChart
}
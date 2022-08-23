"use strict";
/*图表相关，包括图表交互事件 */
//初始化图表
function initGraph() {
    var myChart = echarts.init(document.getElementById('echartsGraph'));
    /** @type EChartsOption */
    var initOptions = {
        title: {
            text: '知识网络图',
            show: false
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

//响应容器大小的变化
window.onresize = function () {
    myChart.resize();
};
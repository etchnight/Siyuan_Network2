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
        /*xAxis: {
            id: 'xAixsGlobe',
            show: true,
            type: 'value',
            min: 'dataMin',
            max: 'dataMax',
        },
        yAxis: {
            id: 'yAixsGlobe',
            show: true,
            type: 'value',
            min: 'dataMin',
            max: 'dataMax',
        },
        dataZoom: [{
            type: 'inside',
            xAxisIndex: [0],
            yAxisIndex: [0],
        }],*/
        series: [
            {
                id: "graphMain",
                type: 'graph',
                layout: 'force',
                zoom: 2,
                label: {
                    show: true,
                    formatter: (data) => { return data.data.label }
                },
                roam: true,
            },
        ]
    }
    myChart.setOption(initOptions);
    /*myChart.getZr().on('graphroam',{
        seriesId: 'graphMain',
        zoom: 1, // 单次缩放倍数
        //originX: number,
        //originY: number
    })*/
    return myChart
}

//响应容器大小的变化
window.onresize = function () {
    myChart.resize();
};

//缩放

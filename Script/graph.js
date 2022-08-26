"use strict";
/*global echarts main_add:true*/

/*图表相关，包括图表交互事件 */
//初始化图表
function initGraph() {
  var myChart = echarts.init(document.getElementById("echartsGraph"));
  /** @type EChartsOption */
  var initOptions = {
    title: {
      text: "知识网络图",
      show: false,
    },
    tooltip: {
      show: true,
      trigger: 'item',
    },
    series: [
      {
        id: "graphMain",
        type: "graph",
        layout: "force",
        zoom: 2,
        label: {
          show: true,
          formatter: (data) => {
            return data.data.label;
          },
        },
        roam: true,
        tooltip: {
          position: 'top',
          formatter: (data)=>{
            return data.data.content
          }
        },
      },
    ],
  };
  myChart.setOption(initOptions);
  /*myChart.getZr().on('graphroam',{
        seriesId: 'graphMain',
        zoom: 1, // 单次缩放倍数
        //originX: number,
        //originY: number
    })*/
  //响应容器大小的变化
  window.onresize = function () {
    myChart.resize();
  };
  myChart.on("dblclick", function (params) {
    if (params.dataType != "node") {
      return;
    }
    var id = params.data.name;
    main_add(id);
  });
  return myChart;
}

if (typeof module === "object") {
  module.exports = initGraph;
}

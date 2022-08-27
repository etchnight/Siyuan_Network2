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
      trigger: "item",
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
        edgeSymbol: ['none', 'arrow'],
        tooltip: {//悬浮显示
          position: "top",
          formatter: (data) => {
            return data.data.content;
          },
        },
      },
    ],
  };
  myChart.setOption(initOptions);

  //响应容器大小的变化
  window.onresize = function () {
    myChart.resize();
  };
  //双击展开节点
  myChart.on("dblclick", function (params) {
    if (params.dataType != "node") {
      return;
    }
    var id = params.data.name;
    main_add(id);
  });
  //右键菜单
  myChart.on("contextmenu", function (params) {
    //右键菜单项
    const menuItems = [
      `<a href=siyuan://blocks/${params.data.name}>定位到块</a>`,
      `<a href="javascript:void(0)" οnclick="main_del(${params.data.name})">收起节点</a>`,
    ];
    //关默认
    params.event.event.preventDefault();
    //做菜单
    var menu = document.getElementById("echartsMenu");
    menu.style.position = "absolute";
    menu.style.left = params.event.offsetX + "px";
    menu.style.top = params.event.offsetY + "px";
    menu.style.display = "block";
    var tempHTML = ``;
    for (const a of menuItems) {
      tempHTML += `<div class="menu-item">
                      ${a}
                  </div>`;
    }
    menu.innerHTML = tempHTML;
    //console.log(params);
  });
  //移除右键菜单
  myChart.getZr().on('click', function(event) {
    // 没有 target 意味着鼠标/指针不在任何一个图形元素上，它是从“空白处”触发的。
    if (!event.target) {
      var menu = document.getElementById("echartsMenu");
      menu.style.display = "none";
    }
  });
  return myChart;
}

if (typeof module === "object") {
  module.exports = initGraph;
}

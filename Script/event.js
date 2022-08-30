"use strict";

//const { main_hide } = require("./main");

/*global SiyuanConnect siyuanNetwork2Params echarts  :true*/

/*界面交互相关，仅限与主界面交互，图表相关交互在graph.js文件*/

document.addEventListener("DOMContentLoaded", async () => {
  await initPage();
});
async function initPage() {
  //列出笔记本
  const idList = ["refBox", "parentBox", "nodeNotebook"];
  for (const id of idList) {
    const notebooksElement = document.getElementById(id);
    const siyuanService = new SiyuanConnect();
    const notebooks = await siyuanService.lsNotebooks();
    if (notebooks.length > 0) {
      let optionsHTML = `<option value="">(空)</option>`;
      notebooks.forEach((notebook) => {
        if (notebook.closed) {
          return;
        }
        optionsHTML += `<option value="${notebook.id}">${notebook.name}</option>`;
      });
      notebooksElement.innerHTML = optionsHTML;
    }
  }

  //空值检查
  var voidCheckIds = [
    {
      from: "isRefAfterDivide",
      to: "refDivide",
    },
    {
      from: "isRefInBox",
      to: "refBox",
    },
  ];
  for (const e of voidCheckIds) {
    document.getElementById(e.from).addEventListener("click", () => {
      var dom = document.getElementById(e.to);
      if (document.getElementById(e.from).checked && !dom.value) {
        dom.setAttribute("aria-invalid", "true");
      } else {
        dom.setAttribute("aria-invalid", "");
      }
    });
    document.getElementById(e.to).addEventListener("change", () => {
      var dom = document.getElementById(e.to);
      if (document.getElementById(e.from).checked && !dom.value) {
        dom.setAttribute("aria-invalid", "true");
      } else {
        dom.setAttribute("aria-invalid", "");
      }
    });
  }
  //拖动条显示数量
  var rangeDomIds = [
    {
      input: "layerMax",
      span: "layerMaxShow",
    },
  ];
  for (const e of rangeDomIds) {
    rangeValue(e.input, e.span);
    document.getElementById(e.input).addEventListener("change", () => {
      rangeValue(e.input, e.span);
    });
  }
  //根据深度隐藏节点
  document.getElementById("layerMax").addEventListener("change", () => {
    var myChart = echarts.getInstanceByDom(
      document.getElementById("echartsGraph")
    );
    const option = myChart.getOption();
    var nodes = option.series[0].data;
    var edges = option.series[0].links;
    const layerMax = document.getElementById("layerMax").value;
    const layerNumForDel = siyuanNetwork2Params.layerNum - layerMax;
    for (let node of nodes) {
      if (!node.itemStyle) {
        node.itemStyle = {};
      }
      if (node.layerNum <= layerNumForDel) {
        node.itemStyle.opacity = 0.25;
      } else {
        node.itemStyle.opacity = 1;
      }
    }
    for (let edge of edges) {
      if (!edge.lineStyle) {
        edge.lineStyle = {};
      }
      if (edge.layerNum <= layerNumForDel) {
        edge.lineStyle.opacity = 0.25;
      } else {
        edge.lineStyle.opacity = 1;
      }
    }
    /** @type EChartsOption */
    myChart.setOption({
      series: [
        {
          type: "graph",
          data: nodes,
          links: edges,
        },
      ],
    });
    return;
  });
}

//拖动条显示数量，注意，这个函数在数据产生时也有用到
function rangeValue(input, span) {
  var dom = document.getElementById(span);
  var inputDom = document.getElementById(input);
  if (inputDom.value == inputDom.max) {
    dom.innerHTML = "Max";
  } else {
    dom.innerHTML = inputDom.value;
  }
  return;
}

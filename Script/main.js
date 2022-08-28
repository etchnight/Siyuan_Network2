"use strict";
/*global dataGenerate initGraph echarts siyuanNetwork2Params:true*/

/*主流程，数据与图表通信 */
async function main() {
  siyuanNetwork2Params.layerNum = 0;
  var nodes = [];
  var edges = [];
  //只有一个id需要获得，就不从config中获取了
  const dataServer = new dataGenerate(document.getElementById("nodeId").value);
  [nodes, edges] = await dataServer.findAndAdd();
  var myChart = initGraph();
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
  return myChart.getOption();
}
//修改节点
async function main_changeData(id, callback) {
  var myChart = echarts.getInstanceByDom(
    document.getElementById("echartsGraph")
  );
  const option = myChart.getOption();
  var nodes = option.series[0].data;
  var edges = option.series[0].links;
  [nodes, edges] = await callback(id, nodes, edges);
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
}
//增加节点
function main_add(id) {
  main_changeData(id, async (id, nodes, edges) => {
    const dataServer = new dataGenerate(id, nodes, edges);
    [nodes, edges] = await dataServer.findAndAdd();
    return [nodes, edges];
  });
}
//收起节点
function main_del(id) {
  main_changeData(id, async (id, nodes, edges) => {
    const dataServer = new dataGenerate(id, nodes, edges);
    [nodes, edges] = await dataServer.findAndDel();
    return [nodes, edges];
  });
}
if (typeof module === "object") {
  module.exports = { main, main_add, main_del };
}

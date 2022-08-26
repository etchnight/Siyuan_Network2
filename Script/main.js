"use strict";
/*global dataGenerate initGraph echarts:true*/

/*主流程，数据与图表通信 */
async function main() {
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
//增加节点
async function main_add(id) {
  var myChart = echarts.getInstanceByDom(
    document.getElementById("echartsGraph")
  );
  const option = myChart.getOption();
  var nodes = option.series[0].data;
  var edges = option.series[0].links;
  const dataServer = new dataGenerate(id, nodes, edges);
  [nodes, edges] = await dataServer.findAndAdd();
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
//收起节点
async function main_del(id){

}
if (typeof module === "object") {
  module.exports = { main, main_add };
}

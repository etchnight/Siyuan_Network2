"use strict";
/*global SiyuanConnect dataGenerate initGraph echarts siyuanNetwork2Params config:true*/

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
  //id为列表的话，逐个处理一同设置
  if (typeof id === typeof []) {
    for (const o of id) {
      [nodes, edges] = await callback(o, nodes, edges);
    }
  } else {
    [nodes, edges] = await callback(id, nodes, edges);
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
  //console.log(myChart.getOption())
}
//增加节点
function main_add(id) {
  main_changeData(id, async (id, nodes, edges) => {
    //虚拟节点不处理
    if (id.length > 22) {
      return [nodes, edges];
    }
    const dataServer = new dataGenerate(id, nodes, edges);
    [nodes, edges] = await dataServer.findAndAdd();
    return [nodes, edges];
  });
}
//收起节点(删除)
function main_del(id) {
  main_changeData(id, async (id, nodes, edges) => {
    const dataServer = new dataGenerate(id, nodes, edges);
    [nodes, edges] = await dataServer.findAndDel();
    return [nodes, edges];
  });
}
//保存配置
async function saveConfig() {
  if (!window.frameElement) {
    return;
  }
  const parentDom = window.frameElement.parentElement.parentElement;
  const id = parentDom.getAttribute("data-node-id");
  //const id = "20220831140338-24p00b1";
  const server = new SiyuanConnect(config().port);
  await server.setBlockAttr(id, "memo", JSON.stringify(config()));
  server.pushMsg("保存完成");
}
//加载配置
async function loadConfig() {
  if (!window.frameElement) {
    return;
  }
  const parentDom = window.frameElement.parentElement.parentElement;
  const id = parentDom.getAttribute("data-node-id");
  //const id = "20220831140338-24p00b1";
  const server = new SiyuanConnect(config().port);
  const data = await server.getBlockAttrs(id);
  let str = data.memo.replace(/&quot;/g, '"');
  const setting = JSON.parse(str);
  document.getElementById("port").value = setting.port;
  document.getElementById("nodeId").value = setting.nodeId;
  const relation = setting.relation;
  document.getElementById("isParent").checked = relation.isParent;
  document.getElementById("isChildren").checked = relation.isChildren;
  document.getElementById("isRef").checked = relation.isRef;
  document.getElementById("isBackRef").checked = relation.isBackRef;
  select("refBox", relation.refBox);
  //block的名称展示方式选项
  const blockShow = setting.blockShow;
  document.getElementById("isName").checked = blockShow.isName;

  document.getElementById("isTag").checked = blockShow.isTag;
  document.getElementById("tagGroup").value = blockShow.tagGroup;

  document.getElementById("isRefInBox").checked = blockShow.isRefInBox;
  select("refBox", blockShow.refBox);

  document.getElementById("isRefAfterDivide").checked =
    blockShow.isRefAfterDivide;
  document.getElementById("refDivide").value = blockShow.refDivide;

  document.getElementById("isShowByPriority").checked =
    blockShow.isShowByPriority;
  //引用合并模式
  var refMerge = setting.refMerge;
  document.getElementById("refMergeActive").checked = refMerge.active;
  document.getElementById("docIsNode").checked = refMerge.docIsNode;
  document.getElementById("titleIsNode").checked = refMerge.titleIsNode;
  document.getElementById("otherIsNode").checked = refMerge.otherIsNode;
  document.getElementById("stopSymbol").value = refMerge.stopSymbol;
  select("nodeNotebook", refMerge.nodeNotebook);

  function select(id, target) {
    if (!target) {
      return;
    }
    var selcetDom = document.getElementById(id);
    for (const option of selcetDom.children) {
      if (option.value == target) {
        option.selected = true;
        return;
      }
    }
    return;
  }
}

if (typeof module === "object") {
  module.exports = {
    main,
    main_add,
    main_del,
    saveConfig,
    loadConfig,
  };
}

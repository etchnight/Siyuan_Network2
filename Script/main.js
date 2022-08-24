"use strict";
/*主流程，数据与图表通信 */
async function main() {
    var nodes = [];
    var edges = [];
    //只有一个id需要获得，就不从config中获取了
    const dataServer=new dataGenerate(document.getElementById("nodeId").value);
    [nodes, edges] = await dataServer.findAndAdd();
    var myChart = initGraph();
    /** @type EChartsOption */
    myChart.setOption({
        series: [
            {
                type: 'graph',
                data: nodes,
                links: edges
            }
        ]
    })
    return myChart.getOption()
}



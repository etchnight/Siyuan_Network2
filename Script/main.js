"use strict";
/*主进程，模式判断相关 */
async function main() {
    var myChart = initGraph();
    var id = await initId();
    var nodes = [];
    var edges = [];
    [nodes, edges] = await findAndAdd(id);
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
    //console.log(myChart.getOption())
}


//父子节点是否仅限单个笔记本
function parAndChiFlag(block) {
    if (document.getElementById("parentCheck").value != "on") {
        return false
    }
    if (document.getElementById("notebooksCheck").value != "on") {
        return false
    }
    var notebook = document.getElementById("notebooks").value;
    if (block.box == notebook) {
        return true
    } else {
        return false
    }
}


"use strict";
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
    console.log(myChart.getOption())
}

//查询引用和反向引用并转化为visData
async function findAndAdd(id) {
    var nodesList = [];
    var edgesList = [];
    if (!id) {
        return
    }
    var source = await Siyuan_sql_FindbyID(id);
    if (parAndChiFlag(source)) {
        //父级
        var parent = await Siyuan_sql_FindbyID(source.parent_id);
        if (parent) {
            var [nodes, edges] = await toEchartsData([parent], [source]);
            nodesList = AddNodes(nodesList, nodes);
            edgesList = AddEdges(edgesList, edges);
        }
        //子级
        var children = await Siyuan_sql_FindbyParentID(id);
        if (children.length > 0) {
            var [nodes, edges] = await toEchartsData([source], children);
            nodesList = AddNodes(nodesList, nodes);
            edgesList = AddEdges(edgesList, edges);
        }
    }
    //反向引用
    var backDefList = await Siyuan_sql_FindBackDefbyID(id);
    if (backDefList.length > 0) {
        var [nodes, edges] = await toEchartsData(backDefList, [source]);
        nodesList = AddNodes(nodesList, nodes);
        edgesList = AddEdges(edgesList, edges);
        backDefList.forEach(async (element) => {
            let id = element.id;//注意id变量的作用范围
            let defList = await Siyuan_sql_FindDefbyID(id);
            if (defList.length > 0) {
                [nodes, edges] = await toEchartsData([element], defList);
                nodesList = AddNodes(nodesList, nodes);
                edgesList = AddEdges(edgesList, edges);
            }
        });
    }
    //引用
    var defList = await Siyuan_sql_FindDefbyID(id);
    if (defList.length > 0) {
        [nodes, edges] = await toEchartsData([source], defList);
        nodesList = AddNodes(nodesList, nodes);
        edgesList = AddEdges(edgesList, edges);
    }
    return [nodesList, edgesList]
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


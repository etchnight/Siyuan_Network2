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
    var option = myChart.getOption();
    var aaa = option.series[0].data;
    var bbb = option.series[0].links;
    console.log(option)
    console.log(aaa)
    console.log(bbb)
}
async function initId() {
    var id = document.getElementById("node-id").value;
    var source = await Siyuan_sql_FindbyID(id);
    return source.root_id
}
function initGraph() {
    //初始化
    var myChart = echarts.init(document.getElementById('echartsGraph'));
    /** @type EChartsOption */
    var initOptions = {
        title: {
            text: '知识网络图'
        },
        series: [
            {
                type: 'graph',
                layout: 'force',
                label: {
                    show: true,
                    formatter: (o) => { return o.label; }
                }
            },
        ]
    }
    myChart.setOption(initOptions);
    return myChart
}

async function main2(id) {
    await findAndAdd(id)

    //画图
    var container = document.getElementById('mynetwork');
    var data = {
        nodes: visNodes,
        edges: visEdges
    };
    var options = {
        nodes: nodeOptions,
        edges: edgeOptions
    };
    network = new vis.Network(container, data, options);
    network.on("click", async function (params) {
        var id = params.nodes[0];
        await findAndAdd(id);
    });
    network.on("doubleClick", async function (params) {
        var id = params.nodes[0];
        window.open("siyuan://blocks/" + id);
    })
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

//接收两个block列表,将它们转化为list1 to list2的形式
//并添加到节点和边
async function toEchartsData(list1 = [], list2 = []) {
    var nodes = [];
    var edges = [];
    //var listAll = _.concat(list1, list2)
    //添加节点
    for (let i = 0; i < list1.length + list2.length; i++) {
        let block;
        if (i >= list1.length) {
            block = list2[i - list1.length];
        } else {
            block = list1[i];
        }
        //不算关系box中的节点
        if (block.box == document.getElementById("relaNotebooks").value &&
            document.getElementById("relaCheck").value == "on") {
            block = "";
        }
        if (!block.content) {
            continue;
        }

        switch (block.type) {
            case "d":
            case "h":
                nodes.push({
                    "name": block.id,
                    "label": block.content
                    //"group": block.type
                })
                break;
            default:
                let label = "";
                if (block.name) {
                    label = block.name;
                }
                if (!label) {
                    let labelBlock = await Siyuan_sql_FindDefbyID(block.id);
                    for (const ele of labelBlock) {
                        if (ele.box == document.getElementById("relaNotebooks").value) {
                            label = ele.content
                        }
                    }
                }
                if (!label) {
                    let tag = await Siyuan_sql_FindTagContentbyID(block.id);
                    label = tag2label(tag);
                }
                nodes.push({
                    "name": block.id,
                    //"title": block.content,
                    "label": label
                    //"group": block.type
                })
        };

    }
    //添加关系
    for (let i = 0; i < list1.length; i++) {
        let block1 = list1[i];
        for (let j = 0; j < list2.length; j++) {
            let block2 = list2[j];
            if (block1.id && block2.id) {
                edges.push({
                    "source": block1.id,
                    "target": block2.id
                });
            }
        }
    }
    return [nodes, edges]
}

//向DataSet中尝试添加新数据
function AddNodes(nodes, newdata) {
    if (!_.has(newdata, "length")) {
        newdata = [newdata]
    }
    for (let d of newdata) {
        if (!_.some(nodes, (o) => {
            return o.name == d.name
        })) {
            nodes.push(d);
        }
    }
    return nodes
}
function AddEdges(edges, newdata) {
    if (!_.has(newdata, "length")) {
        newdata = [newdata]
    }
    for (let d of newdata) {
        if (!_.some(edges, (o) => {
            return o.source == d.source
                && o.target == d.target
        }) && d.source != d.target) {//防止自引用
            edges.push(d);
        }
    }
    return edges
}

//处理笔记书签，合并转化为label
function tag2label(tag) {
    var label = [];
    var flag = document.getElementById("divideTag").value;
    tag.forEach(element => {
        if (element.indexOf(flag) == 0) {
            var tagArray = element.split("/");
            label.push(tagArray[tagArray.length - 1]);
        }
    });
    var strLabel = label.join("/");
    return strLabel
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


"use strict";
var visNodes;
var visEdges;
var network;
function reDraw() {
    var id = document.getElementById("node-id").value;
    main(id)
}
async function main(id) {
    var edgeOptions = {
        arrows: {
            to: true
        }
    };
    var nodeOptions = {};
    visNodes = new vis.DataSet(nodeOptions);
    visEdges = new vis.DataSet(edgeOptions);
    //查询数据
    var source = await Siyuan_sql_FindbyID(id);
    id = source.root_id
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
    if (!id) {
        return
    }
    var source = await Siyuan_sql_FindbyID(id);
    if (parAndChiFlag(source)) {
        //父级
        var parent = await Siyuan_sql_FindbyID(source.parent_id);
        if (parent) {
            var [nodes, edges] = await toVisData([parent], [source]);
        }
        //子级
        var children = await Siyuan_sql_FindbyParentID(id);
        if (children.length > 0) {
            var [nodes, edges] = await toVisData([source], children);
        }
    }
    //反向引用
    var backDefList = await Siyuan_sql_FindBackDefbyID(id);
    if (backDefList.length > 0) {
        var [nodes, edges] = await toVisData(backDefList, [source]);
        //AddNodes(nodes);
        //AddEdges(edges);
        backDefList.forEach(async (element) => {
            let id = element.id;//注意id变量的作用范围
            let defList = await Siyuan_sql_FindDefbyID(id);
            if (defList.length > 0) {
                [nodes, edges] = await toVisData([element], defList);
            }
        });
    }
    //引用
    var defList = await Siyuan_sql_FindDefbyID(id);
    if (defList.length > 0) {
        [nodes, edges] = await toVisData([source], defList);
    }
    //return [visNodes,visEdges]
}

//接收两个block列表,将它们转化为list1 to list2的形式
//并添加到节点和边
async function toVisData(list1 = [], list2 = []) {
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
                    "id": block.id,
                    "label": block.content,
                    "group": block.type
                })
                break;
            default:
                let label="";
                if (block.name) {
                    label = block.name;
                }
                if (!label) {
                    let labelBlock = await Siyuan_sql_FindDefbyID(block.id);
                    for(const ele of labelBlock){
                        if(ele.box==document.getElementById("relaNotebooks").value){
                            label=ele.content
                        }
                    }
                }
                if (!label) {
                    let tag = await Siyuan_sql_FindTagContentbyID(block.id);
                    label = tag2label(tag);
                }
                nodes.push({
                    "id": block.id,
                    "title": block.content,
                    "label": label,
                    "group": block.type
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
                    "from": block1.id,
                    "to": block2.id
                });
            }
        }
    }
    AddNodes(nodes)
    AddEdges(edges)
    return [nodes, edges]
}

//向DataSet中尝试添加新数据
function AddNodes(newdata) {
    if (!_.has(newdata, "length")) {
        newdata = [newdata]
    }
    for (let i in newdata) {
        let d = newdata[i];
        try {
            visNodes.add([d])
        } catch (e) {
            console.log(e.message)
        }
    }
    //return data
}
function AddEdges(newdata) {
    if (!_.has(newdata, "length")) {
        newdata = [newdata]
    }
    for (let i in newdata) {
        var flag = true
        let d = newdata[i];
        visEdges.forEach((a) => {
            //防止重复
            if (a.from == d.from && a.to == d.to) {
                flag = false;
            }
        })
        if (flag && d.from != d.to) {
            //flag见上，并防止自引用
            try {
                visEdges.add([d])
            } catch (e) {
                console.log(e.message)
            }
        }
    }
}

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
//列出笔记本
document.addEventListener('DOMContentLoaded', () => {
    const notebooksElement = document.getElementById('notebooks')
    notebooksElement.addEventListener('change', () => {
        notebooksElement.setAttribute("data-id", notebooksElement.value)
    })
    getNotebooks(notebooksElement)
})
document.addEventListener('DOMContentLoaded', () => {
    const notebooksElement = document.getElementById('relaNotebooks')
    notebooksElement.addEventListener('change', () => {
        notebooksElement.setAttribute("data-id", notebooksElement.value)
    })
    getNotebooks(notebooksElement)
})
async function getNotebooks(notebooksElement) {
    const notebooks = await Siyuan_lsNotebooks();
    if (notebooks.length > 0) {
        let optionsHTML = ''
        notebooks.forEach(notebook => {
            if (notebook.closed) {
                return
            }
            optionsHTML += `<option value="${notebook.id}">${notebook.name}</option>`
        })
        notebooksElement.innerHTML = optionsHTML
        notebooksElement.value = notebooksElement.getAttribute("data-id")
    }
}

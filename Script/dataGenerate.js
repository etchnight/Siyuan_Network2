"use strict";
//获取文档id
async function initId() {
    var id = document.getElementById("node-id").value;
    var source = await Siyuan_sql_FindbyID(id);
    return source.root_id
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
                    "content": block.content,
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
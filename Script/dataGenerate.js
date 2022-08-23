"use strict";
/*数据生成相关 */
class dataGenerate {
    constructor(id, nodes, edges) {
        this.config = config();
        this.nodes = nodes || [];
        this.edges = edges || [];
        //注意，这个id不一定是从网页获取到的，也可能是通过图表交互获得
        this.id = id;
    }

    //接收两个block列表,将它们转化为list1 to list2的形式
    //并添加到节点和边
    async toEchartsData(list1 = [], list2 = []) {
        var newNodes = [];
        var newEdges = [];
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
            /*if (block.box == document.getElementById("relaNotebooks").value &&
                document.getElementById("relaCheck").value == "on") {
                block = "";
            }*/
            if (!block.content) {
                continue;
            }

            switch (block.type) {
                case "d":
                case "h":
                    newNodes.push({
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
                            if (ele.box == this.config.blockShow.refBox) {
                                label = ele.content
                            }
                        }
                    }
                    if (!label) {
                        let tag = await Siyuan_sql_FindTagContentbyID(block.id);
                        label = this.tag2label(tag);
                    }
                    newNodes.push({
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
                    newEdges.push({
                        "source": block1.id,
                        "target": block2.id
                    });
                }
            }
        }
        this.AddNodes(newNodes);
        this.AddEdges(newEdges);
        return
    }

    //向DataSet中尝试添加新数据
    AddNodes(newdata) {
        if (!_.has(newdata, "length")) {
            newdata = [newdata]
        }
        for (let d of newdata) {
            if (!_.some(this.nodes, (o) => {
                return o.name == d.name
            })) {
                this.nodes.push(d);
            }
        }
        return
    }
    AddEdges(newdata) {
        if (!_.has(newdata, "length")) {
            newdata = [newdata]
        }
        for (let d of newdata) {
            if (!_.some(this.edges, (o) => {
                return o.source == d.source
                    && o.target == d.target
            }) && d.source != d.target) {//防止自引用
                this.edges.push(d);
            }
        }
        return
    }

    //处理笔记书签，合并转化为label
    tag2label(tag) {
        var label = [];
        var flag = this.config.blockShow.tagGroup;
        tag.forEach(element => {
            if (element.indexOf(flag) == 0) {
                var tagArray = element.split("/");
                label.push(tagArray[tagArray.length - 1]);
            }
        });
        var strLabel = label.join("/");
        return strLabel
    }
    //查询父级
    async dataParent(block) {
        if (!block) {
            return
        }
        if (!this.config.relation.isParent) {
            return
        }
        if (this.config.parentBox) {
            if (this.config.parentBox != block.box) {
                return
            }
        }
        var parent = await Siyuan_sql_FindbyID(block.parent_id);
        if (parent) {
            await toEchartsData([parent], [block]);
        }
        return
    }

    //查询子级
    async dataChildren(block) {
        if (!block) {
            return
        }
        if (!this.config.relation.isChildren) {
            return
        }
        if (this.config.relation.parentBox) {
            if (this.config.relation.parentBox != block.box) {
                return
            }
        }
        var children = await Siyuan_sql_FindbyParentID(block.id);
        if (children.length > 0) {
            await this.toEchartsData([block], children);
        }
        return
    }

    //引用
    async dataRef(block) {
        if (!block) {
            return
        }
        if (!this.config.relation.isRef) {
            return
        }
        var defList = await Siyuan_sql_FindDefbyID(block.id);
        if (defList.length > 0) {
            await toEchartsData([block], defList);
        }
        return
    }

    //反向引用
    async dataBackRef(block) {
        if (!block) {
            return
        }
        if (!this.config.relation.isBackRef) {
            return
        }
        var backDefList = await Siyuan_sql_FindBackDefbyID(block.id);
        if (backDefList.length > 0) {
            await this.toEchartsData(backDefList, [block]);
            backDefList.forEach(async (element) => {
                let id = element.id;//注意id变量的作用范围
                let defList = await Siyuan_sql_FindDefbyID(id);
                if (defList.length > 0) {
                    await this.toEchartsData([element], defList);
                }
            });
        }
        return
    }
    //查询引用和反向引用并转化为visData
    findAndAdd = async function () {
        if (!this.id) {
            return
        }
        var block = await Siyuan_sql_FindbyID(this.id);
        await this.dataParent(block);
        await this.dataChildren(block);
        await this.dataRef(block);
        await this.dataBackRef(block);
        return [this.nodes, this.edges]
    }
}
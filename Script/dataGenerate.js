"use strict";
/*数据生成相关 */
class dataGenerate {
    constructor(id, nodes, edges) {
        this.config = config();
        this.nodes = nodes || [];
        this.edges = edges || [];
        //注意，这个id不一定是从网页获取到的，也可能是通过图表交互获得
        this.id = id;
        this.siyuanService=new SiyuanConnect();
    }
    //block节点
    async blockNode(block) {
        if (!block.content) {
            return
        }
        var result = {
            name: block.id,
            label: "",
            content: block.content,
            box: block.box,
            doc: block.root_id,
            type: block.type
        }
        var label = {
            name: "",
            content: "",
            tag: "",
            ref: ""
        }
        if (this.config.blockShow.isName) {
            label.name = block.name
        }
        if (this.config.blockShow.isTag) {
            let tag = await this.siyuanService.sql_FindTagContentbyID(block.id);
            let tagGroup = this.config.blockShow.tagGroup;
            tag.forEach(e => {
                if (tagGroup) {
                    if (e.indexOf(tagGroup) == 0) {
                        var tagArray = e.split("/");
                        label.tag += tagArray[tagArray.length - 1] + "/"
                    }
                } else {
                    label.tag += e + "/"
                }
            })
            label.tag = this.delDivide(label.tag);
        }
        if ((this.config.blockShow.isRefAfterDivide ||
            this.config.blockShow.isRefInBox) &&
            block.markdown) {
            const refList = await this.refListInOrder(block.markdown)
            for (let i = 0; i < refList.length; i++) {
                if (refList[i] == "关系" && refList[i + 1]) {
                    label.ref += refList[i + 1].content + "/"
                }
            }
            label.ref = this.delDivide(label.ref)
        }
        switch (block.type) {
            case "d":
            case "h":
                label.content = block.content;
                break;
        };
        //组合
        for (const key in label) {
            if (!label[key]) {
                continue;
            }
            result.label += label[key] + "/"
            if (this.config.blockShow.isShowByPriority) {
                break;
            }
        }
        result.label = this.delDivide(result.label)
        return result
    }
    edge() {

    }
    async refListInOrder(markdown) {
        var divideList = [];
        var refBox = "";
        if (this.config.blockShow.isRefInBox) {
            refBox = this.config.blockShow.refBox;
        }
        if (this.config.blockShow.isRefAfterDivide) {
            divideList.push(this.config.blockShow.refDivide);
        }
        for (const i in divideList) {
            divideList[i] += "(("
        }
        divideList.push("((");
        var blockList = [];
        var preIndex = 0;
        while (markdown) {
            let minIndex = markdown.length;
            let span = ""
            for (const divide of divideList) {
                let index = markdown.indexOf(divide);
                if (index != -1 && minIndex > index) {
                    minIndex = index;
                    span = divide;
                }
            }
            preIndex = minIndex + span.length;//不含((
            markdown = markdown.slice(preIndex);//去掉((之前
            if (!markdown) {
                break;
            }
            //提取id
            let index = markdown.indexOf("))");
            let ref = markdown.slice(0, index)
            let id = ref.slice(0, ref.indexOf(" "));
            let block = await this.siyuanService.sql_FindbyID(id);
            //标定类型
            if (span == this.config.blockShow.refDivide + "((") {
                blockList.push("关系");
            }
            if (block.box == refBox) {
                blockList.push("关系");
            }
            blockList.push(block);
            //去掉))之前
            preIndex = index + 2;
            markdown = markdown.slice(preIndex);
        }
        return blockList
    }
    //接收两个block列表,将它们转化为list1 to list2的形式
    //并添加到节点和边
    async toEchartsData(list1 = [], list2 = []) {
        //添加节点
        for (let i = 0; i < list1.length + list2.length; i++) {
            let block;
            if (i >= list1.length) {
                block = list2[i - list1.length];
            } else {
                block = list1[i];
            }
            //滤除空块
            if (!block.content) {
                continue;
            }
            this.AddNodes(await this.blockNode(block));
        }
        //添加关系
        for (let i = 0; i < list1.length; i++) {
            let block1 = list1[i];
            for (let j = 0; j < list2.length; j++) {
                let block2 = list2[j];
                if (block1.id && block2.id) {
                    this.AddEdges({
                        "source": block1.id,
                        "target": block2.id
                    })
                }
            }
        }
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


    //查询父级
    async dataParent(block) {
        if (!block) {
            return
        }
        if (!this.config.relation.isParent) {
            return
        }
        if (this.config.parentBox &&
            this.config.parentBox != block.box) {
            return
        }
        var parent = await this.siyuanService.sql_FindParentbyBlock(block)
        if (parent) {
            await this.toEchartsData([parent], [block]);
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
        if (this.config.relation.parentBox &&
            this.config.relation.parentBox != block.box) {
            return
        }
        var children = await this.siyuanService.sql_FindbyParentID(block.id);
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
        //引用需要经过过滤，不显示用于命名的引用
        var defList = await this.refListInOrder(block.markdown);
        var resultList = [];
        if (defList.length > 0) {
            let i = 0;
            while (defList[i]) {
                if (defList[i] == "关系") {
                    i++
                } else {
                    resultList.push(defList[i])
                }
                i++
            }
            await this.toEchartsData([block], resultList);
            return
        }
    }
    //反向引用
    async dataBackRef(block) {
        if (!block) {
            return
        }
        if (!this.config.relation.isBackRef) {
            return
        }
        var backDefList = await this.siyuanService.sql_FindBackDefbyID(block.id);
        if (backDefList.length > 0) {
            await this.toEchartsData(backDefList, [block]);
            backDefList.forEach(async (element) => {
                let id = element.id;//注意id变量的作用范围
                let defList = await this.siyuanService.sql_FindDefbyID(id);
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
        var block = await this.siyuanService.sql_FindbyID(this.id);
        await this.dataParent(block);
        await this.dataChildren(block);
        await this.dataRef(block);
        await this.dataBackRef(block);
        return [this.nodes, this.edges]
    }
    //删除最后一个“/”
    delDivide(str) {
        if (!str) {
            return
        }
        if (str.lastIndexOf("/") == str.length - 1) {
            return str.slice(0, -1);
        } else {
            return str
        }
    }
}
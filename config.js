"use strict";
/*配置文件会在每次调用的时候检查界面上的各选项
所以在绘图完成后，改变原有配置，继续与echarts进行交互
新生成的节点会按照最新配置生成，但旧节点不变*/
function config() {
    var config = {};
    config.port = document.getElementById("port").value || "6806";
    config.nodeId = document.getElementById("nodeId").value;
    config.relation = {};
    //关系建立选项
    var relation = config.relation;
    relation.isParent = document.getElementById("isParent").checked;
    relation.isChildren = document.getElementById("isChildren").checked;
    relation.isRef = document.getElementById("isRef").checked;
    relation.isBackRef = document.getElementById("isBackRef").checked;
    relation.parentBox = document.getElementById("parentBox").value;
    config.blockShow = {};
    //block的名称展示方式选项
    var blockShow = config.blockShow;
    blockShow.isName = document.getElementById("isName").checked;

    blockShow.isTag = document.getElementById("isTag").checked;
    blockShow.tagGroup = document.getElementById("tagGroup").value;

    blockShow.isRefInBox = document.getElementById("isRefInBox").checked;
    [blockShow.isRefInBox, blockShow.refBox] = checkInput("refBox", blockShow.isRefInBox);
    blockShow.isRefAfterDivide = document.getElementById("isRefAfterDivide").checked;
    [blockShow.isRefAfterDivide, blockShow.refDivide] = checkInput("refDivide", blockShow.isRefAfterDivide);

    blockShow.isShowByPriority = document.getElementById("isShowByPriority").checked;

    //引用合并模式
    config.refMerge = {}
    var refMerge = config.refMerge;
    refMerge.active = document.getElementById('refMergeActive').checked
    refMerge.nodeNotebook = document.getElementById("nodeNotebook").value;
    refMerge.docIsNode = document.getElementById('docIsNode').checked
    refMerge.titleIsNode = document.getElementById('titleIsNode').checked
    refMerge.otherIsNode = document.getElementById('otherIsNode').checked

    return config

    //检查输入，缺少必填项直接把按钮改成false
    function checkInput(id, preConfig) {
        if (!preConfig) {
            return [preConfig, ""]
        }
        const dom = document.getElementById(id)
        if (!dom.value) {
            //alert(`未输入必填项，程序会按照该项未选择执行`)
            return [false, ""]
        }
        return [preConfig, dom.value]
    }
}
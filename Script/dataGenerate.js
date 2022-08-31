"use strict";
/*global config SiyuanConnect _ siyuanNetwork2Params:true*/

/*数据生成相关 */
class dataGenerate {
  constructor(id, nodes, edges) {
    this.config = config();
    this.nodes = nodes || [];
    this.edges = edges || [];
    //注意，这个id不一定是从网页获取到的，也可能是通过图表交互获得
    this.id = id;
    this.siyuanService = new SiyuanConnect();
  }
  //block节点
  async blockNode(block) {
    var result = {
      name: block.id,
      label: "",
      content: block.content || block.markdown,
      box: block.box,
      doc: block.root_id,
      type: block.type,
      layerNum: siyuanNetwork2Params.layerNum,
    };
    var label = {
      name: "",
      content: "",
      tag: "",
      ref: "",
    };
    if (this.config.blockShow.isName) {
      label.name = block.name;
    }
    if (this.config.blockShow.isTag) {
      let tag = await this.siyuanService.sql_FindTagContentbyID(block.id);
      let tagGroup = this.config.blockShow.tagGroup;
      tag.forEach((e) => {
        if (tagGroup) {
          if (e.indexOf(tagGroup) == 0) {
            var tagArray = e.split("/");
            label.tag += tagArray[tagArray.length - 1] + "/";
          }
        } else {
          label.tag += e + "/";
        }
      });
      label.tag = this.delDivide(label.tag);
    }
    if (
      (this.config.blockShow.isRefAfterDivide ||
        this.config.blockShow.isRefInBox) &&
      block.markdown
    ) {
      const refList = await this.refListInOrder(block.markdown);
      for (let i = 0; i < refList.length; i++) {
        if (refList[i] == "关系" && refList[i + 1]) {
          label.ref += refList[i + 1].content + "/";
        }
      }
      label.ref = this.delDivide(label.ref);
    }
    switch (block.type) {
      case "d":
      case "h":
        label.content = block.content;
        break;
    }
    //组合
    for (const key in label) {
      if (!label[key]) {
        continue;
      }
      result.label += label[key] + "/";
      if (this.config.blockShow.isShowByPriority) {
        break;
      }
    }
    if (result.label) {
      result.label = this.delDivide(result.label);
    }
    return result;
  }
  //从文本中提取引用id，siyuanserver中有类似方法
  //但有改动，暂时不合并
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
      divideList[i] += "((";
    }
    divideList.push("((");
    var blockList = [];
    var preIndex = 0;
    while (markdown) {
      let minIndex = markdown.length;
      let span = "";
      for (const divide of divideList) {
        let index = markdown.indexOf(divide);
        if (index != -1 && minIndex > index) {
          minIndex = index;
          span = divide;
        }
      }
      preIndex = minIndex + span.length; //不含((
      markdown = markdown.slice(preIndex); //去掉((之前
      if (!markdown) {
        break;
      }
      //提取id
      let index = markdown.indexOf("))");
      let ref = markdown.slice(0, index);
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
    return blockList;
  }

  async keywordListInOrder(block) {
    var divideList = [];
    if (this.config.blockShow.isRefAfterDivide) {
      divideList.push(this.config.blockShow.refDivide);
    }
    //引用合并模式
    if (this.config.refMerge.active) {
      divideList = divideList.concat(this.config.refMerge.andSymbol);
      if (this.config.refMerge.stopSymbol) {
        divideList.push(this.config.refMerge.stopSymbol);
      }
    }
    var keywordList = await this.siyuanService.keywordListInOrder(
      block,
      divideList
    );
    /*for(const a of keywordList){
      console.log(`${a.markdown}从${a.minIndex}到${a.maxIndex}`)
    }*/
    var resultList = [];
    for (let i = 0; i < keywordList.length; i++) {
      var e = keywordList[i];
      //标签
      if (e.type == "tag" && this.config.blockShow.isTag) {
        const tagGroup = this.config.blockShow.tagGroup;
        if (tagGroup && e.content.indexOf(tagGroup + "/") != 0) {
          continue;
        } else {
          e.dataType = "关系";
          resultList.push(e);
          continue;
        }
      }
      //专用笔记本内引用
      if (
        e.type != "tag" &&
        e.type != "text" &&
        this.config.blockShow.isRefInBox
      ) {
        const refBox = this.config.blockShow.refBox;
        if (e.box == refBox) {
          e.dataType = "关系";
          resultList.push(e);
          continue;
        }
      }
      //文本及后面的关系
      if (e.type == "text" && e.markdown && keywordList[i + 1]) {
        if (
          //不是紧挨着
          e.maxIndex != keywordList[i + 1].minIndex ||
          //或者后一个不是块
          keywordList[i + 1].type == "tag" ||
          keywordList[i + 1].type == "text"
        ) {
          continue;
        }
        let e2 = keywordList[i + 1];
        i++; //!
        if (e.markdown == this.config.blockShow.refDivide) {
          e2.dataType = "关系";
        } else if (e.markdown == this.config.refMerge.stopSymbol) {
          e2.dataType = "实体-暂停";
        } else if (this.config.refMerge.andSymbol.indexOf(e.markdown) != -1) {
          e2.dataType = "实体-和";
        }
        resultList.push(e2);
        continue;
      }
      //最后如果是标识，不处理
      if (e.type == "text" && !keywordList[i + 1]) {
        continue;
      }
      //相当于默认值
      e.dataType = "实体";
      resultList.push(e);
    }
    return resultList;
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
      this.AddNodes(block);
    }
    //添加关系
    for (let i = 0; i < list1.length; i++) {
      let block1 = list1[i];
      for (let j = 0; j < list2.length; j++) {
        let block2 = list2[j];
        if (block1.name && block2.name) {
          this.AddEdges({
            source: block1.name,
            target: block2.name,
            layerNum: siyuanNetwork2Params.layerNum,
          });
        }
      }
    }
    return;
  }

  //向DataSet中尝试添加新数据
  AddNodes(newdata) {
    if (!_.has(newdata, "length")) {
      newdata = [newdata];
    }
    for (let d of newdata) {
      let duplicateFlag = false;
      for (let i = 0; i < this.nodes.length; i++) {
        let n = this.nodes[i];
        if (n.name == d.name) {
          duplicateFlag = true;
          //以新数据为准,但是layerNum不变
          d.layerNum = this.nodes[i].layerNum;
          this.nodes[i] = d;
        }
      }
      if (!duplicateFlag) {
        this.nodes.push(d);
      }
    }
    return;
  }
  AddEdges(newdata) {
    if (!_.has(newdata, "length")) {
      newdata = [newdata];
    }
    for (let d of newdata) {
      if (
        !_.some(this.edges, (o) => {
          return o.source == d.source && o.target == d.target;
        }) &&
        d.source != d.target
      ) {
        //防止自引用
        this.edges.push(d);
      }
    }
    return;
  }

  //查询父级
  async dataParent(block) {
    if (!block) {
      return;
    }
    if (!this.config.relation.isParent) {
      return;
    }
    if (this.config.parentBox && this.config.parentBox != block.box) {
      return;
    }
    var parent = await this.siyuanService.sql_FindParentbyBlock(block);
    if (parent) {
      await this.toEchartsData(
        [await this.blockNode(parent)],
        [await this.blockNode(block)]
      );
    }
    return;
  }

  //查询子级
  async dataChildren(block) {
    if (!block) {
      return;
    }
    if (!this.config.relation.isChildren) {
      return;
    }
    if (
      this.config.relation.parentBox &&
      this.config.relation.parentBox != block.box
    ) {
      return;
    }
    var children = await this.siyuanService.sql_FindbyParentID(block.id);
    if (children.length > 0) {
      let childrenNodes = [];
      for (const c of children) {
        if (c.content || c.markdown) {
          childrenNodes.push(await this.blockNode(c));
        }
      }
      await this.toEchartsData([await this.blockNode(block)], childrenNodes);
    }
    return;
  }

  //引用
  async dataRef(block) {
    if (!block) {
      return;
    }
    if (!this.config.relation.isRef) {
      return;
    }
    //引用需要经过过滤，不显示用于命名的引用
    var defList = await this.refListInOrder(block.markdown);
    var resultList = [];
    if (defList.length > 0) {
      let i = 0;
      while (defList[i]) {
        if (defList[i] == "关系") {
          i++;
        } else {
          resultList.push(await this.blockNode(defList[i]));
        }
        i++;
      }
      await this.toEchartsData([await this.blockNode(block)], resultList);
      return;
    }
  }
  //反向引用
  async dataBackRef(block) {
    if (!block) {
      return;
    }
    if (!this.config.relation.isBackRef) {
      return;
    }
    var backDefList = await this.siyuanService.sql_FindBackDefbyID(block.id);
    if (backDefList.length > 0) {
      for (const b of backDefList) {
        if (this.config.refMerge.active) {
          await this.dataVisual(b);
        } else {
          await this.dataRef(b);
        }
      }
    }
    return;
  }

  //虚拟节点关系
  async dataVisual(block) {
    if (!block) {
      return;
    }
    const keywordListInOrder = await this.keywordListInOrder(block);
    let preNode;
    let andList = [];
    let stopNode; //暂存的上一组组配结果
    let relaNode = await this.blockNode(block);
    let relaFlag = false;
    for (let i = 0; i < keywordListInOrder.length; i++) {
      const node = keywordListInOrder[i];
      const blockNode = await this.blockNode(node);
      //因为无分隔符号导致未找到关系时，会默认将最后一个实体作为关系处理
      if (
        i == keywordListInOrder.length - 1 &&
        relaFlag == false &&
        node.dataType != "关系"
      ) {
        node.dataType = "关系";
        relaNode.label = blockNode.label;
      }
      //普通实体
      if (node.dataType == "实体") {
        if (preNode) {
          const mergeNode = this.visualNode(preNode, blockNode);
          await this.toEchartsData([preNode, blockNode], [mergeNode]);
          preNode = mergeNode;
        } else {
          preNode = blockNode;
        }
      }
      //结束上一组-与stopNode组配
      if (
        (node.dataType == "实体-和" ||
          node.dataType == "实体-暂停" ||
          node.dataType == "关系") &&
        stopNode &&
        preNode
      ) {
        const mergeNode = this.visualNode(stopNode, preNode);
        await this.toEchartsData([stopNode, preNode], [mergeNode]);
        preNode = mergeNode;
      }
      //开始下一组
      if (node.dataType == "实体-和") {
        if (preNode) {
          andList.push(preNode);
        }
        preNode = blockNode;
      }
      if (node.dataType == "实体-暂停") {
        if (preNode) {
          stopNode = preNode;
        }
        preNode = blockNode;
      }
      //关系
      if (node.dataType == "关系") {
        relaFlag = true;
        if (preNode) {
          andList.push(preNode); //这样及时andList为空也可以运行
        }
        preNode = null;
        let label = "";
        for (const a of andList) {
          label += a.label + "/";
        }
        if (relaNode.label) {
          relaNode.label = label + relaNode.label;
        } else {
          relaNode.label = this.delDivide(label);
        }
        await this.toEchartsData(andList, [relaNode]);
        andList = [];
      }
    }
    //最后一次链接
    if (preNode) {
      andList.push(preNode);
    }
    if (andList.length > 0) {
      await this.toEchartsData([relaNode], andList);
    }
  }
  return;

  //虚拟节点
  visualNode(blockNode1, blockNode2) {
    var result = {
      name: blockNode1.name + "-" + blockNode2.name,
      label: blockNode1.label + "/" + blockNode2.label,
      content: "虚拟节点无内容",
      box: "虚拟节点",
      doc: "虚拟节点",
      type: "虚拟节点",
      dataType: "虚拟节点",
      layerNum: siyuanNetwork2Params.layerNum,
    };
    return result;
  }

  //删除最后一个“/”
  delDivide(str) {
    if (!str) {
      return;
    }
    if (str.lastIndexOf("/") == str.length - 1) {
      return str.slice(0, -1);
    } else {
      return str;
    }
  }
  //暴露的函数
  //添加节点和关系
  findAndAdd = async function () {
    if (!this.id) {
      return;
    }
    //虚拟节点不处理
    if (this.id.length > 22) {
      return [this.nodes, this.edges];
    }
    siyuanNetwork2Params.layerNum++;
    var block = await this.siyuanService.sql_FindbyID(this.id);
    await this.dataParent(block);
    await this.dataChildren(block);
    if (this.config.refMerge.active) {
      await this.dataVisual(block);
    } else {
      await this.dataRef(block);
    }
    await this.dataBackRef(block);
    return [this.nodes, this.edges];
  };
  //删除节点,会删除节点及其后代
  findAndDel = async function () {
    if (!this.id) {
      return;
    }
    //获取节点,注意，本节点不删除
    let nodeRemoved = [
      _.find(this.nodes, (o) => {
        return o.name == this.id;
      }),
    ];
    do {
      for (const node of nodeRemoved) {
        //获取下层边,并删除
        let edgesRemoved = _.remove(this.edges, (o) => {
          return (
            (o.source == node.name || o.target == node.name) &&
            o.layerNum > node.layerNum
          );
        });
        //获取删除的边连接的下级节点
        nodeRemoved = _.remove(this.nodes, (o) => {
          //不在边连接的节点中，不删除
          if (
            !_.some(edgesRemoved, (edge) => {
              return edge.source == o.name || edge.target == o.name;
            })
          ) {
            return false;
          }
          //同级和更早的节点不删除
          if (o.layerNum <= node.layerNum) {
            return false;
          }
          return true;
        });
      }
    } while (nodeRemoved.length > 0); //直到没有可以删除的
    return [this.nodes, this.edges];
  };
}

if (typeof module === "object") {
  module.exports = dataGenerate;
}

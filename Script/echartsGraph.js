"use strict";
/*global echarts _ :true*/
/*图表相关，包括图表交互事件 */
import { SiyuanConnect } from "./SiyuanConnect.js";

export default {
  props: ["config"],
  data() {
    return {
      nodes: [],
      edges: [],
      myChart: null,
      siyuanService: new SiyuanConnect(),
      layerNum: 0,
      layerMax: 11,
    };
  },
  watch: {
    //根据层级显示
    layerMax(layerMax_new, layerMax_old) {
      if (layerMax_new == 11) {
        return;
      }
      if (layerMax_new == layerMax_old) {
        return;
      }
      const layerNumForDel = this.layerNum - layerMax_new;
      if (layerNumForDel <= 0) {
        return;
      }
      for (let node of this.nodes) {
        if (!node.itemStyle) {
          node.itemStyle = {};
        }
        if (node.layerNum <= layerNumForDel) {
          node.itemStyle.opacity = 0.25;
        } else {
          node.itemStyle.opacity = 1;
        }
      }
      for (let edge of this.edges) {
        if (!edge.lineStyle) {
          edge.lineStyle = {};
        }
        if (edge.layerNum <= layerNumForDel) {
          edge.lineStyle.opacity = 0.25;
        } else {
          edge.lineStyle.opacity = 1;
        }
      }
      this.update();
    },
  },
  computed: {
    layerMaxForShow() {
      if (this.layerMax == 11) {
        return "Max";
      } else {
        return this.layerMax;
      }
    },
  },
  methods: {
    //更新显示
    update() {
      this.myChart.setOption({
        series: [
          {
            type: "graph",
            data: this.nodes,
            links: this.edges,
          },
        ],
      });
      //强制刷新
      this.$forceUpdate();
      //console.log(this.myChart.getOption());
    },
    //block节点
    async blockNode(block, category) {
      if (block.markdown == "未找到的节点") {
        category = "错误";
      }
      var result = {
        name: block.id,
        label: "",
        content: block.content || block.markdown,
        box: block.box,
        doc: block.root_id,
        type: block.type,
        layerNum: this.layerNum,
        category: category || "实体",
      };
      var label = {
        name: "",
        content: "",
        tag: "",
        ref: "",
      };
      //name
      if (this.config.blockShow.isName) {
        label.name = block.name;
      }
      //tag
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
      //ref
      if (
        (this.config.blockShow.isRefAfterDivide ||
          this.config.blockShow.isRefInBox) &&
        block.markdown
      ) {
        const refList = await this.keywordListInOrder(block);
        for (let i = 0; i < refList.length; i++) {
          if (refList[i] == "关系" && refList[i + 1]) {
            label.ref += refList[i + 1].content + "/";
          }
        }
        label.ref = this.delDivide(label.ref);
      }
      //content
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
    },
    //关键词列表
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
        if (this.config.refMerge.isolateSymbol) {
          divideList.push(this.config.refMerge.isolateSymbol);
        }
      }
      var keywordList = await this.siyuanService.keywordListInOrder(
        block,
        divideList
      );
      var resultList = [];
      var nextDataType;
      for (let i = 0; i < keywordList.length; i++) {
        var e = keywordList[i];
        //前一个标记的类型
        if (nextDataType) {
          e.dataType = nextDataType;
          resultList.push(e);
          nextDataType = undefined;
          continue;
        }
        //标签
        if (e.keywordType == "tag") {
          if (this.config.blockShow.isTag) {
            const tagGroup = this.config.blockShow.tagGroup;
            if (tagGroup && e.content.indexOf(tagGroup + "/") != 0) {
              continue;
            } else {
              e.dataType = "关系";
              resultList.push(e);
              continue;
            }
          } else {
            continue;
          }
        }
        //专用笔记本内引用
        if (e.keywordType == "block" && this.config.blockShow.isRefInBox) {
          const refBox = this.config.blockShow.refBox;
          if (e.box == refBox) {
            e.dataType = "关系";
            resultList.push(e);
            continue;
          }
        }
        //文本及后面的关系
        if (e.keywordType == "text") {
          //最后如果是标识，不处理
          if (!keywordList[i + 1]) {
            continue;
          }
          if (
            //不是紧挨着
            e.textIndex + e.long != keywordList[i + 1].textIndex ||
            //或者后一个不是块
            keywordList[i + 1].keywordType != "block"
          ) {
            continue;
          }
          if (e.keywordType == "text" && keywordList[i + 1]) {
            if (e.markdown == this.config.blockShow.refDivide) {
              nextDataType = "关系";
            } else if (e.markdown == this.config.refMerge.stopSymbol) {
              nextDataType = "实体-暂停";
            } else if (e.markdown == this.config.refMerge.isolateSymbol) {
              nextDataType = "孤立";
            } else if (
              this.config.refMerge.andSymbol.indexOf(e.markdown) != -1
              && i>0//第一个不能为“实体-和”
            ) {
              nextDataType = "实体-和";
            }
            continue;
          }
        }
        //相当于默认值
        e.dataType = "实体";
        resultList.push(e);
      }
      return resultList;
    },
    //接收两个block列表,将它们转化为list1 to list2的形式
    //并添加到节点和边
    async toEchartsData(list1 = [], list2 = [], linkType) {
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
            /*
            let value = 50;
            if (block1.box == block2.box && block1.box != "虚拟节点") {
              //同文件夹吸引
              value = value + 10;
            }
            if (block1.doc == block2.doc && block1.doc != "虚拟节点") {
              //同文档吸引
              value = value + 10;
            }
            if (block1.type == "h" || block2.type == "h") {
              //标题吸引其他节点
              value = value + 10;
            }
            if (
              (block1.type == "visualNode" && block2.type != "visualNode") ||
              (block1.type != "visualNode" && block2.type == "visualNode")
            ) {
              //虚拟节点排斥其他节点,注意，虚拟块之间并不互相排斥
              value = value - 20;
            }
            if (
              block1.type == "visulaNodeByText" ||
              block2.type == "visulaNodeByText"
            ) {
              //虚拟文字节点吸引其他节点
              value = value + 20;
            }*/
            this.AddEdges({
              source: block1.name,
              target: block2.name,
              layerNum: this.layerNum,
              //value: value,
              label: linkType,
            });
          }
        }
      }
      return;
    },

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
    },
    AddEdges(newdata) {
      if (!_.has(newdata, "length")) {
        newdata = [newdata];
      }
      for (let d of newdata) {
        if (
          //防止自引用
          !_.some(this.edges, (o) => {
            return o.source == d.source && o.target == d.target;
          }) &&
          d.source != d.target
        ) {
          this.edges.push(d);
        }
      }
      return;
    },

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
      //忽略实体所在文件夹
      if (
        block.box == this.config.refMerge.nodeNotebook &&
        this.config.refMerge.active
      ) {
        return;
      }
      var parent = await this.siyuanService.sql_FindParentbyBlock(block);
      if (parent) {
        //let relaNode = this.visulaNodeByText("子级");
        //await this.toEchartsData([await this.blockNode(parent)], [relaNode]);
        //await this.toEchartsData([relaNode], [await this.blockNode(block)]);
        await this.toEchartsData(
          [await this.blockNode(parent)],
          [await this.blockNode(block)],
          "子级"
        );
      }
      return;
    },

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
      //忽略实体所在文件夹
      if (
        block.box == this.config.refMerge.nodeNotebook &&
        this.config.refMerge.active
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
        //let relaNode = this.visulaNodeByText("子级");
        //await this.toEchartsData([await this.blockNode(block)], [relaNode]);
        //await this.toEchartsData([relaNode], childrenNodes);
        await this.toEchartsData(
          [await this.blockNode(block)],
          childrenNodes,
          "子级"
        );
        //子节点自动展开
        for (const c of children) {
          if (this.config.refMerge.active) {
            await this.dataVisual(c);
          } else {
            await this.dataRef(c);
          }
        }
      }
      return;
    },
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
        await this.toEchartsData(
          [await this.blockNode(block)],
          resultList,
          "引用"
        );
        return;
      }
    },
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
    },

    //虚拟节点关系
    async dataVisual(block) {
      if (!block) {
        return;
      }
      let relaNode = await this.blockNode(block, "关系");
      let keywordListInOrder2 = await this.keywordListInOrder(block);
      //孤立组配剔除
      let tempList = [];
      for (const node of keywordListInOrder2) {
        if (node.dataType == "孤立") {
          await this.toEchartsData(
            [relaNode],
            [await this.blockNode(node)],
            "一般引用"
          );
        } else {
          tempList.push(node);
        }
      }
      keywordListInOrder2 = tempList;
      //分割
      let keywordList = [];
      let relaFlag = false;
      for (let i = 0; i < keywordListInOrder2.length; i++) {
        const node = keywordListInOrder2[i];
        //因为无分隔符号导致未找到关系时，会默认将最后一个实体作为关系处理
        if (
          i == keywordListInOrder2.length - 1 &&
          relaFlag == false &&
          node.dataType != "关系"
        ) {
          node.dataType = "关系";
        }
        //通过关系分割为3块（rela以及rela前后）
        if (node.dataType == "关系") {
          relaFlag = true;
          const blockNode = await this.blockNode(node);
          relaNode.label = blockNode.label;
          keywordList.push(keywordListInOrder2.slice(0, i));
          if (i < keywordListInOrder2.length - 1) {
            keywordList.push(keywordListInOrder2.slice(i + 1));
          }
          break;
        }
      }
      //暂停组配符分割
      for (let i = 0; i < keywordList.length; i++) {
        const relaList = keywordList[i];
        let stopList = [];
        let lastj = 0;
        for (let j = 0; j < relaList.length; j++) {
          const node = relaList[j];
          if (node.dataType == "实体-暂停") {
            stopList.push(relaList.slice(lastj, j));
            lastj = j;
          }
          if (j == relaList.length - 1) {
            stopList.push(relaList.slice(lastj));
          }
        }
        keywordList[i] = stopList;
      }
      //和组配符分割
      for (let i = 0; i < keywordList.length; i++) {
        const relaList = keywordList[i];
        for (let k = 0; k < relaList.length; k++) {
          const stopList = relaList[k];
          let andList = [];
          let lastj = 0;
          for (let j = 0; j < stopList.length; j++) {
            const node = stopList[j];
            if (node.dataType == "实体-和") {
              andList.push(stopList.slice(lastj, j));
              lastj = j;
            }
            if (j == stopList.length - 1) {
              andList.push(stopList.slice(lastj));
            }
          }
          keywordList[i][k] = andList;
        }
      }
      //组配
      let startAndEnd = []; //合并后的relaList
      for (let i = 0; i < keywordList.length; i++) {
        const relaList = keywordList[i];
        let preList = [];
        for (const stopList of relaList) {
          //stopList下各组是并列的
          let currentList = [];
          for (const andList of stopList) {
            //andList中全是实体，需要组配
            let preNode;
            for (const node of andList) {
              const blockNode = await this.blockNode(node);
              if (preNode) {
                const mergeNode = this.visualNode(preNode, blockNode);
                await this.toEchartsData(
                  [preNode, blockNode],
                  [mergeNode],
                  "组配"
                );
                preNode = mergeNode;
              } else {
                preNode = blockNode;
              }
            }
            currentList.push(preNode);
          }
          if (preList.length == 0) {
            preList = currentList;
          } else {
            let tempList = [];
            for (const preNode of preList) {
              for (const blockNode of currentList) {
                const mergeNode = this.visualNode(preNode, blockNode);
                await this.toEchartsData(
                  [preNode, blockNode],
                  [mergeNode],
                  "组配"
                );
                tempList.push(mergeNode);
              }
            }
            preList = tempList;
          }
        }
        startAndEnd.push(preList);
      }
      //格式化关系标签
      let label = ["", ""];
      for (let m = 0; m < startAndEnd.length; m++) {
        const startOrEnd = startAndEnd[m];
        for (let i = 0; i < startOrEnd.length; i++) {
          const a = startOrEnd[i];
          if (i < startOrEnd.length - 1) {
            label[m] += a.label + ",";
          } else {
            label[m] += a.label;
          }
        }
      }
      if (relaNode.label && relaNode.type != "d" && relaNode.type != "h") {
        if (label[0]) {
          relaNode.label = label[0] + "->" + relaNode.label;
        }
        if (label[1]) {
          relaNode.label = relaNode.label + "->" + label[1];
        }
      }
      //与关系组配
      await this.toEchartsData(startAndEnd[0], [relaNode], "反向引用");
      await this.toEchartsData([relaNode], startAndEnd[1], "引用");
      return;
    },
    //虚拟节点
    visualNode(blockNode1, blockNode2) {
      var result = {
        name: blockNode1.name + "-" + blockNode2.name,
        label: blockNode1.label + "/" + blockNode2.label,
        content: "虚拟节点无内容",
        box: "虚拟节点",
        doc: "虚拟节点",
        type: "visualNode",
        layerNum: this.layerNum,
        category: "虚拟",
      };
      return result;
    },
    //由文本创建的虚拟节点，在特殊情况下使用（父子节点,错误节点）
    visulaNodeByText(text) {
      return {
        name: this.siyuanService.blockId(),
        label: text,
        content: "虚拟节点无内容",
        box: "虚拟节点",
        doc: "虚拟节点",
        type: "visulaNodeByText",
        layerNum: this.layerNum,
      };
    },
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
    },
    //暴露的函数
    //重置
    reset(id) {
      this.nodes = [];
      this.edges = [];
      this.findAndAdd(id);
    },
    //添加节点和关系
    async findAndAdd(id) {
      if (!id) {
        return;
      }
      //虚拟节点不处理
      if (id.length > 22) {
        return [this.nodes, this.edges];
      }
      this.layerNum++;
      var block = await this.siyuanService.sql_FindbyID(id);
      await this.dataParent(block);
      await this.dataChildren(block);
      if (this.config.refMerge.active) {
        await this.dataVisual(block);
      } else {
        await this.dataRef(block);
      }
      await this.dataBackRef(block);
      this.update();
    },
    //删除节点,会删除节点及其后代
    async findAndDel(id) {
      if (!id) {
        return;
      }
      //获取节点,注意，本节点不删除
      let nodeRemoved = [
        _.find(this.nodes, (o) => {
          return o.name == id;
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
      this.update();
    },
  },
  mounted() {
    //初始化图表
    var myChart = echarts.init(this.$refs.echartsGraph, {
      renderer: "svg",
    });
    /** @type EChartsOption */
    var initOptions = {
      title: {
        text: "知识网络图",
        show: false,
      },
      tooltip: {
        show: true,
        trigger: "item",
        //alwaysShowContent: true,
        confine: true,
        enterable: true,
      },
      toolbox: {
        show: true,
        showTitle: true,
        itemSize: 30,
        feature: {
          restore: {
            show: true,
          },
          //图表设置
          mySetting: {
            show: true,
            title: "图表设置",
            icon: "path://M545.784454,962.539206l-65.943898,0c-29.341259,0-54.624085-25.281803-54.624085-54.615898L425.216471,868.462574c0-9.623171-7.826246-20.911262-16.690124-23.680329l-1.566682-0.611937-55.725162-23.104207-0.880043-0.494257c-8.153704-4.41045-22.017456-2.376117-28.55229,4.187369l-28.17469,28.123524c-9.930163,9.977235-23.239284,15.494902-37.432541,15.494902-14.195304,0-27.507494-5.517667-37.487799-15.541975l-46.682205-46.630017c-20.60427-20.603247-20.6319-54.233182-0.069585-74.974575l28.15013-28.106128c6.637164-6.574742,8.676613-20.599154,4.253884-28.909423l-0.831948-1.768273-23.164582-56.128345-0.26913-0.682545c-2.803859-9.03477-14.279215-17.394159-23.611767-17.394159l-39.631626,0c-29.391401,0-52.861952-24.065092-52.861952-53.193503l0-65.943898c0-28.770254,22.998807-51.754734,52.919257-51.754734l39.575344,0c9.081843,0,20.803815-8.830109,23.666002-18.057261l0.567935-1.476631,23.163559-57.088206,0.505513-0.913812c4.40431-8.220219,2.319835-22.224164-4.2897-28.830629l-28.04166-28.087709c-9.964956-9.921977-15.486716-23.216771-15.502066-37.396725-0.01535-14.201443,5.492084-27.53717,15.507182-37.552268l46.6556-46.614667c9.94142-9.985422,23.248494-15.503089,37.432541-15.503089,0.001023,0,0,0,0.001023,0,14.184047,0,27.490098,5.51869,37.46938,15.540951l28.039613,28.05087c6.557346,6.525624,20.500916,8.596795,28.655643,4.231371l0.893346-0.478907,57.375755-23.64963c8.836249-2.731204,16.634866-14.037714,16.634866-23.719214l0-39.632649c0-28.967752,24.777313-52.095495,54.624085-52.095495L545.784454,64.076364c29.161157,0,52.370765,22.636556,52.370765,52.095495l0,39.632649c0,9.127891,8.709359,20.85498,17.767666,23.674189l1.51654,0.577145,56.639998,23.113417,0.923022,0.509606c8.202822,4.424776,22.184255,2.353604,28.788673-4.254907l28.163433-27.912723c9.895371-9.94142,23.179932-15.33936,37.352723-15.33936,0.019443,0,0.040932,0,0.060375,0,14.18814,0,27.508517,5.375427,37.516452,15.384385l46.709835,46.554292c10.004865,9.960863,15.524578,23.254633,15.524578,37.47552,0,14.18814-5.498224,27.506471-15.479553,37.532825l-28.16855,28.152177c-6.580882,6.610558-8.640798,20.771069-4.204765,29.107945l0.478907,0.896416,23.654746,57.956993c2.902096,9.255805,14.635325,18.114566,23.686469,18.114566l39.132252,0,0-0.573051c27.629267,0,52.188616,22.984481,52.188616,52.327786l0,65.998133c0,29.590945-22.985504,53.138244-51.746548,53.138244l-39.630602,0c-9.337669,0-20.84884,8.372691-23.686469,17.423835l-0.580215,1.51654-23.086811,56.240909-0.468674,0.860601c-4.419659,8.30413-2.393513,22.320355,4.169973,28.855188l28.135804,28.02017c10.031471,10.029424,15.539928,23.350824,15.537881,37.541011-0.004093,14.186094-5.514597,27.505447-15.518438,37.505195l-46.747697,46.682205c-9.920954,9.964956-23.219841,15.506159-37.406958,15.506159-0.019443,0-0.040932,0-0.060375,0-14.192234,0-27.514657-5.514597-37.518498-15.517415l-28.039613-28.095895c-6.490831-6.490831-20.807908-8.575306-28.887934-4.206812l-0.951675,0.514723-57.93755,23.680329c-9.087982,2.859118-17.823947,14.594393-17.823947,23.691585l0,39.460734C598.155219,937.76394,574.45954,962.539206,545.784454,962.539206zM421.86719,806.892287c25.192775,8.370645,44.282552,34.650171,44.282552,61.570287l0,39.460734c0,7.114025,6.569626,13.68365,13.691837,13.68365L545.784454,921.606958c6.496971,0,12.461823-6.043646,12.461823-13.68365L558.246277,868.462574c0-26.273387,19.516496-53.131081,44.901653-61.58052l53.859675-22.062482c23.62814-12.116969,56.342216-7.098675,75.118861,11.6749l28.009937,28.1532c2.432399,2.430352,5.678326,3.837398,9.179057,3.837398,0.00614,0,0.011256,0,0.01535,0,3.482311,0,6.726192-1.39886,9.135054-3.820002l46.780443-46.738487c2.436492-2.436492,3.783163-5.724375,3.78521-9.224082,0-3.495614-1.344624-6.774287-3.787256-9.216919l-28.106128-27.998681c-18.693758-18.609847-23.762193-51.349505-11.773138-75.036997l22.083971-53.603849c8.374738-25.167193,35.224246-44.51382,61.578474-44.51382l39.630602,0c7.745405,0,10.8143-7.086395,10.8143-13.229303l0-65.998133c0-6.862291-5.116531-12.07399-11.256368-12.302187l0,1.479701-39.132252,0c-26.236548,0-53.099359-20.149922-61.585637-45.735647l-22.083971-54.261834c-11.960403-23.654746-6.913457-56.502875,11.728112-75.228355l28.16855-28.192086c2.430352-2.441609,3.78828-5.764284,3.78828-9.295714,0-3.498684-1.334391-6.762007-3.759627-9.17394l-46.741557-46.577828c-2.462075-2.462075-5.736655-3.734044-9.234315-3.734044-0.004093,0-0.010233,0-0.013303,0-3.465938,0-6.700609,1.255597-9.105379,3.671623l-28.198226,28.037567c-18.703991,18.710131-51.417043,23.734564-75.000158,11.69025l-53.865815-22.072715c-25.403576-8.388041-44.934398-35.255968-44.934398-61.60508l0-39.632649c0-7.253194-5.517667-12.186554-12.461823-12.186554l-65.943898,0c-7.517207,0-13.691837,5.51869-13.691837,12.186554l0,39.632649c0,27.027563-19.107173,53.336766-44.325531,61.643965l-53.501518,21.99699c-23.834848,12.168134-55.857169,7.234775-74.878384-11.69639l-28.130687-28.115338c-2.441609-2.451842-5.690606-3.787256-9.152451-3.787256-3.462868-0.001023-6.704702,1.334391-9.117658,3.758604l-46.690392,46.64639c-2.438539,2.438539-3.784186,5.710049-3.781116,9.207709,0.004093,3.474125,1.339508,6.716982,3.762697,9.128915l28.068266,28.121478c18.698874,18.690688,23.782659,51.389414,11.808954,74.973552l-22.124903,54.813397c-8.413624,25.616424-35.281551,45.783743-61.603033,45.783743l-39.575344,0c-6.630001,0-13.010315,3.411703-13.010315,10.822486l0,65.943898c0,6.942109,5.753027,13.284561,12.95301,13.284561l39.631626,0c26.380834,0,53.195549,19.35072,61.524239,44.537356l22.182208,53.629431c12.027941,23.731494,6.918573,56.449663-11.863189,75.05644l-28.022217,27.949562c-5.021364,5.066389-5.048993,13.348006,0.010233,18.409279l46.713928,46.653553c2.452865,2.464121,5.695722,3.794419,9.168824,3.794419,3.472078,0,6.711865-1.336438,9.124821-3.759627l28.181853-28.122501c18.641569-18.730597,51.440579-23.752983,75.011414-11.642155L421.86719,806.892287z M513.734504,731.880873c-120.639614,0-218.786958-98.147344-218.786958-218.786958s98.147344-218.786958,218.786958-218.786958,218.786958,98.147344,218.786958,218.786958S634.375142,731.880873,513.734504,731.880873zM513.734504,334.324368c-98.573039,0-178.769546,80.195483-178.769546,178.769546s80.195483,178.769546,178.769546,178.769546,178.769546-80.195483,178.769546-178.769546S612.308567,334.324368,513.734504,334.324368z",
            onclick: function () {
              var menu = document.getElementById("echartGlobeMenu");
              menu.style.display = "flex";
            },
          },
        },
      },
      color: ["#5470c6", "#686868", "#ee6666", "#91cc75"],
      //蓝灰红绿
      series: [
        {
          id: "graphMain",
          type: "graph",
          layout: "force",
          zoom: 2,
          force: {
            edgeLength: [10, 50],
          },
          label: {
            show: true,
            color: "#fff",
            textBorderType: "solid",
            textBorderColor: "inherit",
            textBorderWidth: 2,
            formatter: (data) => {
              let label;
              if (data.data.label) {
                label = data.data.label;
              } else {
                label = data.data.content.slice(0, 5) + "...";
              }
              return label;
            },
          },
          edgeLabel: {
            show: true,
            formatter: (data) => {
              let label;
              //console.log(data.data.label)
              if (data.data.label) {
                label = data.data.label;
              } else {
                label = "";
              }
              return label;
            },
            color: "#c1d1cf",
          },
          roam: true,
          draggable: true,
          edgeSymbol: ["none", "arrow"],
          tooltip: {
            //悬浮显示详情
            //position: "top",
            formatter: (data) => {
              let text = data.data.content;
              if (!text) {
                return;
              }
              //设置换行总是不行，直接用css实现
              return `<p id="echartsTooltip" class="echartsTooltip">${text}</p>`;
            },
            textStyle: {},
            extraCssText: "",
          },
          categories: [
            {
              name: "实体",
            },
            {
              name: "虚拟",
            },
            {
              name: "错误",
            },
            {
              name: "关系",
            },
          ],
        },
      ],
    };
    myChart.setOption(initOptions);

    //响应容器大小的变化
    window.onresize = function () {
      myChart.resize();
    };
    /*双击展开节点->移至右键菜单
    myChart.on("dblclick", function (params) {
      if (params.dataType != "node") {
        return;
      }
      var id = params.data.name;
      //虚拟节点不处理
      if (id.length > 22) {
        return;
      }
      //this.findAndAdd(id);
    });*/
    //右键菜单
    myChart.on("click", function (params) {
      //关默认
      params.event.event.preventDefault();
      //显示菜单
      var menu = document.getElementById("echartsMenu");
      menu.style.position = "absolute";
      menu.style.left = params.event.offsetX + "px";
      menu.style.top = params.event.offsetY + "px";
      menu.style.display = "block";
      //传参
      document.getElementById("echartsMenuHref").href =
        "siyuan://blocks/" + params.name;
      menu.paramsId = params.name;
    });
    //移除右键菜单
    myChart.getZr().on("click", function (event) {
      // 没有 target 意味着鼠标/指针不在任何一个图形元素上，它是从“空白处”触发的。
      if (!event.target) {
        var idList = ["echartsMenu", "echartsMenu", "echartsTooltip"];
        for (const id of idList) {
          let menu = document.getElementById(id);
          if (menu) {
            menu.style.display = "none";
          }
        }
      }
    });
    this.myChart = myChart;
  },
  template: /*html */ `
  <div style="margin-top: 20px" class="grid">
    <button @click="reset(this.config.nodeId)" type="button">绘制</button>
  </div>
  <div id="echartsContainer">
    <div ref="echartsGraph" id="echartsGraph"></div>
    <div id="echartsMenu" class="right-menu" ref="echartsMenu">
        <a href="javascript:void(0)" @click="findAndAdd(this.$refs.echartsMenu.paramsId)">展开节点</a>
        <a href="" id="echartsMenuHref">定位到块</a>
        <a href="javascript:void(0)" @click="findAndDel(this.$refs.echartsMenu.paramsId)">收起节点</a>
    </div>
    <div id="echartGlobeMenu" class="right-menu">
      <div class="menu-item">
        <span>显示层级限制</span>
        <input
          id="layerMax"
          type="range"
          min="1"
          max="11"
          step="1"
          class="rangeBar"
          v-model="layerMax"
        />
        <span id="layerMaxShow">{{layerMaxForShow}}</span>
      </div>
    </div>
  </div>
  `,
};

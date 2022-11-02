import lsNotebooks from "./lsNotebooks.js";
import { SiyuanConnect } from "./SiyuanConnect.js";

export default {
  components: {
    lsNotebooks,
  },
  data() {
    return {
      port: "6806",
      nodeId: "",
      widgetsId: "",
      relation: {
        isParent: true,
        isChildren: true,
        isRef: true,
        isBackRef: true,
        parentBox: "",
        ignoreBlock: true,
      },
      blockShow: {
        isName: false,
        isTag: false,
        tagGroup: "",
        isRefInBox: true,
        refBox: "",
        isRefAfterDivide: true,
        refDivide: "`|`",
        isShowByPriority: true,
      },
      refMerge: {
        active: true,
        docIsNode: false,
        titleIsNode: false,
        otherIsNode: false,
        andSymbol: [",", "，", "和", "与", "、"],
        stopSymbol: "`$`",
        isolateSymbol:"`%`",
        nodeNotebook: "",
      },
    };
  },
  methods: {
    async getConfig() {
      const server = new SiyuanConnect(this.port);
      const data = await server.getBlockAttrs(this.widgetsId);
      let text = data.memo.replace(/&quot;/g, '"');
      const config = JSON.parse(text);
      this.port = config.port;
      this.nodeId = config.nodeId;
      this.relation = config.relation;
      this.blockShow = config.blockShow;
      this.refMerge = config.refMerge;
    },
    async saveConfig() {
      const server = new SiyuanConnect(this.port);
      await server.setBlockAttr(
        this.widgetsId,
        "memo",
        JSON.stringify({
          port: this.port,
          nodeId: this.nodeId,
          relation: this.relation,
          blockShow: this.blockShow,
          refMerge: this.refMerge,
        })
      );
      server.pushMsg("保存完成");
    },
  },
  emits: ["sendConfig"],
  updated() {
    this.$emit("sendConfig", {
      port: this.port,
      nodeId: this.nodeId,
      relation: this.relation,
      blockShow: this.blockShow,
      refMerge: this.refMerge,
    });
  },
  created() {
    this.$emit("sendConfig", {
      port: this.port,
      nodeId: this.nodeId,
      relation: this.relation,
      blockShow: this.blockShow,
      refMerge: this.refMerge,
    });
    try {
      this.widgetsId =
        window.frameElement.parentElement.parentElement.getAttribute(
          "data-node-id"
        );
    } catch {
      this.widgetsId = "20220919153157-1yxiize";
    }
  },
  mounted() {
    /*测试*/
    this.nodeId = "20220602220527-pape8r3";
    this.blockShow.refBox = "20220817160735-ciovjky";
    this.refMerge.nodeNotebook = "20211027200047-w9c6tuu";
    /*测试*/
  },
  template: /*html*/ `
  <div>
    <label for="nodeId">初始块ID，即绘图开始节点</label>
    <input autocomplete="off" id="nodeId" type="text" v-model="nodeId" />
  </div>
  <details>
    <summary role="button">配置选项</summary>
    <details open>
      <summary role="button" class="secondary">关系建立选项</summary>
      <div class="grid">
        <label for="isParent">
          <input
            type="checkbox"
            checked="checked"
            id="isParent"
            role="switch"
            v-model="relation.isParent"
          />
          是否显示父节点
        </label>
        <label for="isChildren">
          <input
            type="checkbox"
            checked="checked"
            id="isChildren"
            role="switch"
            v-model="relation.isChildren"
          />
          是否显示子节点
        </label>
        <p>如需要父子节点仅限特定笔记本，请选择→</p>
        <ls-notebooks
          :idAndfor="'relation_parentBox'"
          @response="(e) => this.relation.parentBox = e"
        ></ls-notebooks>
      </div>
      <div class="grid">
        <label for="isRef">
          <input
            type="checkbox"
            checked="checked"
            id="isRef"
            role="switch"
            v-model="relation.isRef"
          />
          是否显示引用
        </label>
        <label for="isBackRef">
          <input
            type="checkbox"
            checked="checked"
            id="isBackRef"
            role="switch"
            v-model="relation.isBackRef"
          />
          是否显示反向引用
        </label>
        <div></div>
        <div></div>
      </div>
    </details>
    <details open>
      <summary role="button" class="secondary">
        block的名称展示方式选项
      </summary>
      <div class="grid">
        <label for="isName">
          <input
            type="checkbox"
            id="isName"
            role="switch"
            v-model="blockShow.isName"
          />
          块命名
        </label>
        <label for="isTag">
          <input
            type="checkbox"
            id="isTag"
            role="switch"
            v-model="blockShow.isTag"
          />
          标签
        </label>
        <p>如需仅限特定分组标签，请输入标签所在分组→</p>
        <label for="tagGroup">
          <input
            autocomplete="off"
            id="tagGroup"
            type="text"
            title="标签所在分组"
            v-model="blockShow.tagGroup"
          />
        </label>
      </div>
      <div class="grid">
        <label for="isRefInBox" style="margin-top: 40px">
          <input
            type="checkbox"
            id="isRefInBox"
            role="switch"
            v-model="blockShow.isRefInBox"
          />
          特定笔记本内引用
        </label>
        <ls-notebooks
          :idAndfor="'blockShow_refBox'"
          :label="'所在笔记本'"
          @response="(e) => this.blockShow.refBox = e"
        ></ls-notebooks>
        <label for="isRefAfterDivide" style="margin-top: 40px">
          <input
            type="checkbox"
            id="isRefAfterDivide"
            role="switch"
            v-model="blockShow.isRefAfterDivide"
          />
          特定分隔后引用
        </label>
        <label for="refDivide">
          分隔符号
          <input
            autocomplete="off"
            id="refDivide"
            type="text"
            v-model="blockShow.refDivide"
          />
        </label>
      </div>
      <div>
        <label for="isShowByPriority">
          开启项全部显示(不推荐)
          <input
            type="checkbox"
            id="isShowByPriority"
            role="switch"
            checked
            v-model="blockShow.isShowByPriority"
          />
          开启项按优先级显示，优先级顺序：块命名->文档块和标题块的内容->标签->特定符号后引用->特定笔记本引用
        </label>
      </div>
    </details>
    <details open>
      <summary role="button" class="secondary">引用增强模式</summary>
      <div class="grid">
        <label for="refMergeActive">
          <input
            type="checkbox"
            id="refMergeActive"
            role="switch"
            v-model="refMerge.active"
          />
          是否开启
        </label>
        <p>以下块类型视为实体：</p>
        <label for="docIsNode">
          <input
            type="checkbox"
            id="docIsNode"
            v-model="refMerge.docIsNode"
          />
          文档块
        </label>
        <label for="titleIsNode">
          <input
            type="checkbox"
            id="titleIsNode"
            v-model="refMerge.titleIsNode"
          />
          标题块
        </label>
        <label for="otherIsNode">
          <input
            type="checkbox"
            id="otherIsNode"
            v-model="refMerge.otherIsNode"
          />
          其他块
        </label>
      </div>
      <div class="grid">
        <ls-notebooks
          :idAndfor="'refMerge_nodeNotebook'"
          :label="'实体所在文件夹（留空则为全部）'"
          @response="(e) => this.refMerge.nodeNotebook = e"
        ></ls-notebooks>
        <label for="stopSymbol">
          暂停组配符
          <input
            autocomplete="off"
            id="stopSymbol"
            type="text"
            v-model="refMerge.stopSymbol"
          />
        </label>
        <label for="andSymbol">
          停止组配符（表示并列关系）
          <input
            autocomplete="off"
            id="andSymbol"
            type="text"
            v-model="refMerge.andSymbol"
            readonly
          />
        </label>
        <label for="andSymbol">
          孤立组配符（不参与组配）
          <input
            autocomplete="off"
            id="isolateSymbol"
            type="text"
            v-model="refMerge.isolateSymbol"
            readonly
          />
        </label>
      </div>
    </details>
    <details open>
      <summary role="button" class="secondary">其它</summary>
      <div class="grid">
        <label for="port">
          端口号(默认6806，若不正确则无法保存和获取配置)
          <input autocomplete="off" id="port" type="text" v-model="port" />
        </label>
        <div></div>
        <div></div>
      </div>
    </details>
    <div style="margin-top: 20px">
      <label for="widgetsId">挂件块Id</label>
      <input autocomplete="off" id="widgetsId" type="text" v-model="widgetsId" readonly/>
      <a
        href="javascript:void(0);"
        @click="getConfig()"
        role="button"
        class="secondary"
        >还原上次配置</a
      >
      <a href="javascript:void(0);" @click="saveConfig()" role="button"
        >保存配置</a
      >
    </div>
  </details>
  `,
};

import { SiyuanConnect } from "./SiyuanConnect.js";
/**选择文件夹组件 */
export default {
  props: ["label", "idAndfor"],
  emits: ["response"],
  created() {
    this.$emit("response", this.selectValue);
  },
  data() {
    return { openBooks: [], selectValue: "" };
  },
  methods: {
    async getOption() {
      const siyuanService = new SiyuanConnect();
      const notebooks = await siyuanService.lsNotebooks();
      this.openBooks = [];
      if (notebooks.length > 0) {
        this.openBooks = notebooks.filter((notebook) => {
          return !notebook.closed;
        });
      }
      this.openBooks.unshift({
        id: "",
        name: "（空）",
      });
    },
    sendSelected() {
      this.$emit("response", this.selectValue);
    },
  },
  template: /*html*/ `
    <label :for="idAndfor">
      {{label}}
      <select :id="idAndfor" @click="getOption" v-model="selectValue" @change="sendSelected">
        <option v-for="notebook in openBooks" :value="notebook.id">{{notebook.name}}</option>
      </select>
    </label>
    `,
};

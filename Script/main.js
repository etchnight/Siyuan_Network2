"use strict";
import { createApp } from "vue";
import appConfig from "./appConfig.js";
import echartsGraph from "./echartsGraph.js";
/*主流程，设置与图表通信 */

const app = createApp({
  components: {
    appConfig,
    echartsGraph,
  },
  data() {
    return { config: ""};
  },
  methods: {
    
  }
});

document.addEventListener("DOMContentLoaded", () => {
  app.mount("#app");
});

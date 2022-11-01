"use strict";
//此文件存放与Siyuan通信相关的代码
/*
发送值:
{
	"address":子端点, 
	"params":{}参数,是一个json
}
返回值
{
  "code": 0,
  "msg": "",
  "data": {}
}
*/
export class SiyuanConnect {
  constructor(port) {
    this.port = port || "6806";
    this.SiyuanRootAddress = "http://127.0.0.1:" + this.port;
  }
  //const SiyuanRootAddress = "http://127.0.0.1:" + config.port;
  invoke(address, data, isForm) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", this.SiyuanRootAddress + address);
      var dataForSend;
      if (!isForm) {
        xhr.setRequestHeader("Content-type", "application/json");
        dataForSend = JSON.stringify(data);
      } else {
        //xhr.setRequestHeader('Content-Type', 'multipart/form-data');
        dataForSend = data;
        /*let urlEncodedDataPairs = [];
				for (const key in data) {
					urlEncodedDataPairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
				}
				//var dataForSend = urlEncodedDataPairs.join('&').replace(/%20/g, '+');*/
      }
      if (!data) {
        xhr.send();
      } else {
        xhr.send(dataForSend);
      }
      xhr.addEventListener("load", () => {
        try {
          const response = xhr.responseText;
          //错误处理
          let result;
          if (response) {
            result = JSON.parse(response);
          } else {
            result = "";
          }
          if (!result.code) {
            //个别api不返回code和msg，如获取文件
            resolve(response);
          }
          if (result.code != 0) {
            reject(result.msg);
          }
          resolve(response);
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  //列出笔记本
  lsNotebooks = async function () {
    const response = await this.invoke("/api/notebook/lsNotebooks");
    let data = JSON.parse(response);
    data = data.data;
    return data.notebooks;
  };

  //上传资源文件
  asset_upload = async function (files) {
    var formData = new FormData();
    formData.append("assetsDirPath", "/assets/");
    for (const file of files) {
      formData.append("file[]", file);
    }
    const response = await this.invoke("/api/asset/upload", formData, true);
    let data = JSON.parse(response);
    data = data.data;
    return data;
  };
  //上传文件
  putFile = async function (obj, path) {
    const file = new File([JSON.stringify(obj, null, 2)], obj.ID + ".sy", {
      type: "application/json",
    });
    var formData = new FormData();
    formData.append("path", path);
    formData.append("file", file);
    formData.append("isDir", false);
    formData.append("modTime", file.lastModified);
    const response = await this.invoke("/api/file/putFile", formData, true);
    let data = JSON.parse(response);
    data = data.data;
    return data;
  };

  //获取文件
  getFile = async function (path) {
    const response = await this.invoke("/api/file/getFile", {
      path: path,
    });
    if (!response) {
      return null;
    }
    let data = JSON.parse(response);
    return data;
  };

  //通过 Markdown 创建文档
  createDocWithMd = async function (notebook, path, markdown) {
    const response = await this.invoke("/api/filetree/createDocWithMd", {
      notebook: notebook,
      path: path,
      markdown: markdown,
    });
    let data = JSON.parse(response);
    data = data.data;
    return data;
  };

  //插入块
  insertBlock = async function (markdownDom, dataType, previousID) {
    const response = await this.invoke("/api/block/insertBlock", {
      data: markdownDom,
      dataType: dataType,
      previousID: previousID,
    });
    let data = JSON.parse(response);
    data = data.data;
    return data;
  };

  //插入后置子块
  appendBlock = async function (markdownDom, dataType, parentID) {
    const response = await this.invoke("/api/block/appendBlock", {
      data: markdownDom,
      dataType: dataType,
      parentID: parentID,
    });
    let data = JSON.parse(response);
    data = data.data;
    return data;
  };

  //更新块
  updateBlock = async function (markdownDom, dataType, id) {
    //更新块要重设块属性
    const ials = await this.getBlockAttrs(id);

    const response = await this.invoke("/api/block/updateBlock", {
      data: markdownDom,
      dataType: dataType,
      id: id,
    });
    let data = JSON.parse(response);
    data = data.data;

    for (const key of Object.keys(ials)) {
      switch (key) {
        case "id":
        case "updated":
          continue;
        default:
      }
      const value = ials[key];
      await this.setBlockAttr(id, key, value, false);
    }
    return data;
  };

  //获取块 kramdown 源码
  getBlockKramdown = async function (blockId) {
    const response = await this.invoke("/api/block/getBlockKramdown", {
      id: blockId,
    });
    let data = JSON.parse(response);
    data = data.data;
    return data;
  };

  //设置1个块属性
  setBlockAttr = async function (blockId, key, value, isCustom) {
    if (isCustom && !key.startsWith("custom-")) {
      key = "custom-" + key;
    }
    var requestData = {
      id: blockId,
      attrs: {},
    };
    requestData.attrs[key] = value; //必须这样设置,直接设置key:value的话键名就是"key"
    const response = await this.invoke("/api/attr/setBlockAttrs", requestData);
    let data = JSON.parse(response);
    data = data.data;
    return data;
  };

  //获取块属性
  getBlockAttrs = async function (blockId) {
    const response = await this.invoke("/api/attr/getBlockAttrs", {
      id: blockId,
    });
    let data = JSON.parse(response);
    data = data.data;
    return data;
  };

  //sql查询
  sql = async function (stmt) {
    const response = await this.invoke("/api/query/sql", {
      stmt: stmt,
    });
    let data = JSON.parse(response);
    data = data.data;
    return data;
  };

  //sql查询--根据ID查询
  sql_FindbyID = async function (id) {
    const response = await this.sql(
      "SELECT * FROM blocks WHERE id='" + id + "'"
    );
    if (!response[0]) {
      console.warn(`未找到id为的${id}块`);
    }
    return response[0];
  };

  //sql查询--根据父ID查询
  sql_FindbyParentID = async function (id) {
    const response = await this.sql(
      "SELECT * FROM blocks WHERE parent_id='" + id + "'"
    );
    return response;
  };
  //sql查询--查询父块
  sql_FindParentbyBlock = async function (block) {
    var response;
    if (block.parent_id) {
      response = await this.sql_FindbyID(block.parent_id);
      return response;
    }
    if (block.type == "d") {
      //文档查父级文档
      let pathList = block.path.split("/");
      for (let i = 0; i < pathList.length; i++) {
        if (pathList[i].indexOf(block.id) == 0 && i > 0 && pathList[i - 1]) {
          response = await this.sql_FindbyID(pathList[i - 1]);
          return response;
        }
      }
      //没有父级文档返回box
      //暂时不列
    }
    if (block.root_id) {
      response = await this.sql_FindbyID(block.root_id);
      return response;
    }
  };
  //sql查询--根据块ID查询其引用的块
  sql_FindDefbyID = async function (id) {
    const response = await this.sql(
      "SELECT * FROM blocks WHERE id IN" +
        "(SELECT def_block_id FROM refs WHERE block_id='" +
        id +
        "')"
    );
    return response;
  };
  //sql查询--根据块ID查询其引用(原始内容)
  sql_FindDefAnchorbyID = async function (id) {
    const response = await this.sql(
      `SELECT * FROM refs WHERE block_id='${id}'`
    );
    return response;
  };

  //sql查询--根据块ID查询反向引用
  sql_FindBackDefbyID = async function (id) {
    const response = await this.sql(
      "SELECT * FROM blocks WHERE id IN" +
        "(SELECT block_id FROM refs WHERE def_block_id='" +
        id +
        "')"
    );
    return response;
  };

  //sql查询--根据块ID查询其中的tag
  sql_FindTagbyID = async function (id) {
    const response = await this.sql(
      "SELECT * FROM spans WHERE block_id='" + id + "' AND type='tag'"
    );
    return response;
  };

  //sql查询--汇总tag的content
  sql_FindTagContentbyID = async function (id) {
    const response = await this.sql_FindTagbyID(id);
    var content = [];
    response.forEach((element) => {
      content.push(element.content);
    });
    return content;
  };

  //sql查询--根据关键词内容查询
  sql_FindSpansbyTag = async function (tag) {
    const response = await this.sql(
      "SELECT * FROM spans WHERE content='" + tag + "' AND type='tag'"
    );
    return response;
  };

  //sql查询--根据type查询span表
  sql_FindSpansByType = async function (type) {
    const response = await this.sql(
      "SELECT * FROM spans WHERE type='" + type + "'"
    );
    return response;
  };

  //sql查询--根据url查询锚文本
  sql_FindAnchorByUrl = async function (url) {
    const spans = await this.sql(
      "SELECT * FROM spans WHERE type='link_dest' AND " +
        "content='" +
        url +
        "'"
    );
    var result = [];
    for (const span of spans) {
      const response = await this.sql(
        "SELECT * FROM spans WHERE type='link_text' AND " +
          "markdown='" +
          span.markdown +
          "'"
      );
      for (const e of response) {
        result.push(e);
      }
    }
    return result;
  };

  //sql--根据自定义属性key,value查询block
  sql_FindBlocksByKeyValue = async function (key, value) {
    key = "custom-" + key;
    const response = await this.sql(
      "SELECT * FROM blocks WHERE ial LIKE '%" + key + '="' + value + "%'"
    );
    for (var block of response) {
      const ial = this.jsonparse2(block.ial);
      block.ial = ial;
    }
    return response;
  };

  //sql查询--根据自定义属性key查询block
  sql_FindBlocksByKey = async function (key) {
    key = "custom-" + key;
    const response = await this.sql(
      "SELECT * FROM blocks WHERE ial LIKE '%" + key + "=%'"
    );
    for (var block of response) {
      const ial = this.jsonparse2(block.ial);
      block.ial = ial;
    }
    return response;
  };

  //common.js处理不规范的字典(暂不支持数组)
  jsonparse2(str) {
    var strList = [];
    //根据引号拆分字符串
    var restStr = str;
    var quot = "";
    while (restStr != "") {
      let a = restStr.indexOf("'");
      let b = restStr.indexOf('"');
      if (a != -1 || b != -1) {
        if (quot == "") {
          if (b < a || a == -1) {
            temp_split(quot, b);
            quot = '"';
          } else {
            temp_split(quot, a);
            quot = "'";
          }
        } else {
          let index = restStr.indexOf(quot);
          temp_split(quot, index);
          quot = "";
        }
      } else {
        strList.push(restStr);
        restStr = "";
      }
    }
    //把开始和结尾的符号单独拎出来
    const punctuation = ["{", "}", "=", ":", ",", " ", "\n", ";"];
    var tempList = [];
    let flag = false;
    do {
      flag = false;
      for (let item of strList) {
        const startLetter = item.substr(0, 1);
        const endLetter = item.substr(-1, 1);
        let restStr = item;
        let subList = [];
        if (punctuation.indexOf(startLetter) != -1 && item.length > 1) {
          subList.push(item.slice(0, 1));
          restStr = item.substring(1);
          flag = true;
        }
        if (punctuation.indexOf(endLetter) != -1 && item.length > 1) {
          restStr = restStr.slice(0, -1);
          if (restStr != "") {
            subList.push(restStr);
          }
          subList.push(item.slice(-1));
          restStr = "";
          flag = true;
        }
        if (restStr != "") {
          subList.push(restStr);
        }
        tempList = tempList.concat(subList);
      }
      strList = tempList;
      tempList = [];
    } while (flag);
    //猜不规范的分隔
    for (let i = 0; i < strList.length; i++) {
      let item = strList[i];
      switch (item) {
        case "=":
          strList[i] = ":";
          break;
        case " ":
        case ";":
          strList[i] = ",";
          break;
      }
    }
    //排除不允许的字符
    tempList.push("{");
    for (let i = 1; i < strList.length; i++) {
      let item = strList[i];
      let lastItem = tempList[tempList.length - 1];
      if (
        lastItem == ":" &&
        item != "{" &&
        item != "[" &&
        punctuation.indexOf(item) != -1
      ) {
        continue;
      }
      if (
        lastItem == "}" &&
        item != "]" &&
        item != "}" &&
        punctuation.indexOf(item) != -1
      ) {
        continue;
      }
      if (lastItem == "," && punctuation.indexOf(item) != -1) {
        continue;
      }
      tempList.push(item);
    }
    strList = tempList;
    tempList = [];
    //加引号
    for (let i = 1; i < strList.length; i++) {
      let item = strList[i];
      if (
        punctuation.indexOf(item) == -1 &&
        !item.startsWith("'") &&
        !item.startsWith('"')
      ) {
        strList[i] = '"' + item + '"';
      }
    }
    const jsonStr = strList.join("");
    const json = JSON.parse(jsonStr);
    return json;
    function temp_split(quot, index) {
      if (quot != "") {
        strList.push('"' + restStr.substring(0, index) + '"');
      } else {
        strList.push(restStr.substring(0, index));
      }

      if (restStr.length > index) {
        restStr = restStr.substring(index + 1);
      } else {
        restStr = "";
      }
      return;
    }
  }

  //sql查询--根据块ID查询反向引用,反向引用所在块需包含指定标签
  sql_FindBackDefbyIDandTag = async function (id, tag) {
    const response = await this.sql(
      "SELECT * FROM blocks WHERE id IN" +
        "(SELECT block_id FROM refs WHERE block_id IN " +
        "		(SELECT block_id FROM spans WHERE type='tag' AND content='" +
        tag +
        "')" +
        "		AND def_block_id='" +
        id +
        "')"
    );
    return response;
  };
  //导出markdown文本
  exportMdContent = async function (id) {
    const response = await this.invoke("/api/export/exportMdContent", {
      id: id,
    });
    let data = JSON.parse(response);
    data = data.data;
    return data.notebooks;
  };
  //推送消息
  pushMsg = async function (msg, timeout) {
    const response = await this.invoke("/api/notification/pushMsg", {
      msg: msg,
      timeout: timeout || 7000,
    });
    let data = JSON.parse(response);
    data = data.data;
    return data.notebooks;
  };

  //根据顺序返回关键词（引用和标签)列表，可以追加关键词列表(字符串列表)
  /*返回字段包含:
  block的全部字段
  tag的type(tag)、content
  文本：markdown、type: "text"/long/textIndex
  markdown格式：不含格式的markdown，type: "markdown"
  */
  keywordListInOrder = async function (block, otherList) {
    const id = block.id;
    const file = await this.getFile("/data/" + block.box + block.path);
    const dom = this.mapFile(file, id);
    //const tagList = await this.sql_FindTagbyID(id);
    //let refList = await this.sql_FindDefAnchorbyID(id);
    let resultList = [];
    //不对文档块做任何处理,直接按文字节点返回
    if (dom.Type == "NodeDocument") {
      let title = dom.Properties.title;
      resultList.push({
        markdown: title,
        type: "text",
        long: title.length,
        textIndex: 0,
      });
      return resultList;
    }
    for (const child of dom.Children) {
      if (child.TextMarkType == "block-ref") {
        const block = await this.sql_FindbyID(child.TextMarkBlockRefID);
        resultList.push(block);
        continue;
      }
      //另一种引用
      if (child.Type == "NodeBlockRef") {
        for (const e of child.Children) {
          if (e.Type == "NodeBlockRefID") {
            const block = await this.sql_FindbyID(e.Data);
            resultList.push(block);
          }
        }
        continue;
      }
      if (child.TextMarkType == "tag") {
        resultList.push({
          content: child.TextMarkTextContent,
          type: "tag",
        });
        continue;
      }
      //处理其他类型(处理文字节点，查找分割符号)
      let text = "";
      if (child.Type == "NodeText") {
        text = child.Data;
      } else {
        text = child.TextMarkTextContent;
      }
      for (const divide of otherList) {
        let textIndex = text.indexOf(divide);
        if (textIndex != -1 && child.Type == "NodeText") {
          resultList.push({
            markdown: divide,
            type: "text",
            long: text.length,
            textIndex: textIndex,
          });
          break;
        }
        //其他类型的反过来查找
        if (divide[0] == divide[divide.length - 1]) {
          //markdown格式的分隔符一定第一和最后一个字符是一样的
          textIndex = divide.indexOf(text);
          if (textIndex != -1 && child.Type != "NodeText") {
            resultList.push({
              markdown: divide,
              type: "markdown",
            });
            break;
          }
        }
      }
    }
    return resultList;
  };
  mapFile = function (dom, id) {
    let result;
    if (dom.ID == id) {
      return dom;
    }
    if (dom.Children) {
      for (const child of dom.Children) {
        result = this.mapFile(child, id);
        if (result) {
          break; //如果有返回值则终止
        }
      }
    }
    return result; //层层返回
  };
  //模拟生成blockId
  blockId = function () {
    const temp_url = URL.createObjectURL(new Blob());
    let filename = temp_url.toString();
    URL.revokeObjectURL(temp_url); //释放对象
    filename = filename.replace(/.*?\//, "");
    filename = filename.replace(/-/g, "");
    filename = filename.slice(-8, -1);
    //生成类似于时间戳的序号
    var t = new Date();
    var tiemStr =
      t.getFullYear() +
      addZero(t.getMonth()) +
      addZero(t.getDay()) +
      addZero(t.getHours()) +
      addZero(t.getMinutes())+
      addZero(t.getSeconds());
    return tiemStr+'-'+filename;
    function addZero(num) {
      if (num < 10) {
        return num;
      } else {
        return "0" + num;
      }
    }
  };
}
if (typeof module === "object") {
  module.exports = SiyuanConnect;
}

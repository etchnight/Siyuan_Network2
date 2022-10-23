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
      "SELECT * FROM spans WHERE block_id='" + id + "' AND type='textmark tag'"
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
  //备份，利用文件进行
  keywordListInOrder_backup = async function (block, otherList) {
    const id = block.id;
    const file = await this.getFile("/data/" + block.box + block.path);
    if (!file) {
      return [];
    }
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
            if (block) {
              resultList.push(block);
            } else {
              //处理未找到节点
              resultList.push(this.unfindBlock(e.Data));
            }
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
  keywordListInOrder = async function (block, otherList) {
    const id = block.id;
    const markdown = this.reUnseeChr(block.markdown);
    if (!markdown) {
      return [];
    }
    const tagList = await this.sql_FindTagbyID(id);
    const refList = await this.sql_FindDefAnchorbyID(id);
    const findList = refList.concat(tagList).concat(otherList);
    let resultList = [];
    //不对文档块做任何处理,直接按文字节点返回
    if (block.type == "d") {
      let title = block.content;
      return [
        {
          markdown: title,
          keywordType: "text",
          long: title.length,
          textIndex: 0,
        },
      ];
    }
    let restMarkdown = markdown;
    let startIndex = 0;
    let lastLong = 0;
    while (restMarkdown.length > 0) {
      startIndex += lastLong;
      let lastIndex = restMarkdown.length;
      let findResult;

      for (const child of findList) {
        const index = restMarkdown.indexOf(
          this.reUnseeChr(child.markdown) || child
        );
        if (index >= 0 && index < lastIndex) {
          findResult = child;
          lastIndex = index;
        }
      }
      if (!findResult) {
        break;
      }
      let findResultMarkdown;
      if (findResult.markdown) {
        findResultMarkdown = this.reUnseeChr(findResult.markdown);
      } else {
        findResultMarkdown = findResult;
      }
      lastLong = findResultMarkdown.length;
      restMarkdown = restMarkdown.slice(lastLong + lastIndex);
      startIndex += lastIndex;
      //文字节点
      if (!findResult.id) {
        resultList.push({
          markdown: findResult,
          keywordType: "text",
          long: lastLong,
          textIndex: startIndex,
        });
        continue;
      }
      //引用(好像文档的type是空)
      if (findResult.type == "textmark" || findResult.type == "") {
        let block = await this.sql_FindbyID(findResult.def_block_id);
        if (block) {
          block.keywordType = "block";
          block.textIndex = startIndex;
          block.long = lastLong;
          resultList.push(block);
        } else {
          //处理未找到节点
          resultList.push(this.unfindBlock(findResult.def_block_id));
        }
        continue;
      }
      //标签
      if (findResult.type == "textmark tag") {
        resultList.push({
          content: findResult.content,
          long: lastLong,
          textIndex: startIndex,
          keywordType: "tag",
        });
        continue;
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
      addZero(t.getMinutes()) +
      addZero(t.getSeconds());
    return tiemStr + "-" + filename;
    function addZero(num) {
      if (num < 10) {
        return num;
      } else {
        return "0" + num;
      }
    }
  };
  //未找到的节点
  unfindBlock = function (blockId) {
    return {
      alias: "",
      box: "未找到的节点",
      content: "未找到的节点",
      created: "",
      fcontent: "",
      hash: "",
      hpath: "",
      ial: "",
      id: blockId,
      length: 1,
      markdown: "未找到的节点",
      memo: "",
      name: "",
      parent_id: "",
      path: blockId + ".sy",
      root_id: "",
      sort: 0,
      subtype: "",
      tag: "",
      type: "p", //默认为段落
      updated: "",
    };
  };
  //去除不可见字符
  reUnseeChr(str) {
    if (!str) {
      return null;
    }
    var reg =
      /[\0-\x1F\x7F-\x9F\xAD\u0378\u0379\u037F-\u0383\u038B\u038D\u03A2\u0528-\u0530\u0557\u0558\u0560\u0588\u058B-\u058E\u0590\u05C8-\u05CF\u05EB-\u05EF\u05F5-\u0605\u061C\u061D\u06DD\u070E\u070F\u074B\u074C\u07B2-\u07BF\u07FB-\u07FF\u082E\u082F\u083F\u085C\u085D\u085F-\u089F\u08A1\u08AD-\u08E3\u08FF\u0978\u0980\u0984\u098D\u098E\u0991\u0992\u09A9\u09B1\u09B3-\u09B5\u09BA\u09BB\u09C5\u09C6\u09C9\u09CA\u09CF-\u09D6\u09D8-\u09DB\u09DE\u09E4\u09E5\u09FC-\u0A00\u0A04\u0A0B-\u0A0E\u0A11\u0A12\u0A29\u0A31\u0A34\u0A37\u0A3A\u0A3B\u0A3D\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A58\u0A5D\u0A5F-\u0A65\u0A76-\u0A80\u0A84\u0A8E\u0A92\u0AA9\u0AB1\u0AB4\u0ABA\u0ABB\u0AC6\u0ACA\u0ACE\u0ACF\u0AD1-\u0ADF\u0AE4\u0AE5\u0AF2-\u0B00\u0B04\u0B0D\u0B0E\u0B11\u0B12\u0B29\u0B31\u0B34\u0B3A\u0B3B\u0B45\u0B46\u0B49\u0B4A\u0B4E-\u0B55\u0B58-\u0B5B\u0B5E\u0B64\u0B65\u0B78-\u0B81\u0B84\u0B8B-\u0B8D\u0B91\u0B96-\u0B98\u0B9B\u0B9D\u0BA0-\u0BA2\u0BA5-\u0BA7\u0BAB-\u0BAD\u0BBA-\u0BBD\u0BC3-\u0BC5\u0BC9\u0BCE\u0BCF\u0BD1-\u0BD6\u0BD8-\u0BE5\u0BFB-\u0C00\u0C04\u0C0D\u0C11\u0C29\u0C34\u0C3A-\u0C3C\u0C45\u0C49\u0C4E-\u0C54\u0C57\u0C5A-\u0C5F\u0C64\u0C65\u0C70-\u0C77\u0C80\u0C81\u0C84\u0C8D\u0C91\u0CA9\u0CB4\u0CBA\u0CBB\u0CC5\u0CC9\u0CCE-\u0CD4\u0CD7-\u0CDD\u0CDF\u0CE4\u0CE5\u0CF0\u0CF3-\u0D01\u0D04\u0D0D\u0D11\u0D3B\u0D3C\u0D45\u0D49\u0D4F-\u0D56\u0D58-\u0D5F\u0D64\u0D65\u0D76-\u0D78\u0D80\u0D81\u0D84\u0D97-\u0D99\u0DB2\u0DBC\u0DBE\u0DBF\u0DC7-\u0DC9\u0DCB-\u0DCE\u0DD5\u0DD7\u0DE0-\u0DF1\u0DF5-\u0E00\u0E3B-\u0E3E\u0E5C-\u0E80\u0E83\u0E85\u0E86\u0E89\u0E8B\u0E8C\u0E8E-\u0E93\u0E98\u0EA0\u0EA4\u0EA6\u0EA8\u0EA9\u0EAC\u0EBA\u0EBE\u0EBF\u0EC5\u0EC7\u0ECE\u0ECF\u0EDA\u0EDB\u0EE0-\u0EFF\u0F48\u0F6D-\u0F70\u0F98\u0FBD\u0FCD\u0FDB-\u0FFF\u10C6\u10C8-\u10CC\u10CE\u10CF\u1249\u124E\u124F\u1257\u1259\u125E\u125F\u1289\u128E\u128F\u12B1\u12B6\u12B7\u12BF\u12C1\u12C6\u12C7\u12D7\u1311\u1316\u1317\u135B\u135C\u137D-\u137F\u139A-\u139F\u13F5-\u13FF\u169D-\u169F\u16F1-\u16FF\u170D\u1715-\u171F\u1737-\u173F\u1754-\u175F\u176D\u1771\u1774-\u177F\u17DE\u17DF\u17EA-\u17EF\u17FA-\u17FF\u180F\u181A-\u181F\u1878-\u187F\u18AB-\u18AF\u18F6-\u18FF\u191D-\u191F\u192C-\u192F\u193C-\u193F\u1941-\u1943\u196E\u196F\u1975-\u197F\u19AC-\u19AF\u19CA-\u19CF\u19DB-\u19DD\u1A1C\u1A1D\u1A5F\u1A7D\u1A7E\u1A8A-\u1A8F\u1A9A-\u1A9F\u1AAE-\u1AFF\u1B4C-\u1B4F\u1B7D-\u1B7F\u1BF4-\u1BFB\u1C38-\u1C3A\u1C4A-\u1C4C\u1C80-\u1CBF\u1CC8-\u1CCF\u1CF7-\u1CFF\u1DE7-\u1DFB\u1F16\u1F17\u1F1E\u1F1F\u1F46\u1F47\u1F4E\u1F4F\u1F58\u1F5A\u1F5C\u1F5E\u1F7E\u1F7F\u1FB5\u1FC5\u1FD4\u1FD5\u1FDC\u1FF0\u1FF1\u1FF5\u1FFF\u200B-\u200F\u202A-\u202E\u2060-\u206F\u2072\u2073\u208F\u209D-\u209F\u20BB-\u20CF\u20F1-\u20FF\u218A-\u218F\u23F4-\u23FF\u2427-\u243F\u244B-\u245F\u2700\u2B4D-\u2B4F\u2B5A-\u2BFF\u2C2F\u2C5F\u2CF4-\u2CF8\u2D26\u2D28-\u2D2C\u2D2E\u2D2F\u2D68-\u2D6E\u2D71-\u2D7E\u2D97-\u2D9F\u2DA7\u2DAF\u2DB7\u2DBF\u2DC7\u2DCF\u2DD7\u2DDF\u2E3C-\u2E7F\u2E9A\u2EF4-\u2EFF\u2FD6-\u2FEF\u2FFC-\u2FFF\u3040\u3097\u3098\u3100-\u3104\u312E-\u3130\u318F\u31BB-\u31BF\u31E4-\u31EF\u321F\u32FF\u4DB6-\u4DBF\u9FCD-\u9FFF\uA48D-\uA48F\uA4C7-\uA4CF\uA62C-\uA63F\uA698-\uA69E\uA6F8-\uA6FF\uA78F\uA794-\uA79F\uA7AB-\uA7F7\uA82C-\uA82F\uA83A-\uA83F\uA878-\uA87F\uA8C5-\uA8CD\uA8DA-\uA8DF\uA8FC-\uA8FF\uA954-\uA95E\uA97D-\uA97F\uA9CE\uA9DA-\uA9DD\uA9E0-\uA9FF\uAA37-\uAA3F\uAA4E\uAA4F\uAA5A\uAA5B\uAA7C-\uAA7F\uAAC3-\uAADA\uAAF7-\uAB00\uAB07\uAB08\uAB0F\uAB10\uAB17-\uAB1F\uAB27\uAB2F-\uABBF\uABEE\uABEF\uABFA-\uABFF\uD7A4-\uD7AF\uD7C7-\uD7CA\uD7FC-\uF8FF\uFA6E\uFA6F\uFADA-\uFAFF\uFB07-\uFB12\uFB18-\uFB1C\uFB37\uFB3D\uFB3F\uFB42\uFB45\uFBC2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDEF\uFDFE\uFDFF\uFE1A-\uFE1F\uFE27-\uFE2F\uFE53\uFE67\uFE6C-\uFE6F\uFE75\uFEFD-\uFF00\uFFBF-\uFFC1\uFFC8\uFFC9\uFFD0\uFFD1\uFFD8\uFFD9\uFFDD-\uFFDF\uFFE7\uFFEF-\uFFFB\uFFFE\uFFFF]/g;
    str = str.replace(reg, "");
    return str;
  }
}
if (typeof module === "object") {
  module.exports = SiyuanConnect;
}

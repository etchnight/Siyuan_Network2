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
const SiyuanRootAddress = "http://127.0.0.1:6806";
function Siyuan_invoke(address, data) {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open('POST', SiyuanRootAddress + address);
		xhr.setRequestHeader("Content-type", "application/json");
		if (data == "" || data == undefined) {
			xhr.send();
		} else {
			xhr.send(JSON.stringify(data));
		}
		xhr.addEventListener('load', () => {
			try {
				const response = xhr.responseText;
				//错误处理
				const result = JSON.parse(response);
				if (result.code > 0) {
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
async function Siyuan_lsNotebooks() {
	const response = await Siyuan_invoke('/api/notebook/lsNotebooks');
	let data = JSON.parse(response);
	data = data.data;
	return data.notebooks;
}

//sql查询
async function Siyuan_sql(stmt) {
	const response = await Siyuan_invoke('/api/query/sql', {
		"stmt": stmt
	});
	let data = JSON.parse(response);
	data = data.data;
	return data;
}

//sql查询--根据ID查询
async function Siyuan_sql_FindbyID(id) {
	const response = await Siyuan_sql("SELECT * FROM blocks WHERE id='" + id + "'");
	return response[0];
}

//sql查询--根据父ID查询
async function Siyuan_sql_FindbyParentID(id) {
	const response = await Siyuan_sql("SELECT * FROM blocks WHERE parent_id='" + id + "'");
	return response;
}

//sql查询--根据块ID查询其引用的块
async function Siyuan_sql_FindDefbyID(id) {
	const response = await Siyuan_sql("SELECT * FROM blocks WHERE id IN"
		+ "(SELECT def_block_id FROM refs WHERE block_id='" + id + "')");
	return response;
}

//sql查询--根据块ID查询反向引用
async function Siyuan_sql_FindBackDefbyID(id) {
	const response = await Siyuan_sql("SELECT * FROM blocks WHERE id IN"
		+ "(SELECT block_id FROM refs WHERE def_block_id='" + id + "')");
	return response;
}

//sql查询--根据块ID查询其中的tag
async function Siyuan_sql_FindTagbyID(id) {
	const response = await Siyuan_sql(
		 "SELECT * FROM spans WHERE block_id='" + id + "' AND type='tag'");
	return response;
}

//sql查询--汇总tag的content
async function Siyuan_sql_FindTagContentbyID(id) {
	const response = await Siyuan_sql_FindTagbyID(id);
	var content=[];
	response.forEach(element => {
		content.push(element.content)
	});
	return content;
}


//sql查询--根据关键词内容查询块ID
async function Siyuan_sql_FindbyTag(tag) {
	const response = await Siyuan_sql("SELECT * FROM spans WHERE content='" + tag + "' AND type='tag'");
	return response;
}

//sql查询--根据块ID查询反向引用,反向引用所在块需包含指定标签
async function Siyuan_sql_FindBackDefbyIDandTag(id, tag) {
	const response = await Siyuan_sql("SELECT * FROM blocks WHERE id IN"
		+ "(SELECT block_id FROM refs WHERE block_id IN "
		+ "		(SELECT block_id FROM spans WHERE type='tag' AND content='" + tag + "')"
		+ "		AND def_block_id='" + id + "')"
	);
	return response;
}


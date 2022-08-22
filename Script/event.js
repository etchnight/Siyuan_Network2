"use strict";
/*界面交互相关，仅限与主界面交互，图表相关交互在graph.js文件*/ 

//列出笔记本
document.addEventListener('DOMContentLoaded', () => {
    const notebooksElement = document.getElementById('notebooks')
    notebooksElement.addEventListener('change', () => {
        notebooksElement.setAttribute("data-id", notebooksElement.value)
    })
    getNotebooks(notebooksElement)
})
document.addEventListener('DOMContentLoaded', () => {
    const notebooksElement = document.getElementById('relaNotebooks')
    notebooksElement.addEventListener('change', () => {
        notebooksElement.setAttribute("data-id", notebooksElement.value)
    })
    getNotebooks(notebooksElement)
})
async function getNotebooks(notebooksElement) {
    const notebooks = await Siyuan_lsNotebooks();
    if (notebooks.length > 0) {
        let optionsHTML = ''
        notebooks.forEach(notebook => {
            if (notebook.closed) {
                return
            }
            optionsHTML += `<option value="${notebook.id}">${notebook.name}</option>`
        })
        notebooksElement.innerHTML = optionsHTML
        notebooksElement.value = notebooksElement.getAttribute("data-id")
    }
}
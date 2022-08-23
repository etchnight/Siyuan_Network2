function test() {
    /** @type EChartsOption */
    nodes=[{
        name:"n1"
    },{
        name:"n2"
    },{
        name:"n3"
    }];
    edges=[{
        source: "n1",
        target: "n2"
    },{
        source: "n1",
        target: "n3"
    }]
    return [nodes,edges]
}

//设置测试值
document.addEventListener('DOMContentLoaded', ()=>{
    document.getElementById("nodeId").value="20220602220527-pape8r3";
    main()
    //config()
})

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
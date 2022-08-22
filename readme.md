## block的名称展示方式选项
- [x] 默认：从不显示block内容，但文档块和标题块总是显示
  - [ ] 悬浮在节点上显示块详情
  - [ ] 可通过与节点交互直接跳转到相应块
- [ ] 显示块命名（属性中命名字段）
- [ ] 显示标签
    - [ ] 显示所有标签
    - [ ] 只显示特定分组标签
- [ ] 显示特定引用，该模式下不会将该引用作为节点处理，分辨方式：
    - [ ] 特定笔记本内引用（block）
    - [ ] 特定符号后紧跟的引用（限1个）
## 关系建立选项
- [ ] 父节点
- [ ] 子节点
  - [ ] 父子节点仅限特定笔记本
- [ ] 引用
- [ ] 反向引用
## 引用合并模式

该模式会对引用进行组配，自动合成新节点、关系

请确保block中只有一对一或一对多关系,且关系在主体内容中（而不是单独列在行首或行尾），正确的例子：

- [ ] `A`的#导演#是`B`
其中#导演#是一个标签，`A`表示引用，该块会渲染为"A--导演-->B"形式

- [ ] `A`的`导演`是`B`
其中`导演`是特定笔记本内引用，该块会渲染为"A--导演-->B"形式

- [ ] `A`的%%`导演`是`B`
其中%%表示特定的分隔符号，可以自由选择，该块会渲染为"A--导演-->B"形式

- [ ] `A`的%%导演是`B`（A的导演）
其中%%表示特定的分隔符号，可以自由选择,括号内内容为该块的命名，该块会渲染为"A--导演-->B"形式

- [ ] `A`的#定义#是。。。
其中#定义#是一个关系标签，由于关系元素后没有其他引用，该块会渲染为"A-->定义"形式

- [ ] `A` #分为# `B`，`C`，`D`
该示例为一对多关系，`B` `C` `D`之间如果含有逗号、“和”等分隔符号，会判定为独立关系，关于分隔符号的选定，见config.js文件中的AndSymbol字段，该示例会被渲染为：
```
A-->分为-->B
     ↓  ↘
     C    D
```   
- [ ] 围绕着`法`的`概念`的争论的%%`中心问题`是`另一个实体`
该示例为一对一关系，实体引用之间不含逗号、“和”等分隔符号，会判定为组配关系，该示例会被渲染为：
```
法      概念
  ↘  ↙
  法/概念--中心问题-->另一个实体
```

- [ ] `钢筋混凝土` `支撑构件` 的&&`混凝土` `强度等级` %%`最低值`为C25；
该示例是一个一对一关系，实体引用之间不含逗号、“和”等分隔符号，会判定为组配关系，但是加入了另一种分隔符号&&，表示&&之前的进行组配，&&到关系关键词之间的进行组配，该示例会被渲染为：
```
钢筋混凝土     支撑构件   混凝土      强度等级
         ↘  ↙               ↘   ↙
    钢筋混凝土/支撑构件      混凝土/强度等级
                    ↘     ↙
         钢筋混凝土/支撑构件/混凝土/强度等级-->最低值
```
## block挂在节点OR边上
### block挂在节点上的情况
- 实体通过一个block与多个实体有关系，即block中有2个以上引用
- block中只有一个实体（引用）
- 不需要特殊处理
### block挂在边上的情况
- 实体仅与一个实体有关系，即block中有2个引用
- [ ] 需要单独转化，边id存储在自定义属性中
## 其他功能
- [ ] 保存配置
- [ ] 关系图显示层级限制
- [ ] 父子关系树状图显示
- [ ] 基于文档以及笔记本的布局图，将同一文档/笔记本中块集中在某一区域显示

## 依赖
echarts
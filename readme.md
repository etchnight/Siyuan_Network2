### 该项目决定不再维护

一个增强[Siyuan笔记](https://github.com/siyuan-note/siyuan)关系网络图的挂件，目标是使关系网络图真正成为复习工具，主要思路是通过文献管理中主题词法、关键词法等方式组织笔记，通过组配方式管理双向链接，正在努力完善中

## 使用方法
1. 按照本文档说明或一般方式书写双链笔记
2. 在[Siyuan笔记](https://b3log.org/siyuan/)中任意一页插入该挂件
3. 输入开始节点ID
4. 进行自定义配置
5. 点击`绘制`
6. 通过图表交互浏览您的笔记
### 效果
笔记：

![输入](https://github.com/etchnight/Siyuan_Network2/raw/master/doc/example1_input.png)

关系图：

![输出](https://github.com/etchnight/Siyuan_Network2/raw/master/doc/example1_output.png)

## 功能详情
### 图表交互
- [x] 悬浮在节点上显示块详情
- [x] 右键菜单
  - [x] 定位到块
  - [x] 收起节点
  - [x] 展开节点
- [x] 关系图显示层级限制
~~- [ ] 基于文档以及笔记本的布局图，将同一文档/笔记本中块集中在某一区域显示，并有颜色覆盖~~
- [x] 根据块类型显示为不同颜色
- [ ] 调整力引导图参数（自动），同一文档/笔记本块会减小距离等
- [ ] 调整力引导图参数（手动），主要是节点之间距离
- [x] ~~实现缩放,平移~~平移、缩放（ECharts原生支持）
- [x] ~~实现拖拽~~拖拽（ECharts原生支持）
- [x] 显示关系类型（父子，引用）
### block的名称展示方式选项
- [x] 默认：从不显示block内容，但文档块和标题块总是显示
- [x] 显示块命名（属性中命名字段）
- [x] 显示标签
    - [x] 显示所有标签
    - [x] 只显示特定分组标签
- [x] 显示特定引用，该模式下不会将该引用作为节点处理，分辨方式：
    - [x] 特定笔记本内引用（block）
    - [x] 特定符号后紧跟的1个引用
- [x] 默认，如果全部选择，全部显示
- [x] 可选，如果全部选择，优先级为块命名->文档块和标题块的内容->标签->特定符号后引用->特定笔记本引用
注意：引用不会关注锚文本是什么，只显示引用块的原始内容
### 关系建立选项
- [x] 父节点
- [x] 子节点
- [x] 父子节点仅限特定笔记本
- [ ] ~~-父子节点隐藏未命名块（标题、文档除外）~~用不同颜色表示未命名块
- [x] 引用
- [x] 反向引用
### 引用合并模式
[引用合并模式的思想](https://github.com/etchnight/Siyuan_Network2/blob/master/doc/引用增强模式的主要思想.md)

特点：
- [x] 该模式会对引用进行组配，自动合成新节点、关系
- [x] 块命名方式有所更改，会在上述基础上加上关系前的实体引用，具体见下方例子
- [x] 力引导图中组配合成节点会增大距离
- [x] 引入暂停组配符（表示符号后先组配，在与前面的继续组配）和停止组配符（表示并列关系）以应对复杂情况
- 不关注关系建立选项中引用是否开启（甚至两个模式是不兼容的）
- [ ] 时间类节点将会单独处理，变为时间轴
- [x] 父子节点忽略实体所在文件夹
请确保block中只有一对一或一对多关系,且关系在主体内容中（而不是单独列在行首或行尾），例子：
- 块命名方式示例
  - `A`的#导演#是`B`
  其中#导演#是一个标签，`A`表示引用，该块会渲染为"A-->A导演-->B"形式(普通模式下渲染为"A-->导演-->B")

  - `A`的`导演`是`B`
  其中`导演`是特定笔记本内引用，该块会渲染为"A-->A导演-->B"形式

  - `A`的%%`导演`是`B`
  其中%%表示特定的分隔符号，可以自由选择，该块会渲染为"A-->A导演-->B"形式

  - `A`的%%导演是`B`（A的导演）
  其中%%表示特定的分隔符号，可以自由选择,括号内内容为该块的命名，该块会渲染为"A-->A导演-->B"形式

  - `A`的#定义#是。。。
  其中#定义#是一个关系标签，由于关系元素后没有其他引用，该块会渲染为"A-->A定义"形式

- 引用合并示例
  - `A` #分为# `B`，`C`，`D`
  该示例为一对多关系，`B` `C` `D`之间如果含有逗号、“和”等分隔符号（停止组配符），会判定为独立关系，关于停止组配符的选定，暂时不能进行更改，该示例会被渲染为：
  ```
    A-->A分为-->B
        ↓  ↘
        C    D
  ```   
  - 围绕着`法`的`概念`的争论的%%`中心问题`是`另一个实体`
  该示例为一对一关系，实体引用之间不含逗号、“和”等分隔符号，会判定为组配关系，该示例会被渲染为：
  ```
      法      概念
        ↘  ↙
        法/概念--法/概念中心问题-->另一个实体
  ```

  - `钢筋混凝土` `支撑构件` 的&&`混凝土` `强度等级` %%`最低值`为C25；
  该示例是一个一对一关系，实体引用之间不含逗号、“和”等分隔符号，会判定为组配关系，&&是暂停组配符，表示&&之前的进行组配，&&到关系关键词之间的进行组配，该示例会被渲染为：
  ```
  钢筋混凝土     支撑构件   混凝土      强度等级
          ↘  ↙               ↘   ↙
      钢筋混凝土/支撑构件      混凝土/强度等级
                      ↘     ↙
          钢筋混凝土/支撑构件/混凝土/强度等级
                        ↓
          钢筋混凝土/支撑构件/混凝土/强度等级最低值
  ```
  - 上例中，如果将&&更换为`和`（停止组配符，表示并列关系），则不会出现`钢筋混凝土/支撑构件/混凝土/强度等级`节点，会被渲染为：
  ```
  钢筋混凝土     支撑构件   混凝土      强度等级
          ↘  ↙               ↘   ↙
      钢筋混凝土/支撑构件      混凝土/强度等级
                      ↘     ↙
          钢筋混凝土/支撑构件/混凝土/强度等级最低值
  ```
注意：
- 组配总是从前向后进行，所以请保证引用的顺序正确
- 为了尽量避免误判，引用必须紧跟在自定义符号之后，否则会被忽略

其他问题：
- [ ] 可选，仅对某个笔记本中的块作为实体进行处理，其他引用会被单独处理为"块-->其他引用"形式
- [ ] 可选，仅将文档视为实体
- [ ] 可选，仅将标题视为实体，与仅将文档视为实体可共存
- [x] 因为无分隔符号导致未找到关系时，会默认将最后一个实体作为关系处理
- [x] 孤立组配符，前有此标识的引用与引用增强模式无关
~~- [ ] 智能识别是一个很诱人的方式，但是实现起来不止需要停用词表、分词、词性标注等东西，优化的不好就毫无意义，所以在相当长的时间内，不会增加该特性~~
### 其他
- [x] 保存和加载配置
- [x] 内置主题词组配建议，详见[叙词语言的词汇控制](https://github.com/etchnight/Siyuan_Network2/blob/master/doc/叙词语言的词汇控制.md)
~~- [ ] 内置主题词表,近期不准备引入~~
## 依赖
- [Apache ECharts-一个基于 JavaScript 的开源可视化图表库](https://echarts.apache.org/zh/index.html)
- [Pico.css-Minimal CSS Framework for semantic HTML](https://github.com/picocss/pico)
- [Lodash-一个一致性、模块化、高性能的 JavaScript 实用工具库。](https://www.lodashjs.com/)

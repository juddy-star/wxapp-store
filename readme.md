# wxapp-store 微信小程序的 单一状态树

## features

- 类 vuex 的 store 结构
- 支持 state, getter, commit, dispatch 四种功能
- 配置文件支持 namespace，modules 功能
- 支持 state, getter, mutation, action 中通过 this.root 拿到根节点
- 支持 state, getter, mutation, action 中的参数，都为当前节点的信息
- modules 中若不设置 namespace 属性，原则上会覆盖父层的同名数据

## 构建

```js
npm start 构建lib
```

## demo

### path

src/demo/index

### 命令

```js
npm run demo
```

### 目录

```js
lib
└── core
    ├── action
    │   └── index.js
    ├── getter
    │   └── index.js
    ├── index.js
    ├── mutation
    │   └── index.js
    ├── state
    │   └── index.js
    └── utils
        └── index.js
```

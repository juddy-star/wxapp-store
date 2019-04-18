'use strict';

const isObject = function (obj = '') {
  return Object.prototype.toString.call(obj) === '[object Object]';
};

/**
 *state数据集合
 *
 * @export
 * @class State
 */
class State {
  /**
   *Creates an instance of State.
   * @param {*} { root = {}, options = {} }
   * @memberof State
   */
  constructor({ root = {}, options = {} }) {
    this.root = root;
    this.options = options;
    this.defineProperty();
  }
  /**
   *定义变量
   *
   * @memberof State
   */
  defineProperty() {
    this.illegalKey = 'nested';

    this.stateData = {
      nested: {}
    };

    this.interfaceData = {};
  }
  /**
   *对外暴露的统一接口
   *
   * @returns
   * @memberof State
   */
  run() {
    return this.interfaceData;
  }
  register(stateData = {}, spaceKey = '') {
    // 存储state
    this.saveStateData(stateData, spaceKey);
    // 更新state接口数据
    this.updateInterfaceData(stateData, spaceKey);
  }
  /**
   *存储state数据
   *
   * @param {*} [stateData={}]
   * @param {string} [spaceKey='']
   * @returns
   * @memberof State
   */
  saveStateData(stateData = {}, spaceKey = '') {
    if (!isObject(stateData)) throw new Error('state必须是对象');

    // 如果需要注册的state是空的，返回
    if (Object.keys(stateData).length === 0) return;
    // 如果根数据中有核心敏感字段，返回
    if (!spaceKey && Object.keys(stateData).some(key => key === this.illegalKey)) throw new Error('nested为敏感字段');

    // 初始化命名空间的数据域
    if (spaceKey) {
      const { [spaceKey]: spaceData = '' } = this.stateData.nested;
      // 确保spaceData是对象
      if (!isObject(spaceData)) {
        this.stateData.nested[spaceKey] = {}; 
      }
    }
    // 根据命名空间获得数据域
    const stateField = spaceKey ? this.stateData.nested[spaceKey] : this.stateData;
    // 存储state数据
    Object.keys(stateData).forEach((key) => {
      const data = stateData[key];
      
      stateField[key] = data;
    });
  }
  /**
   *更新state数据接口
   *
   * @param {*} [stateData={}]
   * @param {string} [spaceKey='']
   * @returns
   * @memberof State
   */
  updateInterfaceData(stateData = {}, spaceKey = '') {
    // 如果需要注册的state是空的，返回
    if (Object.keys(stateData).length === 0) return;
    
    // 如果命名空间spaceKey存在,并且没有被定义过
    if (spaceKey) {
      if (isObject(this.interfaceData[spaceKey])) return;

      Object.defineProperty(this.interfaceData, spaceKey, {
        get: () => {
          return this.stateData.nested[spaceKey];
        },
        set: (value) => {
          this.stateData.nested[spaceKey] = value;
        }
      });
      return;
    }
    // 如果命名空间spaceKey不存在（根数据）
    Object.keys(stateData).forEach((key) => {
      if (this.interfaceData[key]) return;

      Object.defineProperty(this.interfaceData, key, {
        get: () => {
          // 优先返回命名空间的值
          if (Object.keys(this.stateData.nested).some(nestedKey => nestedKey === key)) {
            return this.stateData.nested[key];
          }
          if (Object.keys(this.stateData).some(globalKey => globalKey === key)) {
            return this.stateData[key];
          }
          throw new Error(`没有找到${key}`);
        }
      });
    });
  }
  /**
   *获得当前的state
   *
   * @param {string} [key='']
   * @param {string} [spaceKey='']
   * @memberof State
   */
  getCurrentState(spaceKey = '') {
    return spaceKey ? this.stateData.nested[spaceKey] : this.stateData;
  }
}

/**
 *getter流
 *
 * @export
 * @class Getter
 */
class Getter {
  /**
   *Creates an instance of Getter.
   * @param {*} { root = {}, options = {} }
   * @memberof Getter
   */
  constructor({ root = {}, options = {} }) {
    this.root = root;
    this.options = options;
    this.defineProperty();
  }
  /**
   *定义变量
   *
   * @memberof Getter
   */
  defineProperty() {
    this.privateMethods = {};

    this.interfaceMethods = {};
  }
  /**
   *对外暴露的统一接口
   *
   * @returns
   * @memberof Getter
   */
  run() {
    return this.interfaceMethods;
  }
  /**
   *
   *注册getter方法
   *
   * @param {*} [getterData={}]
   * @param {string} [spaceKey='']
   * @memberof Getter
   */
  register(getterData = {}, spaceKey = '') {
    // 根据spaceKey解析存储的getter
    this.savePrivateMethod(getterData, spaceKey);
    // 存储getter
    this.saveInterfaceMethod(getterData, spaceKey);
  }
  /**
   *
   *getter以私有形式存在
   *
   * @param {*} [getterData={}]
   * @param {string} [spaceKey='']
   * @returns
   * @memberof Getter
   */
  savePrivateMethod(getterData = {}, spaceKey = '') {
    // 如果需要注册的getter是空的，返回
    if (Object.keys(getterData).length === 0) return;

    const { stateIns } = this.root;
    const currentState = stateIns.getCurrentState(spaceKey);

    Object.keys(getterData).forEach((key) => {
      const data = getterData[key];

      if (typeof data !== 'function') throw new Error(`${key}必须是一个函数`);

      if (!isObject(this.privateMethods[spaceKey])) {
        this.privateMethods[spaceKey] = {};
      }

      if (Object.keys(this.privateMethods[spaceKey]).some(methodKey => methodKey === key)) {
        throw new Error(`Duplicate key with ${key}`);
      } 

      Object.defineProperty(this.privateMethods[spaceKey], key, {
        get: () => {
          return data.call(this.root, currentState, this.getCurrentGetter(spaceKey));
        }
      });
    });
  }
  /**
   *getter以接口形式存在
   *
   * @param {*} [getterData={}]
   * @param {string} [spaceKey='']
   * @returns
   * @memberof Getter
   */
  saveInterfaceMethod(getterData = {}, spaceKey = '') {
    if (!isObject(getterData)) throw new Error('getter必须是对象');

    // 如果需要注册的getter是空的，返回
    if (Object.keys(getterData).length === 0) return;

    const { stateIns } = this.root;
    const currentState = stateIns.getCurrentState(spaceKey);

    // 存储getter方法
    Object.keys(getterData).forEach((key) => {
      const data = getterData[key];

      if (typeof data !== 'function') throw new Error(`${key}必须是一个函数`);

      // 如果之前存在这个key，抛出错误
      const generKey = spaceKey ? `${spaceKey}/${key}` : key;
      if (Object.keys(this.interfaceMethods).some(methodKey => methodKey === generKey)) {
        throw new Error(`Duplicate key with ${generKey}`);
      } 

      Object.defineProperty(this.interfaceMethods, generKey, {
        get: () => {
          return data.call(this.root, currentState, this.getCurrentGetter(spaceKey));
        }
      });
    });
  }

  /**
   *得到当前命名空间下的getter
   *
   * @param {string} [spaceKey='']
   * @memberof Getter
   */
  getCurrentGetter(spaceKey = '') {
    return this.privateMethods[spaceKey];
  }
}

/**
 *Mutation同步更新数据层方法
 *
 * @export
 * @class Mutation
 */
class Mutation {
  /**
   *Creates an instance of Mutation.
   * @param {*} { root = {}, options = {} }
   * @memberof Mutation
   */
  constructor({ root = {}, options = {} }) {
    this.root = root;
    this.options = options;
    this.defineProperty();
  }
  /**
   *定义变量
   *
   * @memberof Mutation
   */
  defineProperty() {
    this.interFaceMutations = {}; 
  }
  /**
   *执行入口
   *
   * @returns
   * @memberof Mutation
   */
  run() {
    return this.commit.bind(this);
  }
  /**
   *注册mutation数据
   *
   * @param {*} [mutationData={}]
   * @param {string} [spaceKey='']
   * @memberof Mutation
   */
  register(mutationData = {}, spaceKey = '') {
     // 根据spaceKey解析存储的mutation
    this.saveInterFaceMutation(mutationData, spaceKey);
  }
  /**
   *mutation数据以接口形式展示
   *
   * @param {*} [mutationData={}]
   * @param {string} [spaceKey='']
   * @returns
   * @memberof Mutation
   */
  saveInterFaceMutation(mutationData = {}, spaceKey = '') {
    if (!isObject(mutationData)) throw new Error('mutation必须是对象');

    // 如果需要注册的mutation是空的，返回
    if (Object.keys(mutationData).length === 0) return;

    // 存储getter方法
    Object.keys(mutationData).forEach((key) => {
      const data = mutationData[key];

      if (typeof data !== 'function') throw new Error(`${key}必须是一个函数`);

      // 如果之前存在这个key，抛出错误
      const generKey = spaceKey ? `${spaceKey}/${key}` : key;
      if (Object.keys(this.interFaceMutations).some(methodKey => methodKey === generKey)) {
        throw new Error(`Duplicate key with ${generKey}`);
      } 

      this.interFaceMutations[generKey] = data;
    });
  }
  /**
   *emit触发相应的mutation函数
   *
   * @param {string} [generKey='']
   * @param {string} [payload='']
   * @returns
   * @memberof Mutation
   */
  commit(generKey = '', payload = '') {
    if (!generKey) throw new Error('commit的第一个参数不能为空');

    const lastIndexOfSignal = generKey.lastIndexOf('/');
    const spaceKey = lastIndexOfSignal > -1 ? generKey.slice(0, lastIndexOfSignal) : '';

    const { stateIns, getterIns } = this.root;

    const currentState = stateIns.getCurrentState(spaceKey);
    const currentGetter = getterIns.getCurrentGetter(spaceKey);

    return this.interFaceMutations[generKey].call(this.root, payload, { state: currentState, getter: currentGetter, commit: this.getCurrentCommit(spaceKey) });    
  }
  /**
   *触发当前生命周期的mutation函数
   *
   * @param {string} [spaceKey='']
   * @returns
   * @memberof Mutation
   */
  getCurrentCommit(spaceKey = '') {
    return (key = '', payload = '') => {
      const generKey = spaceKey ? `${spaceKey}/${key}` : key;

      this.commit(generKey, payload);
    };
  }
}

/**
 *Promise形式的Action
 *
 * @export
 * @class Action
 */
class Action {
  /**
   *Creates an instance of Action.
   * @param {*} { root = {}, options = {} }
   * @memberof Action
   */
  constructor({ root = {}, options = {} }) {
    this.root = root;
    this.options = options;
    this.defineProperty();
  }
  /**
   *定义变量
   *
   * @memberof Action
   */
  defineProperty() {
    this.interFaceActions = {}; 
  }
  /**
   *入口函数
   *
   * @returns
   * @memberof Action
   */
  run() {
    return this.dispatch.bind(this);
  }
  /**
   *注册action数据
   *
   * @param {*} [actionData={}]
   * @param {string} [spaceKey='']
   * @memberof Action
   */
  register(actionData = {}, spaceKey = '') {
    // 根据spaceKey解析存储的action
    this.saveInterFaceAction(actionData, spaceKey);
  }
  /**
   *保存Action数据以接口形式
   *
   * @param {*} [actionData={}]
   * @param {string} [spaceKey='']
   * @returns
   * @memberof Action
   */
  saveInterFaceAction(actionData = {}, spaceKey = '') {
    if (!isObject(actionData)) throw new Error('action必须是对象');

    // 如果需要注册的action是空的，返回
    if (Object.keys(actionData).length === 0) return;

    // 存储getter方法
    Object.keys(actionData).forEach((key) => {
      const data = actionData[key];

      if (typeof data !== 'function') throw new Error(`${key}必须是一个函数`);

      // 如果之前存在这个key，抛出错误
      const generKey = spaceKey ? `${spaceKey}/${key}` : key;
      if (Object.keys(this.interFaceActions).some(methodKey => methodKey === generKey)) {
        throw new Error(`Duplicate key with ${generKey}`);
      } 

      this.interFaceActions[generKey] = data;
    });
  }
  /**
   *Promise形式执行
   *
   * @param {string} [generKey='']
   * @param {string} [payload='']
   * @returns
   * @memberof Action
   */
  dispatch(generKey = '', payload = '') {
    if (!generKey) throw new Error('dispatch的第一个参数不能为空');

    const lastIndexOfSignal = generKey.lastIndexOf('/');
    const spaceKey = lastIndexOfSignal > -1 ? generKey.slice(0, lastIndexOfSignal) : '';

    const { stateIns, getterIns, mutationIns } = this.root;

    const currentState = stateIns.getCurrentState(spaceKey);
    const currentGetter = getterIns.getCurrentGetter(spaceKey);
    const currentCommit = mutationIns.getCurrentCommit(spaceKey);

    return Promise.resolve(this.interFaceActions[generKey].call(
      this.root, 
      payload, 
      { 
        state: currentState, 
        getter: currentGetter, 
        commit: currentCommit, 
        dispatch: this.getCurrentDispatch(spaceKey)
      }
    ));    
  }
  /**
   *当前命名空间执行
   *
   * @param {string} [spaceKey='']
   * @returns
   * @memberof Action
   */
  getCurrentDispatch(spaceKey = '') {
    return (key = '', payload = '') => {
      const generKey = spaceKey ? `${spaceKey}/${key}` : key;

      return this.dispatch(generKey, payload);
    };
  }
}

class DataLayer {
  constructor(options = {}, root = {}) {
    this.root = root;
    this.options = options;
    this.defineProperty();
  }
  /**
   *定义严格数据
   *
   * @memberof DataLayer
   */
  defineProperty() {
    const that = this;
    this.stateIns = new State({ root: that, options: that.options });
    this.getterIns = new Getter({ root: that, options: that.options });
    this.mutationIns = new Mutation({ root: that, options: that.options });
    this.actionIns = new Action({ root: that, options: that.options });

    // 命名空间集合
    this.spaceKeys = [];

    Object.defineProperty(that, 'state', {
      configurable: false,
      enumerable: false,
      get() {
        return that.stateIns.run();
      }
    });
    Object.defineProperty(that, 'getter', {
      configurable: false,
      enumerable: false,
      get() {
        return that.getterIns.run();
      }
    });
    Object.defineProperty(that, 'commit', {
      configurable: false,
      enumerable: false,
      get() {
        return that.mutationIns.run();
      }
    });
    Object.defineProperty(that, 'dispatch', {
      configurable: false,
      enumerable: false,
      get() {
        return that.actionIns.run();
      }
    });
  }
  /**
   *注册数据
   *
   * @param {*} [configData={}]
   * @memberof DataLayer
   */
  register(configData = {}, spaceKey = '') {
    if (!isObject(configData)) throw new Error('config必须是对象');

    const { state = {}, getter = {}, mutation = {}, action = {}, modules = {} } = configData;

    // 保存命名空间
    if (spaceKey) this.spaceKeys = [...this.spaceKeys, spaceKey];

    // 处理preNameSpace
    this.stateIns.register(state, spaceKey);
    this.getterIns.register(getter, spaceKey);
    this.mutationIns.register(mutation, spaceKey);
    this.actionIns.register(action, spaceKey);

    this.analysisModules(modules, spaceKey);
  }
  analysisModules(modules = {}, preSpaceKey = '') {
    if (!isObject(modules)) throw new Error({ msg: 'modules必须是对象' }); 

    Object.keys(modules).forEach(key => {
      const moduleData = modules[key];
      
      const { namespace = false } = moduleData;
      const splitSignal = preSpaceKey ? '/' : '';

      const spaceKey = preSpaceKey + (namespace ? `${splitSignal}${key}` : '');

      this.register(moduleData, spaceKey);
    });
  }
}


let dataLayerInstance = '';

var index = {
  /**
   *装配数据层，保证单例
   * 
   * 
   * @param {*} [app={}]
   * @param {*} [opt={}]
   * @param {*} [config={}]
   * @returns
   */
  install(app = {}, config = {}, opt = {}) {
    // 兼容普通模式，call，apply模式
    if (arguments.length === 2) {
      opt = config;
      config = app;
      app = this;
    }
    // 判断参数是否合法
    if (!(isObject(app) && isObject(opt))) return { type: 'ERROR', msg: '参数类型错误' };
    // 判断是否已有Service实例
    if (dataLayerInstance instanceof DataLayer) return { type: 'INSTALLED', msg: '基础服务已加载' }; 

    dataLayerInstance = new DataLayer(opt, app);

    // 装配DataLayer
    app.$store = dataLayerInstance;

    // 装配DataLayer配置文件
    app.$store.register(config);
    
    return { type: 'SUCCESS', msg: 'ok' };
  }
};

module.exports = index;

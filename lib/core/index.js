import State from './state/index';
import Getter from './getter/index';
import Mutation from './mutation/index';
import Action from './action/index';

import { isObject } from './utils/index';

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

export default {
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
}
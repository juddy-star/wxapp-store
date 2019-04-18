import { isObject } from '../utils/index';

/**
 *Promise形式的Action
 *
 * @export
 * @class Action
 */
export default class Action {
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
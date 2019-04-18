const defaultConf = require('./default/index');
const takeawayConf = require('./modules/takeaway/index');

module.exports = {
  ...defaultConf,
  modules: {
    takeaway: {
      ...takeawayConf,
      modules: {
        sdfsdf: {
          state: {
            count: 777
          },
          getter: {
            sdfsdf(state, getter) {
              console.log(state, 'sdfsdf');
              return getter.nnn;
            }
          },
          mutation: {
            bbbb(payload, {
              state,
              getter
            } = {}) {
              state.count = payload;
              console.log(state.count, 'bbbb');
              console.log(getter.sdfsdf, 'bbbb');
            }
          },
          action: {
            uuu(payload, {
              state,
              getter,
              commit,
              dispatch
            } = {}) {
              console.log(state, 'uuu');
              console.log(getter, 'uuu');
              console.log(commit('bbbb', 69696), 'uuu');
              return new Promise((resolve) => {
                dispatch('ccc', 111).then(resolve);
              });
            }
          }
        },
        aaa: {
          namespace: true,
          state: {
            count: 999
          },
          getter: {
            oooo() {}
          },
          mutation: {},
          action: {}
        }
      }
    }
  }
};
const store = require('../../dist');
const config = require('./config');

const app = {};

store.install.call(app, config, {});

console.log(app.$store.state['takeaway/aaa'].count);
console.log(app.$store.getter['takeaway/meme']);
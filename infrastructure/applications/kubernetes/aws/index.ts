import { clusters } from './clusters';
export = async () => {
  await require('./metrics-server')(clusters);
  await require('./cluster-autoscaler')(clusters);
  await require('./addons')(clusters);
};

import AppOutput from '../../libraries/types/appOutput';

export = async (): Promise<{ app: AppOutput; aws: any; } | any> => {
  const app = require('./kubernetes')();
  const database = require('./aws/database');

  return {
    app: app,
    aws: {
      database,
    },
  };
};

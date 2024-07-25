export = async (): Promise< any> => {
    const vpcConf = require('./vpc');
  
    return {
        vpcConf: vpcConf.vpcConf
    };
  };
export = async (): Promise<any> => {
  const securityGroups = require('./secutiryGroup');

  return {
    securityGroups: securityGroups,
  };
};

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = resolveJoins;

// Used to resolve Fn::Join in environment variables
function resolveJoins(environment) {
  if (!environment) {
    return undefined;
  }

  const newEnv = {};
  Object.keys(environment).forEach(key => {
    const value = environment[key];

    if (!value) {
      return;
    }

    const joinArray = value['Fn::Join'];
    const isJoin = Boolean(joinArray);

    if (isJoin) {
      const separator = joinArray[0];
      const joined = joinArray[1].join(separator);
      newEnv[key] = joined;
    } else {
      newEnv[key] = value;
    }
  });
  return newEnv;
}
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = generateHapiPath;

function generateHapiPath(path = '', options, serverless) {
  // path must start with '/'
  let hapiPath = path.startsWith('/') ? path : `/${path}`;

  if (!options.noPrependStageInUrl) {
    const stage = options.stage || serverless.service.provider.stage; // prepend the stage to path

    hapiPath = `/${stage}${hapiPath}`;
  }

  if (options.prefix) {
    hapiPath = `/${options.prefix}${hapiPath}`;
  }

  if (hapiPath !== '/' && hapiPath.endsWith('/')) {
    hapiPath = hapiPath.slice(0, -1);
  }

  hapiPath = hapiPath.replace(/\+}/g, '*}');
  return hapiPath;
}
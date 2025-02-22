"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _index = require("../utils/index.js");

var _default = {
  apiKey: (0, _index.createApiKey)(),
  corsAllowCredentials: true,
  // TODO no CLI option
  corsAllowHeaders: 'accept,content-type,x-api-key,authorization',
  corsAllowOrigin: '*',
  corsExposedHeaders: 'WWW-Authenticate,Server-Authorization',
  disableCookieValidation: false,
  enforceSecureCookies: false,
  hideStackTraces: false,
  host: 'localhost',
  httpPort: 3000,
  httpsProtocol: '',
  lambdaPort: 3002,
  noPrependStageInUrl: false,
  noAuth: false,
  noTimeout: false,
  prefix: '',
  printOutput: false,
  resourceRoutes: false,
  useChildProcesses: false,
  useWorkerThreads: false,
  websocketPort: 3001,
  webSocketHardTimeout: 7200,
  webSocketIdleTimeout: 600,
  useDocker: false,
  layersDir: null,
  dockerReadOnly: true,
  functionCleanupIdleTimeSeconds: 60,
  allowCache: false
};
exports.default = _default;
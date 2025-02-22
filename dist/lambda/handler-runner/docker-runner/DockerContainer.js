"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _os = require("os");

var _execa = _interopRequireDefault(require("execa"));

var _nodeFetch = _interopRequireDefault(require("node-fetch"));

var _pRetry = _interopRequireDefault(require("p-retry"));

var _awsSdk = require("aws-sdk");

var _jszip = _interopRequireDefault(require("jszip"));

var _fs = require("fs");

var _fsExtra = require("fs-extra");

var _path = require("path");

var _crypto = _interopRequireDefault(require("crypto"));

var _DockerImage = _interopRequireDefault(require("./DockerImage.js"));

var _DockerPort = _interopRequireDefault(require("./DockerPort.js"));

var _debugLog = _interopRequireDefault(require("../../../debugLog.js"));

var _serverlessLog = require("../../../serverlessLog.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classPrivateFieldLooseBase(receiver, privateKey) { if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) { throw new TypeError("attempted to use private field on non-instance"); } return receiver; }

var id = 0;

function _classPrivateFieldLooseKey(name) { return "__private_" + id++ + "_" + name; }

const {
  stringify
} = JSON;
const {
  entries
} = Object;
const {
  keys
} = Object;

var _dockerPort = _classPrivateFieldLooseKey("dockerPort");

var _containerId = _classPrivateFieldLooseKey("containerId");

var _env = _classPrivateFieldLooseKey("env");

var _functionKey = _classPrivateFieldLooseKey("functionKey");

var _handler = _classPrivateFieldLooseKey("handler");

var _imageNameTag = _classPrivateFieldLooseKey("imageNameTag");

var _image = _classPrivateFieldLooseKey("image");

var _runtime = _classPrivateFieldLooseKey("runtime");

var _layers = _classPrivateFieldLooseKey("layers");

var _port = _classPrivateFieldLooseKey("port");

var _provider = _classPrivateFieldLooseKey("provider");

var _dockerOptions = _classPrivateFieldLooseKey("dockerOptions");

var _lambda = _classPrivateFieldLooseKey("lambda");

class DockerContainer {
  constructor(env, functionKey, handler, runtime, layers, provider, dockerOptions) {
    Object.defineProperty(this, _containerId, {
      writable: true,
      value: null
    });
    Object.defineProperty(this, _env, {
      writable: true,
      value: null
    });
    Object.defineProperty(this, _functionKey, {
      writable: true,
      value: null
    });
    Object.defineProperty(this, _handler, {
      writable: true,
      value: null
    });
    Object.defineProperty(this, _imageNameTag, {
      writable: true,
      value: null
    });
    Object.defineProperty(this, _image, {
      writable: true,
      value: null
    });
    Object.defineProperty(this, _runtime, {
      writable: true,
      value: null
    });
    Object.defineProperty(this, _layers, {
      writable: true,
      value: null
    });
    Object.defineProperty(this, _port, {
      writable: true,
      value: null
    });
    Object.defineProperty(this, _provider, {
      writable: true,
      value: null
    });
    Object.defineProperty(this, _dockerOptions, {
      writable: true,
      value: null
    });
    Object.defineProperty(this, _lambda, {
      writable: true,
      value: null
    });
    _classPrivateFieldLooseBase(this, _env)[_env] = env;
    _classPrivateFieldLooseBase(this, _functionKey)[_functionKey] = functionKey;
    _classPrivateFieldLooseBase(this, _handler)[_handler] = handler;
    _classPrivateFieldLooseBase(this, _imageNameTag)[_imageNameTag] = this._baseImage(runtime);
    _classPrivateFieldLooseBase(this, _image)[_image] = new _DockerImage.default(_classPrivateFieldLooseBase(this, _imageNameTag)[_imageNameTag]);
    _classPrivateFieldLooseBase(this, _runtime)[_runtime] = runtime;
    _classPrivateFieldLooseBase(this, _layers)[_layers] = layers;
    _classPrivateFieldLooseBase(this, _provider)[_provider] = provider;
    _classPrivateFieldLooseBase(this, _dockerOptions)[_dockerOptions] = dockerOptions;
  }

  _baseImage(runtime) {
    return `lambci/lambda:${runtime}`;
  }

  async start(codeDir) {
    const [, port] = await Promise.all([_classPrivateFieldLooseBase(this, _image)[_image].pull(), _classPrivateFieldLooseBase(DockerContainer, _dockerPort)[_dockerPort].get()]);
    (0, _debugLog.default)('Run Docker container...');
    let permissions = 'ro';

    if (!_classPrivateFieldLooseBase(this, _dockerOptions)[_dockerOptions].readOnly) {
      permissions = 'rw';
    } // https://github.com/serverless/serverless/blob/v1.57.0/lib/plugins/aws/invokeLocal/index.js#L291-L293


    const dockerArgs = ['-v', `${codeDir}:/var/task:${permissions},delegated`, '-p', `${port}:9001`, '-e', 'DOCKER_LAMBDA_STAY_OPEN=1' // API mode
    ];

    if (_classPrivateFieldLooseBase(this, _layers)[_layers].length > 0) {
      (0, _serverlessLog.logLayers)(`Found layers, checking provider type`);

      if (_classPrivateFieldLooseBase(this, _provider)[_provider].name.toLowerCase() !== 'aws') {
        (0, _serverlessLog.logLayers)(`Provider ${_classPrivateFieldLooseBase(this, _provider)[_provider].name} is Unsupported. Layers are only supported on aws.`);
      } else {
        let layerDir = _classPrivateFieldLooseBase(this, _dockerOptions)[_dockerOptions].layersDir;

        if (!layerDir) {
          layerDir = `${codeDir}/.serverless-offline/layers`;
        }

        layerDir = `${layerDir}/${this._getLayersSha256()}`;

        if (await (0, _fsExtra.pathExists)(layerDir)) {
          (0, _serverlessLog.logLayers)(`Layers already exist for this function. Skipping download.`);
        } else {
          const layers = [];
          (0, _serverlessLog.logLayers)(`Storing layers at ${layerDir}`); // Only initialise if we have layers, we're using AWS, and they don't already exist

          _classPrivateFieldLooseBase(this, _lambda)[_lambda] = new _awsSdk.Lambda({
            apiVersion: '2015-03-31',
            region: _classPrivateFieldLooseBase(this, _provider)[_provider].region
          });
          (0, _serverlessLog.logLayers)(`Getting layers`);

          for (const layerArn of _classPrivateFieldLooseBase(this, _layers)[_layers]) {
            layers.push(this._downloadLayer(layerArn, layerDir));
          }

          await Promise.all(layers);
        }

        dockerArgs.push('-v', `${layerDir}:/opt:ro,delegated`);
      }
    }

    entries(_classPrivateFieldLooseBase(this, _env)[_env]).forEach(([key, value]) => {
      dockerArgs.push('-e', `${key}=${value}`);
    });

    if ((0, _os.platform)() === 'linux') {
      // Add `host.docker.internal` DNS name to access host from inside the container
      // https://github.com/docker/for-linux/issues/264
      const gatewayIp = await this._getBridgeGatewayIp();
      dockerArgs.push('--add-host', `host.docker.internal:${gatewayIp}`);
    }

    const {
      stdout: containerId
    } = await (0, _execa.default)('docker', ['create', ...dockerArgs, _classPrivateFieldLooseBase(this, _imageNameTag)[_imageNameTag], _classPrivateFieldLooseBase(this, _handler)[_handler]]);
    const dockerStart = (0, _execa.default)('docker', ['start', '-a', containerId], {
      all: true
    });
    await new Promise((resolve, reject) => {
      dockerStart.all.on('data', data => {
        const str = data.toString();
        console.log(str);

        if (str.includes('Lambda API listening on port')) {
          resolve();
        }
      });
      dockerStart.on('error', err => {
        reject(err);
      });
    });
    _classPrivateFieldLooseBase(this, _containerId)[_containerId] = containerId;
    _classPrivateFieldLooseBase(this, _port)[_port] = port;
    await (0, _pRetry.default)(() => this._ping(), {
      // default,
      factor: 2,
      // milliseconds
      minTimeout: 10,
      // default
      retries: 10
    });
  }

  async _downloadLayer(layerArn, layerDir) {
    const layerName = layerArn.split(':layer:')[1];
    const layerZipFile = `${layerDir}/${layerName}.zip`;
    (0, _serverlessLog.logLayers)(`[${layerName}] ARN: ${layerArn}`);
    const params = {
      Arn: layerArn
    };
    (0, _serverlessLog.logLayers)(`[${layerName}] Getting Info`);
    let layer = null;

    try {
      layer = await _classPrivateFieldLooseBase(this, _lambda)[_lambda].getLayerVersionByArn(params).promise();
    } catch (e) {
      (0, _serverlessLog.logWarning)(`[${layerName}] ${e.code}: ${e.message}`);
      return;
    }

    if (Object.prototype.hasOwnProperty.call(layer, 'CompatibleRuntimes') && !layer.CompatibleRuntimes.includes(_classPrivateFieldLooseBase(this, _runtime)[_runtime])) {
      (0, _serverlessLog.logWarning)(`[${layerName}] Layer is not compatible with ${_classPrivateFieldLooseBase(this, _runtime)[_runtime]} runtime`);
      return;
    }

    const layerUrl = layer.Content.Location; // const layerSha = layer.Content.CodeSha256

    const layerSize = layer.Content.CodeSize;
    await (0, _fsExtra.ensureDir)(layerDir);
    (0, _serverlessLog.logLayers)(`[${layerName}] Downloading ${this._formatBytes(layerSize)}...`);
    const res = await (0, _nodeFetch.default)(layerUrl, {
      method: 'get'
    });

    if (!res.ok) {
      (0, _serverlessLog.logWarning)(`[${layerName}] Failed to fetch from ${layerUrl} with ${res.statusText}`);
      return;
    }

    const fileStream = (0, _fs.createWriteStream)(`${layerZipFile}`);
    await new Promise((resolve, reject) => {
      res.body.pipe(fileStream);
      res.body.on('error', err => {
        reject(err);
      });
      fileStream.on('finish', () => {
        resolve();
      });
    });
    (0, _serverlessLog.logLayers)(`[${layerName}] Unzipping to .layers directory`);
    const data = await (0, _fsExtra.readFile)(`${layerZipFile}`);
    const zip = await _jszip.default.loadAsync(data);
    await Promise.all(keys(zip.files).map(async filename => {
      const fileData = await zip.files[filename].async('nodebuffer');

      if (filename.endsWith(_path.sep)) {
        return Promise.resolve();
      }

      await (0, _fsExtra.ensureDir)((0, _path.join)(layerDir, (0, _path.dirname)(filename)));
      return (0, _fsExtra.writeFile)((0, _path.join)(layerDir, filename), fileData, {
        mode: zip.files[filename].unixPermissions
      });
    }));
    (0, _serverlessLog.logLayers)(`[${layerName}] Removing zip file`);
    (0, _fs.unlinkSync)(`${layerZipFile}`);
  }

  async _getBridgeGatewayIp() {
    let gateway;

    try {
      ;
      ({
        stdout: gateway
      } = await (0, _execa.default)('docker', ['network', 'inspect', 'bridge', '--format', '{{(index .IPAM.Config 0).Gateway}}']));
    } catch (err) {
      console.error(err.stderr);
      throw err;
    }

    return gateway.split('/')[0];
  }

  async _ping() {
    const url = `http://localhost:${_classPrivateFieldLooseBase(this, _port)[_port]}/2018-06-01/ping`;
    const res = await (0, _nodeFetch.default)(url);

    if (!res.ok) {
      throw new Error(`Failed to fetch from ${url} with ${res.statusText}`);
    }

    return res.text();
  }

  async request(event) {
    const url = `http://localhost:${_classPrivateFieldLooseBase(this, _port)[_port]}/2015-03-31/functions/${_classPrivateFieldLooseBase(this, _functionKey)[_functionKey]}/invocations`;
    const res = await (0, _nodeFetch.default)(url, {
      body: stringify(event),
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'post'
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch from ${url} with ${res.statusText}`);
    }

    return res.json();
  }

  async stop() {
    if (_classPrivateFieldLooseBase(this, _containerId)[_containerId]) {
      try {
        await (0, _execa.default)('docker', ['stop', _classPrivateFieldLooseBase(this, _containerId)[_containerId]]);
        await (0, _execa.default)('docker', ['rm', _classPrivateFieldLooseBase(this, _containerId)[_containerId]]);
      } catch (err) {
        console.error(err.stderr);
        throw err;
      }
    }
  }

  _formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
  }

  _getLayersSha256() {
    return _crypto.default.createHash('sha256').update(JSON.stringify(_classPrivateFieldLooseBase(this, _layers)[_layers])).digest('hex');
  }

  get isRunning() {
    return _classPrivateFieldLooseBase(this, _containerId)[_containerId] !== null && _classPrivateFieldLooseBase(this, _port)[_port] !== null;
  }

}

exports.default = DockerContainer;
Object.defineProperty(DockerContainer, _dockerPort, {
  writable: true,
  value: new _DockerPort.default()
});
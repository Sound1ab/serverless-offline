"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _serverlessLog = _interopRequireDefault(require("../../../serverlessLog.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classPrivateFieldLooseBase(receiver, privateKey) { if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) { throw new TypeError("attempted to use private field on non-instance"); } return receiver; }

var id = 0;

function _classPrivateFieldLooseKey(name) { return "__private_" + id++ + "_" + name; }

var _lambda = _classPrivateFieldLooseKey("lambda");

class InvocationsController {
  constructor(lambda) {
    Object.defineProperty(this, _lambda, {
      writable: true,
      value: null
    });
    _classPrivateFieldLooseBase(this, _lambda)[_lambda] = lambda;
  }

  async invoke(functionName, invocationType, event, clientContext) {
    // Reject gracefully if functionName does not exist
    const functionNames = _classPrivateFieldLooseBase(this, _lambda)[_lambda].listFunctionNames();

    if (functionNames.length === 0 || !functionNames.includes(functionName)) {
      (0, _serverlessLog.default)(`Attempt to invoke function '${functionName}' failed. Function does not exists.`); // Conforms to the actual response from AWS Lambda when invoking a non-existent
      // function. Details on the error are provided in the Payload.Message key

      return {
        FunctionError: 'ResourceNotFoundException',
        Payload: {
          Message: `Function not found: ${functionName}`,
          Type: 'User'
        },
        StatusCode: 404
      };
    }

    const lambdaFunction = _classPrivateFieldLooseBase(this, _lambda)[_lambda].getByFunctionName(functionName);

    lambdaFunction.setClientContext(clientContext);
    lambdaFunction.setEvent(event);

    if (invocationType === 'Event') {
      // don't await result!
      lambdaFunction.runHandler().catch(err => {
        // TODO handle error
        console.log(err);
        throw err;
      });
      return {
        Payload: '',
        StatusCode: 202
      };
    }

    if (!invocationType || invocationType === 'RequestResponse') {
      let result;

      try {
        result = await lambdaFunction.runHandler();
      } catch (err) {
        (0, _serverlessLog.default)(`Unhandled Lambda Error during invoke of '${functionName}'`);
        console.log(err); // In most circumstances this is the correct error type/structure.
        // The API returns a StreamingBody with status code of 200
        // that eventually spits out the error and stack trace.
        // When the request is synchronous, aws-sdk should buffer
        // the whole error stream, however this has not been validated.

        return {
          Payload: {
            errorType: 'Error',
            errorMessage: err.message,
            trace: err.stack.split('\n')
          },
          UnhandledError: true,
          StatusCode: 200
        }; // TODO: Additional pre and post-handler validation can expose
        // the following error types:
        // RequestTooLargeException, InvalidParameterValueException,
        // and whatever response is thrown when the response is too large.
      } // result is actually the Payload.
      // So return in a standard structure so Hapi can
      // respond with the correct status codes


      return {
        Payload: result,
        StatusCode: 200
      };
    } // TODO FIXME


    const errMsg = `invocationType: '${invocationType}' not supported by serverless-offline`;
    console.log(errMsg);
    return {
      FunctionError: 'InvalidParameterValueException',
      Payload: {
        Message: errMsg,
        Type: 'User'
      },
      StatusCode: 400
    };
  }

}

exports.default = InvocationsController;
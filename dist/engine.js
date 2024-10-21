"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShowHelpError = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const params_1 = __importDefault(require("./params"));
const config_1 = require("./config");
const path_1 = __importDefault(require("path"));
class ShowHelpError extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, ShowHelpError.prototype);
    }
}
exports.ShowHelpError = ShowHelpError;
const engine = (argv, config) => __awaiter(void 0, void 0, void 0, function* () {
    const { cwd, templates, logger } = config;
    let configJsonResolver = new config_1.ConfigResolver('config.json', {
        exists: fs_extra_1.default.exists,
        load: (f) => __awaiter(void 0, void 0, void 0, function* () { return yield Promise.resolve().then(() => __importStar(require(f))); }),
        none: (_) => ({}),
    });
    let configJson = yield configJsonResolver.resolve(cwd);
    const args = Object.assign(yield (0, params_1.default)(config, argv, configJson), { cwd });
    const { generator, action, actionfolder } = args;
    if (['-h', '--help'].includes(argv[0])) {
        logger.log(`
Usage:
  hygen [option] GENERATOR ACTION [--name NAME] [data-options]

Options:
  -h, --help # Show this message and quit
  --dry      # Perform a dry run.  Files will be generated but not saved.`);
        process.exit(0);
    }
    logger.log(args.dry ? '(dry mode)' : '');
    if (!generator) {
        throw new ShowHelpError('please specify a generator.');
    }
    if (!action) {
        throw new ShowHelpError(`please specify an action for ${generator}.`);
    }
    logger.log(`Loaded templates: ${templates.replace(`${cwd}/`, '')}`);
    if (!(yield fs_extra_1.default.exists(actionfolder))) {
        throw new ShowHelpError(`I can't find action '${action}' for generator '${generator}'.

      You can try:
      1. 'hygen init self' to initialize your project, and
      2. 'hygen generator new --name ${generator}' to build the generator you wanted.

      Check out the quickstart for more: https://hygen.io/docs/quick-start
      `);
    }
    // lazy loading these dependencies gives a better feel once
    // a user is exploring hygen (not specifying what to execute)
    const execute = (yield Promise.resolve().then(() => __importStar(require('./execute')))).default;
    const render = (yield Promise.resolve().then(() => __importStar(require('./render')))).default;
    const hooksfile = path_1.default.resolve(path_1.default.join(args.actionfolder, 'index.js'));
    //@ts-ignore
    if (fs_extra_1.default.existsSync(hooksfile)) {
        let hooksModule = yield Promise.resolve().then(() => __importStar(require(hooksfile)));
        if (hooksModule.default) {
            hooksModule = hooksModule.default;
        }
        if (hooksModule.render) {
            const renderFile = (yield Promise.resolve().then(() => __importStar(require('./renderFile')))).default;
            //@ts-ignore
            return execute(yield hooksModule.render(args.actionfolder, args, configJson, config, renderFile), args, config);
        }
        else {
            return execute(yield render(args, config), args, config);
        }
    }
    else {
        return execute(yield render(args, config), args, config);
    }
});
exports.default = engine;

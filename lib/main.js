"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.context = void 0;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const minimatch_1 = require("minimatch");
const config_1 = require("./config");
const CONFIG_FILENAME = 'pr-branch-labeler.yml';
const defaults = [
    { label: 'feature', head: 'feature/*', base: undefined },
    { label: 'bugfix', head: ['bugfix/*', 'hotfix/*'], base: undefined },
    { label: 'chore', head: 'chore/*', base: undefined }
];
// Export the context to be able to mock the payload during tests.
exports.context = github.context;
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const repoToken = core.getInput('repo-token', { required: true });
        core.debug(`context: ${exports.context ? JSON.stringify(exports.context) : ''}`);
        if (exports.context &&
            exports.context.payload &&
            exports.context.payload.repository &&
            exports.context.payload.pull_request) {
            const octokit = github.getOctokit(repoToken);
            const repoConfig = yield (0, config_1.getLabel)(octokit, CONFIG_FILENAME, exports.context);
            core.debug(`repoConfig: ${JSON.stringify(repoConfig)}`);
            const config = repoConfig.length > 0 ? repoConfig : defaults;
            core.debug(`config: ${JSON.stringify(config)}`);
            const headRef = exports.context.payload.pull_request.head.ref;
            const baseRef = exports.context.payload.pull_request.base.ref;
            const labelsToAdd = config.reduce((labels, entry) => {
                if (entry.head && entry.base) {
                    if (checkAny(headRef, entry.head) && checkAny(baseRef, entry.base)) {
                        core.info(`Matched "${headRef}" to "${entry.head}" and "${baseRef}" to "${entry.base}". Setting label to "${entry.label}"`);
                        labels.push(entry.label);
                    }
                }
                else if (entry.head && checkAny(headRef, entry.head)) {
                    core.info(`Matched "${headRef}" to "${entry.head}". Setting label to "${entry.label}"`);
                    labels.push(entry.label);
                }
                else if (entry.base && checkAny(baseRef, entry.base)) {
                    core.info(`Matched "${baseRef}" to "${entry.base}". Setting label to "${entry.label}"`);
                    labels.push(entry.label);
                }
                return labels;
            }, []);
            if (labelsToAdd.length > 0) {
                core.debug(`Adding labels: ${labelsToAdd}`);
                yield octokit.rest.issues.addLabels(Object.assign({ issue_number: exports.context.payload.pull_request.number, labels: labelsToAdd }, exports.context.repo));
            }
        }
    });
}
exports.run = run;
function isMatch(ref, pattern) {
    const matcher = new minimatch_1.Minimatch(pattern);
    return matcher.match(ref);
}
function checkAny(ref, patterns) {
    return Array.isArray(patterns)
        ? patterns.some((pattern) => isMatch(ref, pattern))
        : isMatch(ref, patterns);
}
function getErrorMessage(error) {
    if (error instanceof Error)
        return error.message;
    return String(error);
}
try {
    run();
}
catch (error) {
    core.error(`ERROR! ${JSON.stringify(error)}`);
    core.setFailed(getErrorMessage(error));
    throw error;
}

"use strict";
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
exports.getLabel = void 0;
const js_yaml_1 = __importDefault(require("js-yaml"));
const CONFIG_PATH = '.github';
function fetchContent(client, repoPath, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield client.rest.repos.getContent({
            owner: context.repo.owner,
            repo: context.repo.repo,
            path: CONFIG_PATH + repoPath,
            ref: context.sha
        });
        return Buffer.from(response.data.content, response.data.encoding).toString();
    });
}
function getLabel(client, configurationPath, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const configurationContent = yield fetchContent(client, configurationPath, context);
        // loads (hopefully) a `{[label:string]: string | StringOrMatchConfig[]}`, but is `any`:
        const configObject = js_yaml_1.default.load(configurationContent);
        // transform `any` => `Map<string,StringOrMatchConfig[]>` or throw if yaml is malformed:
        return parseConfig(configObject);
    });
}
exports.getLabel = getLabel;
function parseConfig(content) {
    return Object.entries(content).reduce((entries, [label, object]) => {
        const headPattern = object.head ||
            (typeof object === 'string' || Array.isArray(object)
                ? object
                : undefined);
        const basePattern = object.base;
        if (headPattern || basePattern) {
            entries.push({ label, head: headPattern, base: basePattern });
        }
        else {
            throw new Error('config.yml has invalid structure.');
        }
        return entries;
    }, []);
}

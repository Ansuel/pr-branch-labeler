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
Object.defineProperty(exports, "__esModule", { value: true });
exports.emptyConfigFixture = exports.configFixture = void 0;
const core = __importStar(require("@actions/core"));
const fs_1 = require("fs");
require("jest-extended");
// Dump core messaging to console so that --silent works
jest.spyOn(core, 'debug').mockImplementation(console.debug);
jest.spyOn(core, 'info').mockImplementation(console.info);
jest.spyOn(core, 'error').mockImplementation(console.error);
jest.spyOn(core, 'warning').mockImplementation(console.warn);
function encodeContent(content) {
    return Buffer.from(content).toString("base64");
}
function configFixture(fileName = "config.yml") {
    return {
        type: "file",
        encoding: "base64",
        name: fileName,
        path: `.github/${fileName}`,
        content: encodeContent((0, fs_1.readFileSync)(`./__tests__/fixtures/${fileName}`))
    };
}
exports.configFixture = configFixture;
function emptyConfigFixture(fileName = "config.yml") {
    return {
        type: "file",
        encoding: "base64",
        name: fileName,
        path: `.github/${fileName}`,
        content: undefined
    };
}
exports.emptyConfigFixture = emptyConfigFixture;

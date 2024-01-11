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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const axios_1 = __importDefault(require("axios"));
const scryfallApiUrl = 'https://api.scryfall.com/cards/named';
function getCardData(cardName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.get(scryfallApiUrl, {
                params: {
                    fuzzy: cardName,
                },
            });
            const imageUrl = response.data.image_uris.normal;
            const scryfallUrl = response.data.scryfall_uri;
            return { imageUrl, scryfallUrl };
        }
        catch (error) {
            console.error('Error fetching card data from Scryfall:', error);
            return undefined;
        }
    });
}
function insertCardMarkdown(imageUrl, cardName, scryfallUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const selection = editor.selection;
            const markdownText = `[![${cardName}](${imageUrl})](${scryfallUrl})`;
            // Replace the selected text with the clickable link and image
            editor.edit((editBuilder) => {
                editBuilder.replace(selection, markdownText);
            });
        }
        else {
            vscode.window.showErrorMessage('No active text editor');
        }
    });
}
function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.convertCardName', () => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const cardName = (_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document.getText((_b = vscode.window.activeTextEditor) === null || _b === void 0 ? void 0 : _b.selection);
        if (cardName) {
            const cardData = yield getCardData(cardName);
            if (cardData) {
                const { imageUrl, scryfallUrl } = cardData;
                yield insertCardMarkdown(imageUrl, cardName, scryfallUrl);
            }
            else {
                vscode.window.showErrorMessage('Failed to fetch card data');
            }
        }
        else {
            vscode.window.showErrorMessage('No card name selected');
        }
    }));
    context.subscriptions.push(disposable);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;

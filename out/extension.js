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
function insertCardMarkdown(imageUrl, cardName, scryfallUrl, line) {
    return __awaiter(this, void 0, void 0, function* () {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const text = `[![${cardName}](${imageUrl})](${scryfallUrl})`;
            // Get the line text and find the starting position of the card name
            const lineText = editor.document.lineAt(line).text;
            const cardNameStartPosition = lineText.indexOf(cardName);
            // Insert the new text at the end of the line, removing the original card name
            editor.edit((editBuilder) => {
                const position = new vscode.Position(line, cardNameStartPosition);
                const range = new vscode.Range(position, position.translate(0, cardName.length));
                editBuilder.replace(range, text);
            });
        }
        else {
            vscode.window.showErrorMessage('No active text editor');
        }
    });
}
function convertCardTable(selectedText) {
    return __awaiter(this, void 0, void 0, function* () {
        const lines = selectedText.split('\n');
        const cards = [];
        // Extract card information from Markdown links
        for (const line of lines) {
            const match = line.match(/\[!\[([^\]]+)\]\(([^)]+)\)\]\(([^)]+)\)/);
            if (match) {
                const [, cardName, imageUrl, scryfallUrl] = match;
                cards.push({ cardName, imageUrl, scryfallUrl });
            }
        }
        // Create a table with three columns and headers
        const tableRows = [];
        tableRows.push('| | | |');
        tableRows.push('|---|---|---|');
        for (let i = 0; i < cards.length; i += 3) {
            const row = cards
                .slice(i, i + 3)
                .map(card => `| [![${card.cardName}](${card.imageUrl})](${card.scryfallUrl})`)
                .join(' ') + ' |';
            tableRows.push(row);
        }
        const tableMarkdown = tableRows.join('\n');
        // Replace the selected text with the generated table
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const selection = editor.selection;
            editor.edit((editBuilder) => {
                editBuilder.replace(selection, tableMarkdown);
            });
        }
    });
}
function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.convertCardName', () => __awaiter(this, void 0, void 0, function* () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active text editor');
            return;
        }
        const selections = editor.selections;
        if (selections.length === 0) {
            vscode.window.showErrorMessage('No text selected');
            return;
        }
        for (const selection of selections) {
            for (let line = selection.start.line; line <= selection.end.line; line++) {
                const selectedText = editor.document.lineAt(line).text.trim();
                const cardName = selectedText;
                if (cardName) {
                    const cardData = yield getCardData(cardName);
                    if (cardData) {
                        const { imageUrl, scryfallUrl } = cardData;
                        yield insertCardMarkdown(imageUrl, cardName, scryfallUrl, line);
                    }
                    else {
                        vscode.window.showErrorMessage(`Failed to fetch card data for '${cardName}'`);
                    }
                }
            }
        }
    }));
    let convertCardTableDisposable = vscode.commands.registerCommand('extension.convertCardTable', () => __awaiter(this, void 0, void 0, function* () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active text editor');
            return;
        }
        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        if (selectedText) {
            yield convertCardTable(selectedText);
        }
        else {
            vscode.window.showErrorMessage('No text selected');
        }
    }));
    context.subscriptions.push(disposable, convertCardTableDisposable);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;

import * as vscode from 'vscode';
import axios from 'axios';

const scryfallApiUrl = 'https://api.scryfall.com/cards/named';

async function getCardImage(cardName: string): Promise<string | undefined> {
  try {
    const response = await axios.get(scryfallApiUrl, {
      params: {
        fuzzy: cardName,
      },
    });

    // Extract image URL from the response
    const imageUrl = response.data.image_uris.normal;

    return imageUrl;
  } catch (error) {
    console.error('Error fetching card data from Scryfall:', error);
    return undefined;
  }
}

async function insertCardMarkdown(imageUrl: string) {
  const editor = vscode.window.activeTextEditor;

  if (editor) {
    const selection = editor.selection;
    const text = `![Card Image](${imageUrl})`;
    editor.edit((editBuilder) => {
      editBuilder.replace(selection, text);
    });
  } else {
    vscode.window.showErrorMessage('No active text editor');
  }
}

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('extension.convertCardName', async () => {
    const cardName = vscode.window.activeTextEditor?.document.getText(
      vscode.window.activeTextEditor?.selection
    );

    if (cardName) {
      const imageUrl = await getCardImage(cardName);
      if (imageUrl) {
        await insertCardMarkdown(imageUrl);
      } else {
        vscode.window.showErrorMessage('Failed to fetch card image');
      }
    } else {
      vscode.window.showErrorMessage('No card name selected');
    }
  });

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

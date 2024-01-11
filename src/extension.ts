import * as vscode from 'vscode';
import axios from 'axios';

const scryfallApiUrl = 'https://api.scryfall.com/cards/named';

async function getCardData(cardName: string): Promise<{ imageUrl: string; scryfallUrl: string } | undefined> {
  try {
    const response = await axios.get(scryfallApiUrl, {
      params: {
        fuzzy: cardName,
      },
    });

    const imageUrl = response.data.image_uris.normal;
    const scryfallUrl = response.data.scryfall_uri;

    return { imageUrl, scryfallUrl };
  } catch (error) {
    console.error('Error fetching card data from Scryfall:', error);
    return undefined;
  }
}

async function insertCardMarkdown(imageUrl: string, cardName: string, scryfallUrl: string) {
	const editor = vscode.window.activeTextEditor;
  
	if (editor) {
	  const selection = editor.selection;
	  const markdownText = `[![${cardName}](${imageUrl})](${scryfallUrl})`;
  
	  // Replace the selected text with the clickable link and image
	  editor.edit((editBuilder) => {
		editBuilder.replace(selection, markdownText);
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
      const cardData = await getCardData(cardName);
      if (cardData) {
        const { imageUrl, scryfallUrl } = cardData;
        await insertCardMarkdown(imageUrl, cardName, scryfallUrl);
      } else {
        vscode.window.showErrorMessage('Failed to fetch card data');
      }
    } else {
      vscode.window.showErrorMessage('No card name selected');
    }
  });

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

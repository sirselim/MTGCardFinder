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

async function insertCardMarkdown(imageUrl: string, cardName: string, scryfallUrl: string, line: number) {
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
  } else {
    vscode.window.showErrorMessage('No active text editor');
  }
}

async function convertCardTable(selectedText: string) {
  const lines = selectedText.split('\n');
  const cards: { cardName: string; imageUrl: string; scryfallUrl: string }[] = [];

  // Extract card information from Markdown links
  for (const line of lines) {
    const match = line.match(/\[!\[([^\]]+)\]\(([^)]+)\)\]\(([^)]+)\)/);
    if (match) {
      const [, cardName, imageUrl, scryfallUrl] = match;
      cards.push({ cardName, imageUrl, scryfallUrl });
    }
  }

  // Create a table with three columns and headers
  const tableRows: string[] = [];
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
}

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('extension.convertCardName', async () => {
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
          const cardData = await getCardData(cardName);
          if (cardData) {
            const { imageUrl, scryfallUrl } = cardData;
            await insertCardMarkdown(imageUrl, cardName, scryfallUrl, line);
          } else {
            vscode.window.showErrorMessage(`Failed to fetch card data for '${cardName}'`);
          }
        }
      }
    }
  });

  let convertCardTableDisposable = vscode.commands.registerCommand('extension.convertCardTable', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active text editor');
      return;
    }

    const selection = editor.selection;
    const selectedText = editor.document.getText(selection);

    if (selectedText) {
      await convertCardTable(selectedText);
    } else {
      vscode.window.showErrorMessage('No text selected');
    }
  });

  context.subscriptions.push(disposable, convertCardTableDisposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

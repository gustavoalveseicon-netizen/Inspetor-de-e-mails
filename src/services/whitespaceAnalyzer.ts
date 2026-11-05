import { SpacingDiagnostic } from '../types';

export function analyzeWhitespace(text: string): SpacingDiagnostic {
  if (!text) {
    return {
      hasExcessSpacing: false,
      score: 100,
      doubleSpacesCount: 0,
      excessBlankLinesCount: 0,
      trailingSpacesCount: 0,
      punctuationSpacingErrorsCount: 0,
      totalIssuesCount: 0,
      details: ['Texto vazio ou sem conteúdo.'],
      lineIssues: [],
      cleanedBody: '',
    };
  }

  const lines = text.split('\n');
  let doubleSpacesCount = 0;
  let excessBlankLinesCount = 0;
  let trailingSpacesCount = 0;
  let punctuationSpacingErrorsCount = 0;

  const lineIssues: SpacingDiagnostic['lineIssues'] = [];
  const details: string[] = [];

  // Check consecutive blank lines
  let consecutiveBlankLines = 0;
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const isBlank = rawLine.trim().length === 0;

    if (isBlank) {
      consecutiveBlankLines++;
      if (consecutiveBlankLines >= 2) {
        excessBlankLinesCount++;
        lineIssues.push({
          lineNumber: i + 1,
          issueType: 'blank-line',
          description: `Linha em branco desnecessária (linha ${i + 1})`,
          rawLine: '(linha em branco excedente)',
        });
      }
    } else {
      consecutiveBlankLines = 0;
    }

    // Check trailing whitespace
    if (/[ \t]+$/.test(rawLine)) {
      trailingSpacesCount++;
      lineIssues.push({
        lineNumber: i + 1,
        issueType: 'trailing-space',
        description: `Espaço(s) no final da linha ${i + 1}`,
        rawLine: rawLine,
      });
    }

    // Check double or multiple consecutive spaces within non-blank line
    const doubleSpacesMatches = rawLine.match(/(?<=\S)[ ]{2,}(?=\S)/g);
    if (doubleSpacesMatches) {
      const count = doubleSpacesMatches.length;
      doubleSpacesCount += count;
      lineIssues.push({
        lineNumber: i + 1,
        issueType: 'double-space',
        description: `${count} ocorrência(s) de espaços duplos/múltiplos na linha ${i + 1}`,
        rawLine: rawLine,
      });
    }

    // Check space before punctuation like "palavra , outra"
    const spaceBeforePunctuation = rawLine.match(/\w[ ]+[,;:.!?]/g);
    if (spaceBeforePunctuation) {
      punctuationSpacingErrorsCount += spaceBeforePunctuation.length;
      lineIssues.push({
        lineNumber: i + 1,
        issueType: 'punctuation-space',
        description: `Espaço indevido antes de pontuação na linha ${i + 1}`,
        rawLine: rawLine,
      });
    }

    // Check missing space after punctuation (ignoring decimals like 10,50 and URLs like site.com)
    const missingSpaceMatches = rawLine.match(/([,;!?])([A-Za-zÀ-ÿ])/g);
    if (missingSpaceMatches) {
      punctuationSpacingErrorsCount += missingSpaceMatches.length;
      lineIssues.push({
        lineNumber: i + 1,
        issueType: 'punctuation-space',
        description: `Falta de espaço após pontuação na linha ${i + 1}`,
        rawLine: rawLine,
      });
    }
  }

  const totalIssuesCount =
    doubleSpacesCount +
    excessBlankLinesCount +
    trailingSpacesCount +
    punctuationSpacingErrorsCount;

  if (doubleSpacesCount > 0) {
    details.push(`${doubleSpacesCount} espaço(s) duplos ou múltiplos entre palavras.`);
  }
  if (excessBlankLinesCount > 0) {
    details.push(`${excessBlankLinesCount} quebras de linha/linhas em branco excessivas.`);
  }
  if (trailingSpacesCount > 0) {
    details.push(`${trailingSpacesCount} linha(s) com espaços invisíveis sobrando no final.`);
  }
  if (punctuationSpacingErrorsCount > 0) {
    details.push(`${punctuationSpacingErrorsCount} problema(s) de espaçamento junto a vírgulas ou pontuações.`);
  }

  if (details.length === 0) {
    details.push('Espaçamento limpo e padronizado! Sem espaços sobrando detectados.');
  }

  // Calculate score: starts at 100, drops per issue
  const penalty = Math.min(80, totalIssuesCount * 5);
  const score = Math.max(20, 100 - penalty);

  // Generate cleaned body
  const cleanedBody = cleanExcessWhitespace(text);

  return {
    hasExcessSpacing: totalIssuesCount > 0,
    score,
    doubleSpacesCount,
    excessBlankLinesCount,
    trailingSpacesCount,
    punctuationSpacingErrorsCount,
    totalIssuesCount,
    details,
    lineIssues,
    cleanedBody,
  };
}

export function cleanExcessWhitespace(text: string): string {
  if (!text) return '';

  return (
    text
      // Normalize line breaks
      .replace(/\r\n/g, '\n')
      // Remove trailing spaces on lines
      .replace(/[ \t]+$/gm, '')
      // Remove leading spaces on lines (unless intended indentation)
      .replace(/^[ \t]+/gm, '')
      // Replace 2 or more spaces between words with a single space
      .replace(/[ ]{2,}/g, ' ')
      // Fix space before punctuation like "palavra , outra" -> "palavra, outra"
      .replace(/ +([,;:.!?])/g, '$1')
      // Add missing space after comma/semicolon if followed directly by a letter (not digits)
      .replace(/([,;])([A-Za-zÀ-ÿ])/g, '$1 $2')
      // Reduce 3 or more consecutive line breaks to max 2 (one blank line)
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

/**
 * Tokenizes text for the visual X-Ray inspector, distinguishing regular text,
 * double spaces, trailing spaces, tabs, and line breaks.
 */
export interface VisualToken {
  type: 'text' | 'excess-space' | 'trailing-space' | 'newline' | 'blank-line';
  content: string;
  original: string;
}

export function tokenizeForVisualInspection(text: string): VisualToken[][] {
  const lines = text.split('\n');
  const result: VisualToken[][] = [];

  let consecutiveBlank = 0;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const rawLine = lines[lineIndex];
    const lineTokens: VisualToken[] = [];

    if (rawLine.trim().length === 0) {
      consecutiveBlank++;
      lineTokens.push({
        type: consecutiveBlank > 1 ? 'blank-line' : 'newline',
        content: consecutiveBlank > 1 ? '[Linha em branco excedente ¶]' : '¶',
        original: rawLine,
      });
      result.push(lineTokens);
      continue;
    }

    consecutiveBlank = 0;

    // Separate trailing whitespace if present
    const trailingMatch = rawLine.match(/[ \t]+$/);
    const mainContent = trailingMatch ? rawLine.slice(0, trailingMatch.index) : rawLine;
    const trailingContent = trailingMatch ? trailingMatch[0] : '';

    // Split main content by multiple spaces
    const parts = mainContent.split(/( {2,})/g);
    for (const part of parts) {
      if (!part) continue;
      if (/^ {2,}$/.test(part)) {
        lineTokens.push({
          type: 'excess-space',
          content: '·'.repeat(part.length),
          original: part,
        });
      } else {
        lineTokens.push({
          type: 'text',
          content: part,
          original: part,
        });
      }
    }

    if (trailingContent) {
      lineTokens.push({
        type: 'trailing-space',
        content: '·'.repeat(trailingContent.length) + '⇥[fim]',
        original: trailingContent,
      });
    }

    result.push(lineTokens);
  }

  return result;
}

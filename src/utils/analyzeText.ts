import * as natural from 'natural';
import { normalizeText } from './normalizeText';

export function analyzeText(text: string) {
  const tokenizer = new natural.WordPunctTokenizer();
  const tokenizedComment = tokenizer.tokenize(normalizeText(text));
  const stemmer = natural.PorterStemmerEs;
  const analyzer = new natural.SentimentAnalyzer('Spanish', stemmer, 'afinn');
  return analyzer.getSentiment(tokenizedComment);
}

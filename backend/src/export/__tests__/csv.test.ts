import test from 'node:test';
import assert from 'node:assert/strict';
import { csvCell, toCsv } from '../csv.ts';

test('csvCell escapes quotes, commas, and newlines', () => {
  assert.equal(csvCell('hello'), 'hello');
  assert.equal(csvCell('hi, there'), '"hi, there"');
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csvCell('line\nbreak'), '"line\nbreak"');
});

test('toCsv joins rows with newlines and cells with commas', () => {
  const csv = toCsv([
    ['date', 'campaign', 'adType'],
    ['2026-06-01', 'Campaign A', 'CPM'],
    ['2026-06-02', 'Campaign, B', 'CPA'],
  ]);
  assert.equal(csv, 'date,campaign,adType\n2026-06-01,Campaign A,CPM\n2026-06-02,"Campaign, B",CPA');
});

test('toCsv handles empty input', () => {
  assert.equal(toCsv([]), '');
});

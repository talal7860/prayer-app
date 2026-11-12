import {cardColumns, todayLayout, wideScale} from '../app/lib/layout';

describe('todayLayout', () => {
  it.each([
    [320, 'phone'], // iPad Slide Over, iPhone SE
    [393, 'phone'],
    [440, 'cover'],
    [480, 'cover'], // the Duo cover screen
    [590, 'cover'], // iPad half-screen Split View
    [744, 'wide'], // iPad mini portrait
    [952, 'wide'], // the open Duo
    [1194, 'wide'],
  ] as const)('%d pt wide is %s', (w, layout) => {
    expect(todayLayout(w)).toBe(layout);
  });
});

describe('wideScale', () => {
  it('is 1 on the board size, either way round', () => {
    expect(wideScale(1194, 834)).toBe(1);
    expect(wideScale(834, 1194)).toBe(1);
  });
  it('shrinks for the open Duo', () => {
    expect(wideScale(952, 680)).toBeCloseTo(0.797, 3);
  });
  it('is capped on a 13-inch iPad', () => {
    expect(wideScale(1366, 1024)).toBeCloseTo(1.144, 3);
    expect(wideScale(2000, 1600)).toBe(1.2);
  });
});

describe('cardColumns', () => {
  it('puts six in a row on the iPad and open Duo boards', () => {
    expect(cardColumns(1194 - 80, 12)).toBe(6);
    expect(cardColumns(952 - 64, 10)).toBe(6);
  });
  it('wraps to three on an iPad in portrait', () => {
    expect(cardColumns(834 - 80, 12)).toBe(3);
  });
});

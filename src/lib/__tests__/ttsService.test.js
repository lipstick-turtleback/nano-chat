import { isTTSReady, isTTSLoading } from '../services/ttsService';

describe('ttsService', () => {
  it('reports not ready initially', () => {
    expect(isTTSReady()).toBe(false);
  });

  it('reports not loading initially', () => {
    expect(isTTSLoading()).toBe(false);
  });
});

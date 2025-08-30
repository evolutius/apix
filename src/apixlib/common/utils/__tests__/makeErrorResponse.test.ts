import { makeErrorResponse } from '../makeErrorResponse';

describe('Verify correct error object is returned', () => {
  test('makeErrorResponse', () => {
    const message = 'This is an error message';
    const response = makeErrorResponse('someId', message);
    expect(response.success).toBe(false);
    expect(response.message).toBe(message); // Deprecated, will be removed in v3.0.0
    expect(response.error).toEqual({
      id: 'someId',
      message: message
    });
  });
});

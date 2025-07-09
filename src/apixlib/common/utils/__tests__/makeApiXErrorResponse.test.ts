import { makeApiXErrorResponse } from '../makeApiXErrorResponse';

describe('Verify correct error object is returned', () => {
  test('makeApiXErrorMessage', () => {
    const message = 'This is an error message';
    const response = makeApiXErrorResponse('someId', message);
    expect(response.success).toBe(false);
    expect(response.message).toBe(message); // Deprecated, will be removed in v3.0.0
    expect(response.error).toEqual({
      id: 'someId',
      message: message
    });
  });
});

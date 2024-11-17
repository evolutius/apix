import {makeApiXErrorResponse} from '../makeApiXErrorResponse';

describe('Verify correct error object is returned', () => {
  test('makeApiXErrorMessage', () => {
    const message = 'This is an error message';
    const response = makeApiXErrorResponse(message);
    expect(response.success).toBe(false);
    expect(response.message).toBe(message);
  });
});

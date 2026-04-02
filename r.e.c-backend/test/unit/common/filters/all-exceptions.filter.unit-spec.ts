import { AllExceptionsFilter } from '../../../../src/common/filters/all-exceptions.filter';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockResponse: Record<string, jest.Mock>;
  let mockRequest: Record<string, any>;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockRequest = {
      method: 'GET',
      url: '/test',
      headers: {},
    };
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as any;
  });

  it('handles HttpException with string response', () => {
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);
    filter.catch(exception, mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        correlationId: expect.any(String),
      }),
    );
  });

  it('handles HttpException with object response', () => {
    const exception = new HttpException(
      { message: 'Validation failed', errors: ['field required'] },
      HttpStatus.BAD_REQUEST,
    );
    filter.catch(exception, mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'Validation failed',
        correlationId: expect.any(String),
      }),
    );
  });

  it('handles unknown exceptions as 500', () => {
    const exception = new Error('Something broke');
    filter.catch(exception, mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Error interno del servidor',
        correlationId: expect.any(String),
      }),
    );
  });

  it('uses x-correlation-id header when present', () => {
    mockRequest.headers['x-correlation-id'] = 'custom-id-123';
    const exception = new HttpException('Bad', 400);
    filter.catch(exception, mockHost);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationId: 'custom-id-123',
      }),
    );
  });

  it('handles non-Error exceptions', () => {
    filter.catch('string error', mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Error interno del servidor',
      }),
    );
  });
});

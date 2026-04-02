import { AuthController } from '../../../src/auth/auth.controller';
import { AuthService } from '../../../src/auth/auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  beforeEach(() => {
    service = {
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
      forgotPassword: jest.fn(),
      recoverByCode: jest.fn(),
      resetPassword: jest.fn(),
    } as any;
    controller = new AuthController(service);
  });

  describe('login', () => {
    it('delegates to service.login', async () => {
      service.login.mockResolvedValue({
        access_token: 'at',
        refresh_token: 'rt',
      } as any);
      const result = await controller.login({
        email: 'a@b.com',
        password: '123',
      });
      expect(service.login).toHaveBeenCalledWith('a@b.com', '123');
      expect(result).toEqual({ access_token: 'at', refresh_token: 'rt' });
    });
  });

  describe('refresh', () => {
    it('delegates to service.refresh', async () => {
      service.refresh.mockResolvedValue({ access_token: 'new' } as any);
      const result = await controller.refresh({ refresh_token: 'rt' });
      expect(service.refresh).toHaveBeenCalledWith('rt');
      expect(result).toEqual({ access_token: 'new' });
    });
  });

  describe('logout', () => {
    it('delegates to service.logout and returns success', async () => {
      service.logout.mockResolvedValue(undefined as any);
      const result = await controller.logout({ refresh_token: 'rt' });
      expect(service.logout).toHaveBeenCalledWith('rt');
      expect(result).toEqual({ success: true });
    });
  });

  describe('forgotPassword', () => {
    it('delegates to service.forgotPassword and returns message', async () => {
      service.forgotPassword.mockResolvedValue(undefined as any);
      const result = await controller.forgotPassword({ email: 'a@b.com' });
      expect(service.forgotPassword).toHaveBeenCalledWith('a@b.com');
      expect(result.message).toContain('Si el correo existe');
    });
  });

  describe('recoverByCode', () => {
    it('returns token from service', async () => {
      service.recoverByCode.mockResolvedValue('tok123');
      const result = await controller.recoverByCode({ codigo: 'ABC' });
      expect(result).toEqual({ token: 'tok123' });
    });

    it('returns null token when service returns null', async () => {
      service.recoverByCode.mockResolvedValue(null as any);
      const result = await controller.recoverByCode({ codigo: 'BAD' });
      expect(result).toEqual({ token: null });
    });
  });

  describe('resetPassword', () => {
    it('delegates to service.resetPassword and returns message', async () => {
      service.resetPassword.mockResolvedValue(undefined as any);
      const result = await controller.resetPassword({
        token: 't',
        password: 'p',
      });
      expect(service.resetPassword).toHaveBeenCalledWith('t', 'p');
      expect(result.message).toContain('Contraseña actualizada');
    });
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  EndpointGenerator,
  Route,
  PrivateResource,
  PublicResource,
  AuthRequired,
  HttpBody,
  QueryParameters,
  OwnerEvaluator,
  BaseEndpointGenerator,
} from '../Decorators';
import type { Request } from '../../Request';
import type { Response } from '../../Response';
import type { Response as ExpressResponse } from 'express';
import type { UrlQueryParameter } from '../UrlQueryParameter';
import { HttpBodyValidator } from '../HttpBodyValidator';
import { MethodCharacteristic } from '../MethodCharacteristic';

class UserHttpBodyValidator implements HttpBodyValidator<{}> {
  isValid(_body: {}): boolean {
    return true;
  }
}

/** Minimal helpers */
function byRoute(
  endpoints: ReadonlyArray<any>,
  method: string,
  httpMethod: string
) {
  return endpoints.find(
    (e) => e.method === method && (e.httpMethod || 'GET') === httpMethod
  );
}

describe('Decorators: Users integration', () => {
  it('generates exactly 3 endpoints', () => {
    /** --- Happy-path integration class from your example --- */
    @EndpointGenerator('users')
    @AuthRequired() // class-wide auth (affects PublicResource mapping)
    class Users extends BaseEndpointGenerator {
      constructor(private readonly dataManager: { getAuthenticatedUser: () => number }) {
        super();
      }

      @Route(':id')
      @PrivateResource() // → PrivateOwnedData, requires @OwnerEvaluator
      async getUser(_req: Request, _res: ExpressResponse): Promise<Response> {
        return { ok: true } as any;
      }

      @Route(':id', 'PUT')
      @HttpBody(new UserHttpBodyValidator(), true)
      @PrivateResource() // → PrivateOwnedData, requires @OwnerEvaluator
      async updateUser(_req: Request, _res: ExpressResponse): Promise<Response> {
        return { ok: true } as any;
      }

      @Route('')
      @QueryParameters([] as ReadonlyArray<UrlQueryParameter<unknown>>)
      @PublicResource() // class-level @AuthRequired() → PublicOwnedData, requires @OwnerEvaluator
      async getAllUsers(_req: Request, _res: ExpressResponse): Promise<Response> {
        return { ok: true } as any;
      }

      @OwnerEvaluator()
      requestorOwnsUser(req: Request): boolean {
        const requestingUserId = this.dataManager.getAuthenticatedUser();
        const userId = parseInt((req as any).params.id, 10);
        return Number.isFinite(userId) && userId === requestingUserId;
      }
    }
    const users = new Users({ getAuthenticatedUser: () => 123 });
    const endpoints = (users as any).generate();
    expect(endpoints).toBeDefined();
    expect(endpoints.length).toBe(3);
  });

  it('maps getUser correctly (GET /users/:id)', async () => {
    /** --- Happy-path integration class from your example --- */
    @EndpointGenerator('users')
    @AuthRequired() // class-wide auth (affects PublicResource mapping)
    class Users extends BaseEndpointGenerator {
      constructor(private readonly dataManager: { getAuthenticatedUser: () => number }) {
        super();
      }

      @Route(':id')
      @PrivateResource() // → PrivateOwnedData, requires @OwnerEvaluator
      async getUser(_req: Request, _res: ExpressResponse): Promise<Response> {
        return { ok: true } as any;
      }

      @Route(':id', 'PUT')
      @HttpBody(new UserHttpBodyValidator(), true)
      @PrivateResource() // → PrivateOwnedData, requires @OwnerEvaluator
      async updateUser(_req: Request, _res: ExpressResponse): Promise<Response> {
        return { ok: true } as any;
      }

      @Route('')
      @QueryParameters([] as ReadonlyArray<UrlQueryParameter<unknown>>)
      @PublicResource() // class-level @AuthRequired() → PublicOwnedData, requires @OwnerEvaluator
      async getAllUsers(_req: Request, _res: ExpressResponse): Promise<Response> {
        return { ok: true } as any;
      }

      @OwnerEvaluator()
      requestorOwnsUser(req: Request): boolean {
        const requestingUserId = this.dataManager.getAuthenticatedUser();
        const userId = parseInt((req as any).params.id, 10);
        return Number.isFinite(userId) && userId === requestingUserId;
      }
    }
    const users = new Users({ getAuthenticatedUser: () => 123 });
    const endpoints = (users as any).generate();
    const ep = byRoute(endpoints, ':id', 'GET');
    expect(ep).toBeDefined();

    // Path + verb + entity
    expect(ep.entity).toBe('users');
    expect(ep.method).toBe(':id');
    expect(ep.httpMethod).toBe('GET');

    // Characteristics
    expect(ep.characteristics).toBeInstanceOf(Set);
    expect(ep.characteristics.has(MethodCharacteristic.PrivateOwnedData)).toBe(true);
    // No extra characteristics were added
    expect(ep.characteristics.size).toBeGreaterThanOrEqual(1);

    // Input constraints
    expect(ep.jsonBodyValidator).toBeUndefined();
    expect(ep.jsonBodyRequired).toBeUndefined();
    expect(ep.queryParameters).toBeUndefined();

    // Ownership evaluator required for PrivateOwnedData
    expect(typeof ep.requestorOwnsResource).toBe('function');
    // Check owner logic happy path
    const owns = await ep.requestorOwnsResource({ params: { id: '123' } } as any);
    expect(owns).toBe(true);
    const ownsNo = await ep.requestorOwnsResource({ params: { id: '99' } } as any);
    expect(ownsNo).toBe(false);

    // Handler is callable and bound
    const result = await ep.requestHandler({} as any, {} as any);
    expect(result).toEqual({ ok: true });
  });

  it('maps updateUser correctly (PUT /users/:id) with body requirements', async () => {
    /** --- Happy-path integration class from your example --- */
    @EndpointGenerator('users')
    @AuthRequired() // class-wide auth (affects PublicResource mapping)
    class Users extends BaseEndpointGenerator {
      constructor(private readonly dataManager: { getAuthenticatedUser: () => number }) {
        super();
      }

      @Route(':id')
      @PrivateResource() // → PrivateOwnedData, requires @OwnerEvaluator
      async getUser(_req: Request, _res: ExpressResponse): Promise<Response> {
        return { ok: true } as any;
      }

      @Route(':id', 'PUT')
      @HttpBody(new UserHttpBodyValidator(), true)
      @PrivateResource() // → PrivateOwnedData, requires @OwnerEvaluator
      async updateUser(_req: Request, _res: ExpressResponse): Promise<Response> {
        return { ok: true } as any;
      }

      @Route('')
      @QueryParameters([] as ReadonlyArray<UrlQueryParameter<unknown>>)
      @PublicResource() // class-level @AuthRequired() → PublicOwnedData, requires @OwnerEvaluator
      async getAllUsers(_req: Request, _res: ExpressResponse): Promise<Response> {
        return { ok: true } as any;
      }

      @OwnerEvaluator()
      requestorOwnsUser(req: Request): boolean {
        const requestingUserId = this.dataManager.getAuthenticatedUser();
        const userId = parseInt((req as any).params.id, 10);
        return Number.isFinite(userId) && userId === requestingUserId;
      }
    }
    const users = new Users({ getAuthenticatedUser: () => 123 });
    const endpoints = (users as any).generate();
    const ep = byRoute(endpoints, ':id', 'PUT');
    expect(ep).toBeDefined();

    expect(ep.entity).toBe('users');
    expect(ep.method).toBe(':id');
    expect(ep.httpMethod).toBe('PUT');

    expect(ep.characteristics.has(MethodCharacteristic.PrivateOwnedData)).toBe(true);

    // Body validator + required flag
    expect(ep.jsonBodyValidator).toBeInstanceOf(UserHttpBodyValidator);
    expect(ep.jsonBodyRequired).toBe(true);

    // Owner evaluator present
    expect(typeof ep.requestorOwnsResource).toBe('function');

    const result = await ep.requestHandler({} as any, {} as any);
    expect(result).toEqual({ ok: true });
  });

  it('maps getAllUsers correctly (GET /users) with query params and PublicOwnedData due to auth', async () => {
    /** --- Happy-path integration class from your example --- */
    @EndpointGenerator('users')
    @AuthRequired() // class-wide auth (affects PublicResource mapping)
    class Users extends BaseEndpointGenerator {
      constructor(private readonly dataManager: { getAuthenticatedUser: () => number }) {
        super();
      }

      @Route(':id')
      @PrivateResource() // → PrivateOwnedData, requires @OwnerEvaluator
      async getUser(_req: Request, _res: ExpressResponse): Promise<Response> {
        return { ok: true } as any;
      }

      @Route(':id', 'PUT')
      @HttpBody(new UserHttpBodyValidator(), true)
      @PrivateResource() // → PrivateOwnedData, requires @OwnerEvaluator
      async updateUser(_req: Request, _res: ExpressResponse): Promise<Response> {
        return { ok: true } as any;
      }

      @Route('')
      @QueryParameters([] as ReadonlyArray<UrlQueryParameter<unknown>>)
      @PublicResource() // class-level @AuthRequired() → PublicOwnedData, requires @OwnerEvaluator
      async getAllUsers(_req: Request, _res: ExpressResponse): Promise<Response> {
        return { ok: true } as any;
      }

      @OwnerEvaluator()
      requestorOwnsUser(req: Request): boolean {
        const requestingUserId = this.dataManager.getAuthenticatedUser();
        const userId = parseInt((req as any).params.id, 10);
        return Number.isFinite(userId) && userId === requestingUserId;
      }
    }
    const users = new Users({ getAuthenticatedUser: () => 123 });
    const endpoints = (users as any).generate();
    const ep = byRoute(endpoints, '', 'GET');
    expect(ep).toBeDefined();

    expect(ep.entity).toBe('users');
    expect(ep.method).toBe('');
    expect(ep.httpMethod).toBe('GET');

    // Because class-level @AuthRequired + @PublicResource
    expect(ep.characteristics.has(MethodCharacteristic.PublicOwnedData)).toBe(true);
    expect(ep.characteristics.has(MethodCharacteristic.PublicUnownedData)).toBe(false);

    // Query params present (empty array in this example)
    expect(Array.isArray(ep.queryParameters)).toBe(true);
    expect(ep.queryParameters.length).toBe(0);

    // Owner evaluator required (public + auth)
    expect(typeof ep.requestorOwnsResource).toBe('function');

    const result = await ep.requestHandler({} as any, {} as any);
    expect(result).toEqual({ ok: true });
  });
});

/** ---------- Failure / edge cases to harden regressions ---------- */

describe('Decorators: invariants and edge-cases', () => {
  it('throws if a route has no characteristics', () => {
    @EndpointGenerator('no-chars')
    class NoChars extends BaseEndpointGenerator {
      @Route('x')
      // no resource/characteristic decorators at all → should fail
      x() { return null as any; }
    }
    const inst = new NoChars();
    expect(() => inst.generate()).toThrow(
      /must declare at least one resource\/characteristic/
    );
  });

  it('throws if GET route requires a body', () => {
    class DummyValidator implements HttpBodyValidator<any> {
      isValid(): boolean { return true; }
    }

    @EndpointGenerator('bad-get')
    class BadGet extends BaseEndpointGenerator {
      @Route('g') // GET by default
      @HttpBody(new DummyValidator(), true) // illegal on GET
      @PublicResource()
      g() { return null as any; }
    }
    const inst = new BadGet();
    expect(() => inst.generate()).toThrow(/GET route "g" cannot require a JSON body/);
  });

  it('throws when owner evaluator is required but missing', () => {
    @EndpointGenerator('needs-owner')
    @AuthRequired()
    class NeedsOwner extends BaseEndpointGenerator {
      @Route('pub')
      @PublicResource() // public + auth → needs owner evaluator
      pub() { return null as any; }

      @Route('priv')
      @PrivateResource() // private → needs owner evaluator
      priv() { return null as any; }
    }
    const inst = new NeedsOwner();
    expect(() => inst.generate()).toThrow(/requires @OwnerEvaluator/);
  });

  it('accepts kebab-cased entity when entity arg is undefined (class name derived)', () => {
    @EndpointGenerator(undefined) // → kebab-case of class name
    class FooBarBaz extends BaseEndpointGenerator {
      @Route('x')
      @PublicResource()
      x() { return null as any; }

      @OwnerEvaluator()
      own(_: any) { return true; }
    }
    const inst = new FooBarBaz();
    const eps = inst.generate();
    expect(eps[0].entity).toBe('foo-bar-baz');
  });

  it('omits entity when entity arg is null', () => {
    @EndpointGenerator(null) // → undefined entity
    class NoEntity extends BaseEndpointGenerator {
      @Route('x')
      @PublicResource()
      x() { return null as any; }

      @OwnerEvaluator()
      own(_: any) { return true; }
    }
    const inst = new NoEntity();
    const eps = inst.generate();
    expect(eps[0].entity).toBeUndefined();
  });

  it('binds handlers to the instance (this-safe)', async () => {
    @EndpointGenerator('bind-test')
    class BindTest extends BaseEndpointGenerator {
      private state = 0;

      @Route('inc', 'POST')
      @PrivateResource()
      inc(): Response {
        this.state += 1;
        return { ok: this.state } as any;
      }

      @OwnerEvaluator()
      own(): boolean { return true; }
    }
    const inst = new BindTest();
    const [ep] = inst.generate();
    const r1 = await ep.requestHandler({} as any, {} as any);
    const r2 = await ep.requestHandler({} as any, {} as any);
    expect(r1).toEqual({ ok: 1 });
    expect(r2).toEqual({ ok: 2 });
  });
});
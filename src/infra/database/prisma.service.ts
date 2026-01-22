import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { EnvService } from '../env/env.service';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private _client: PrismaClient;
  private _pool: Pool;

  constructor(private readonly envService: EnvService) {
    this._pool = new Pool({
      connectionString: this.envService.get('DATABASE_URL'),
    });
    const adapter = new PrismaPg(this._pool);
    this._client = new PrismaClient({ adapter });
  }

  get user() {
    return this._client.user;
  }

  async onModuleInit() {
    await this._client.$connect();
  }

  async onModuleDestroy() {
    await this._client.$disconnect();
    await this._pool.end();
  }
}

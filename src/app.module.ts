import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule, CacheStore } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { join } from 'path';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true
    }),
    ClientsModule.registerAsync([
      {
        name: 'BOOKING_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL')],
            queue: 'hackathonQueue_booking',
            queueOptions: {
              durable: true,
            },
            retry: {
              count: 5,
              interval: 1000,
            },
            prefetchCount: 1,
          },
        }),
        inject: [ConfigService],
      },
    ]),
    CacheModule.registerAsync({
      useFactory: async () => {
        const store = await redisStore({
          socket: {
            host: process.env.REDIS_HOST ,
            port: parseInt(process.env.REDIS_PORT) || 6379,
          },
        });
        return {
          store: store as unknown as CacheStore,
          ttl: 5 * 60000,
        };
      },
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      defaults: {
        from: '"No Reply" <no-reply@example.com>', // Default sender
      },
      template: {
        dir: join(__dirname, 'templates'), // Path to email templates
        adapter: new HandlebarsAdapter(), // Using the HandlebarsAdapter
        options: {
          strict: true,
        },
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

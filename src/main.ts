import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL],
        queue: 'otp_queue',
        queueOptions: {
          durable: true
        },
      },
    }
  )
  await app.startAllMicroservices();
  await app.listen(process.env.HEALTH_CHECK_PORT);
}
bootstrap();

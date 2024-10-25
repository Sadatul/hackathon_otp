import { Controller, Get, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { UserCredentialDto } from './dto/user.credential.dto';
import { UserOtpDto } from './dto/user.otp.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @EventPattern('send_otp')
  handleSendOTP(@Payload() userCredential: UserCredentialDto) {
    return this.appService.generateOTP(userCredential);
  }

  @MessagePattern('verify_otp')
  handleVarifyOTP( @Payload() userOtpDto: UserOtpDto) {
    return this.appService.varifyOTP(userOtpDto);
  }

  @Get('health')
  getHello() {
    return HttpStatus.OK;
  }
}

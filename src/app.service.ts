import { Inject, Injectable } from '@nestjs/common';
import { UserCredentialDto } from './dto/user.credential.dto';
import { UserOtpDto } from './dto/user.otp.dto';
import { Cache } from 'cache-manager';
import { MailerService } from '@nestjs-modules/mailer';
import { CacheDataDto } from './dto/cacheData.dto';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class AppService {
  constructor(
    @Inject('CACHE_MANAGER') private cacheManager: Cache,
    @Inject('BOOKING_SERVICE') private bookingClient: ClientProxy,
    private mailerService: MailerService,
  ) {}

  async generateOTP(userCredential: UserCredentialDto) {
    const otp = this.generateRandomOTP();
    const { id, seatId, journeyDate } = userCredential;
    const cacheData: CacheDataDto = {
      seatId,
      journeyDate,
      otp
    };
    // Store the object in cache using id as the key
    await this.cacheManager.set(id.toString(), cacheData);
    // Send OTP to the user's email
    await this.sendOtpEmail(userCredential.email, otp);
  }

  async varifyOTP(userOtpDto: UserOtpDto) {
    console.log(userOtpDto)
    const cachedData: CacheDataDto = await this.cacheManager.get(userOtpDto.id.toString());
    console.log(cachedData)
    if (cachedData && cachedData.otp === userOtpDto.otp) {
      const bookingData = {
        seatId: cachedData.seatId,
        journeyDate: cachedData.journeyDate,
        userId: userOtpDto.id,
      }
      return this.bookingClient.send({ cmd: 'create_bookingInfo_booking_service' }, bookingData);
    }
    return 'Invalid OTP';
  }

  private generateRandomOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  }

  // Method to send the OTP via email
  private async sendOtpEmail(email: string, otp: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Your OTP Code',
      template: 'otp-template',
      context: {
        otp,
        expiryMinutes: 5,
      },
    });
  }
}

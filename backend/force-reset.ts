import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PrismaService } from './src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const prisma = app.get(PrismaService);

    const email = 'usoaleatorio.2323@gmail.com';
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.log('USER_NOT_FOUND');
    } else {
        console.log('USER_FOUND. Currently hashed explicitly with NestJS bcrypt...');
        const pw = 'password123';
        const hashed = await bcrypt.hash(pw, 10);
        const updated = await prisma.user.update({
            where: { email },
            data: { password: hashed }
        });
        console.log('Updated! Try logging in now with password123.');
        console.log('New Hash:', updated.password);
    }

    await app.close();
}

bootstrap().catch(console.error);

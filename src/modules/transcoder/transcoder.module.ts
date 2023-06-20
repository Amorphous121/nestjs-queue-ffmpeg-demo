import fsSync from 'fs';
import { join } from 'path';
import fs from 'fs/promises';
import { diskStorage } from 'multer';
import { BullModule } from '@nestjs/bull';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { Module, OnApplicationBootstrap } from '@nestjs/common';

import {
  QUEUE_CONFIG_KEY,
  TRANSCODING_QUEUE,
} from 'src/constants/queue.constant';
import {
  VideoConversion,
  VideoConversionSchema,
} from './schemas/video-conversions.schema';
import { TranscoderService } from './transcoder.service';
import { TranscoderConsumer } from './transcoder.consumer';
import { TranscoderController } from './transcoder.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VideoConversion.name, schema: VideoConversionSchema },
    ]),
    BullModule.registerQueue({
      configKey: QUEUE_CONFIG_KEY,
      name: TRANSCODING_QUEUE,
    }),
    MulterModule.register({
      storage: diskStorage({
        destination: join(process.cwd(), 'src', 'public', 'files', 'input'),
        filename: function (req, file, cb) {
          cb(null, file.originalname);
        },
      }),
    }),
  ],
  providers: [TranscoderService, TranscoderConsumer],
  controllers: [TranscoderController],
})
export class TranscoderModule implements OnApplicationBootstrap {
  async onApplicationBootstrap() {
    const getFolderPath = (folderName: string) =>
      join(process.cwd(), 'src', 'public', 'files', folderName);

    for (const folder of ['input', 'output']) {
      const folderPath = getFolderPath(folder);
      if (!fsSync.existsSync(folderPath)) {
        await fs.mkdir(folderPath, {
          recursive: true,
        });
      }
    }
  }
}

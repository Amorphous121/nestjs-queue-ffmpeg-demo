import { Job } from 'bull';
import ffmpeg from 'fluent-ffmpeg';

import { ITransoderJob } from './typings/job.type';
import { ConvertVideoDto } from './dtos/convert-video.dto';
import { getLocalFileStoreLocation } from 'src/utils/file.util';

export const convertVideo = (
  path: string,
  modifications: ConvertVideoDto,
  job: Job<ITransoderJob> = null,
): Promise<{ convertedFilePath: string }> => {
  console.log(path);

  const [fileName, format] = path.split('.');
  const outputFileName = `${Date.now()}-${fileName}.${format}`;

  return new Promise((resolve, reject) => {
    let totalTime: number;

    let ffmpegCommand = ffmpeg(getLocalFileStoreLocation(path, 'input'))
      .setFfmpegPath(process.env.FFMPEG_PATH)
      .setFfprobePath(process.env.FFPROBE_PATH);

    if (modifications.seekInput) {
      ffmpegCommand = ffmpegCommand.seekInput(modifications.seekInput);
    }

    if (modifications.withoutVdeo) {
      ffmpegCommand = ffmpegCommand.withNoVideo();
    }

    if (modifications.withoutAudio) {
      ffmpegCommand = ffmpegCommand.withNoAudio();
    }

    if (modifications.outputFPS) {
      ffmpegCommand = ffmpegCommand.withOutputFPS(modifications.outputFPS);
    }

    if (modifications.frameSize) {
      ffmpegCommand = ffmpegCommand.withSize(modifications.frameSize);
    }

    if (modifications.seekOutput) {
      ffmpegCommand = ffmpegCommand.seekOutput(modifications.seekOutput);
    }

    if (modifications.format) {
      ffmpegCommand = ffmpegCommand.toFormat(modifications.format);
    }

    ffmpegCommand
      .on('start', (commandLine) => {
        console.log(`Spawned Ffmpeg with command: ${commandLine}`);
      })
      .on('codecData', (data) => {
        totalTime = parseInt(data.duration.replace(/:/g, ''));
      })
      .on('progress', (progress) => {
        const time = parseInt(progress.timemark.replace(/:/g, ''));
        const percent = Math.round((time / totalTime) * 100);

        if (job) job.progress(percent);
        else console.log(`Current progress --> ${percent}% <--`);
      })
      .on('error', (err, stdout, stderr) => {
        console.log(err, stdout, stderr);
        reject(err);
      })
      .on('end', (stdout, stderr) => {
        console.log(stdout, stderr);
        resolve({
          convertedFilePath: getLocalFileStoreLocation(
            outputFileName,
            'output',
          ),
        });
      });

    ffmpegCommand
      .output(getLocalFileStoreLocation(outputFileName, 'output'))
      .run();
  });
};

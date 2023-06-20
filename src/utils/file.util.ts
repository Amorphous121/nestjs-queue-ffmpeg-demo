import { join } from 'path';

export const getLocalFileStoreLocation = (
  file: string,
  location: 'input' | 'output',
) => join(process.cwd(), 'src', 'public', 'files', location, file);

export const VALID_VIDEO_EXTENSIONS = new RegExp(
  `^.*\.(mp4|avi|wmv|mov|flv|mkv|webm|vob|ogv|m4v|3gp|3g2|mpeg|mpg|m2v|m4v|svi|3gpp|3gpp2|mxf|roq|nsv|flv|f4v|f4p|f4a|f4b)$`,
  'gm',
);

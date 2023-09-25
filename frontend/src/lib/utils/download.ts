import { session, type Website } from '@/stores/my';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  BlobReader as BlobReaderType,
  BlobWriter as BlobWriterType,
  ZipWriter as ZipWriterType,
} from '@zip.js/zip.js';

let _BlobReader: typeof BlobReaderType;
let _BlobWriter: typeof BlobWriterType;
let _ZipWriter: typeof ZipWriterType<any>;

// download a folder to zip file
export const downloadFolder = async (website: Website, supabase: SupabaseClient) => {
  // Lazy load the imports
  if (!_BlobReader || !_BlobWriter || !_ZipWriter) {
    const { BlobReader, BlobWriter, ZipWriter } = await import('@zip.js/zip.js');

    if (!_BlobReader) {
      _BlobReader = BlobReader;
    }
    if (!_BlobWriter) {
      _BlobWriter = BlobWriter;
    }
    if (!_ZipWriter) {
      _ZipWriter = ZipWriter;
    }
  }

  const baseFolder = `${session.get()?.user?.id}/${website.domain}`;
  const { data: files, error } = await supabase.storage.from('resource').list(baseFolder);

  if (error) {
    throw error;
  }

  if (!files || !files.length) {
    throw new Error('No files to download');
  }

  const promises: Promise<any>[] = [];

  files.forEach((file) => {
    promises.push(supabase.storage.from('resource').download(`${baseFolder}/${file.name}`));
  });

  const response = await Promise.allSettled(promises);

  const downloadedFiles = response.map((result, index) => {
    if (result.status === 'fulfilled') {
      return {
        name: files[index].name,
        blob: result.value.data,
      };
    }
  });

  const zipFileWriter = new _BlobWriter('application/zip' as any);
  const zipWriter = new _ZipWriter(zipFileWriter as any, {
    bufferedWrite: true,
  });

  downloadedFiles.forEach((downloadedFile) => {
    if (downloadedFile) {
      zipWriter.add(downloadedFile.name, new _BlobReader(downloadedFile.blob));
    }
  });

  const url = URL.createObjectURL(await zipWriter.close());
  const link = document.createElement('a');

  link.href = url;
  link.setAttribute('download', `${website.domain}.zip`);

  document.body.appendChild(link);

  link.click();
  link.remove();
};

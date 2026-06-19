const fileTypeFromBuffer = jest.fn(async (buffer: Buffer) => {
  const header = buffer.subarray(0, 8).toString('utf8');
  if (header.includes('PDF')) return { ext: 'pdf', mime: 'application/pdf' };
  if (header.includes('PNG')) return { ext: 'png', mime: 'image/png' };
  if (header.includes('EXE')) return { ext: 'exe', mime: 'application/x-executable' };
  if (header.includes('ZIP')) return { ext: 'zip', mime: 'application/zip' };
  if (header.includes('DOC')) return { ext: 'doc', mime: 'application/msword' };
  if (header.includes('TEXT')) return { ext: 'txt', mime: 'text/plain' };

  if (buffer.length > 200) return { ext: 'pdf', mime: 'application/pdf' };
  return undefined;
});

export { fileTypeFromBuffer };

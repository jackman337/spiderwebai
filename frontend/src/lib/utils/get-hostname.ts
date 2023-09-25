export const getHostName = (u: string) => {
  try {
    return new URL(u).hostname;
  } catch (_) {}
};

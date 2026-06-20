const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });

export async function runRefresh(task: () => Promise<unknown>, minimumDuration = 900) {
  const startedAt = Date.now();

  try {
    await task();
  } finally {
    const remaining = minimumDuration - (Date.now() - startedAt);
    if (remaining > 0) await wait(remaining);
  }
}

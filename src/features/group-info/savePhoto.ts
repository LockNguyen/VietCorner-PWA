// Puts one picture on the phone. On an iPhone a web page cannot write to the Photos app directly, so the
// picture is handed to the phone's share sheet, which offers "Save Image". Where sharing a file is not
// possible (a computer), it downloads as a file instead.
export async function savePhoto(url: string, fileName: string): Promise<void> {
  const blob = await (await fetch(url)).blob();
  const file = new File([blob], fileName, { type: blob.type || "image/jpeg" });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
    } catch {
      // Closing the share sheet without choosing is not a failure.
    }
    return;
  }

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 10_000); // after the download has started
}

import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import sharp from "sharp";
import { POST as upload } from "@/app/api/upload/route";
import { userWithSession } from "./helpers";

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function fileRequest(bytes: Buffer, type: string, cookie?: string) {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(bytes)], { type }), "photo.bin");
  return new NextRequest("http://test.local/api/upload", {
    method: "POST",
    headers: cookie ? { cookie } : {},
    body: form,
  });
}

describe("photo upload validation", () => {
  it("requires a session", async () => {
    const res = await upload(fileRequest(Buffer.concat([PNG_MAGIC, Buffer.alloc(64)]), "image/png"));
    expect(res.status).toBe(401);
  });

  it("rejects oversized files (413)", async () => {
    const { cookie } = await userWithSession("up-big");
    const big = Buffer.concat([PNG_MAGIC, Buffer.alloc(4 * 1024 * 1024)]); // just over 4 MB
    const res = await upload(fileRequest(big, "image/png", cookie));
    expect(res.status).toBe(413);
  });

  it("rejects disallowed MIME types (415)", async () => {
    const { cookie } = await userWithSession("up-type");
    const res = await upload(fileRequest(Buffer.from("plain text"), "text/plain", cookie));
    expect(res.status).toBe(415);
  });

  it("rejects a magic-byte spoof: image/png MIME over non-PNG bytes (415)", async () => {
    const { cookie } = await userWithSession("up-spoof");
    const res = await upload(fileRequest(Buffer.from("#!/bin/sh\necho pwned"), "image/png", cookie));
    expect(res.status).toBe(415);
    expect((await res.json()).error).toMatch(/doesn't look like a photo/i);
  });

  it("accepts a real PNG and returns a server-named /uploads/ URL", async () => {
    const { cookie } = await userWithSession("up-ok");
    const png = await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    }).png().toBuffer();
    const res = await upload(fileRequest(png, "image/png", cookie));
    expect(res.status).toBe(201);
    const { url } = await res.json();
    expect(url).toMatch(/^\/uploads\/[0-9]+-[a-f0-9]+\.png$/);
  });
});

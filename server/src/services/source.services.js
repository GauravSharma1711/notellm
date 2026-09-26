import { uploadPdfToCloudinary } from "../lib/cloudinary.js";
import { scrapeWebsite } from "../lib/firecrawl.js";
import { extractPdfFromBuffer } from "../lib/pdf.js";
import { enqueueSourceProcessing } from "../lib/source-events.js";
import { fetchYoutubeTranscript } from "../lib/youtube.js";
import { createSourceRecord, deleteSourceRecord, findSourceByIdAndWorkspaceId, findSourcesByWorkspaceId, } from "../repository/source.repository.js";
import { NotFoundError } from "../types/app-error.js";
import { getWorkspaceByIdForUser } from "./workspace.services.js";
async function assertWorkspaceAccess(workspaceId, userId) {
    await getWorkspaceByIdForUser(workspaceId, userId);
}
async function createAndProcessSource(data) {
    const source = await createSourceRecord(data); //
    await enqueueSourceProcessing({
        sourceId: source.id,
        workspaceId: source.workspaceId,
    });
    return source;
}
export async function listSourcesForWorkspace(workspaceId, userId, filters = {}) {
    await assertWorkspaceAccess(workspaceId, userId);
    return findSourcesByWorkspaceId(workspaceId, filters);
}
export async function getSourceForWorkspace(workspaceId, sourceId, userId) {
    await assertWorkspaceAccess(workspaceId, userId);
    const source = await findSourceByIdAndWorkspaceId(sourceId, workspaceId);
    if (!source) {
        throw new NotFoundError("Source not found");
    }
    return source;
}
export async function deleteSourceForWorkspace(workspaceId, sourceId, userId) {
    await getSourceForWorkspace(workspaceId, sourceId, userId);
    await deleteSourceRecord(sourceId);
}
export async function bulkDeleteSourcesForWorkspace(workspaceId, userId, sourceIds) {
    await assertWorkspaceAccess(workspaceId, userId);
    for (const sourceId of sourceIds) {
        await deleteSourceForWorkspace(workspaceId, sourceId, userId);
    }
}
export async function createTextOrMarkdownSource(workspaceId, userId, input) {
    await assertWorkspaceAccess(workspaceId, userId);
    return createAndProcessSource({
        workspaceId,
        type: input.type,
        title: input.title,
        content: input.content,
        status: "PENDING",
    });
}
export async function importWebsiteSource(workspaceId, userId, input) {
    await getWorkspaceByIdForUser(workspaceId, userId);
    const scraped = await scrapeWebsite(input.url);
    return createAndProcessSource({
        workspaceId,
        type: "WEBSITE",
        title: input.title || scraped.title || input.url,
        content: scraped.markdown,
        url: scraped.sourceUrl,
        status: "PENDING",
        metadata: {
            importedFrom: scraped.sourceUrl,
        },
    });
}
export async function uploadPdfSource(workspaceId, userId, file, title) {
    await getWorkspaceByIdForUser(workspaceId, userId);
    const upload = await uploadPdfToCloudinary(file.buffer, file.originalname);
    let content = null;
    let pageCount;
    try {
        const extracted = await extractPdfFromBuffer(file.buffer);
        content = extracted.text;
        pageCount = extracted.pageCount;
    }
    catch {
        // Inngest will retry extraction from Cloudinary if upload-time parse fails.
    }
    return createAndProcessSource({
        workspaceId,
        type: "PDF",
        title: title?.trim() || file.originalname.replace(/\.pdf$/i, ""),
        content,
        status: "PENDING",
        metadata: {
            fileUrl: upload.secureUrl,
            fileName: upload.originalFilename,
            fileSize: upload.bytes,
            publicId: upload.publicId,
            resourceType: upload.resourceType,
            pageCount,
        },
    });
}
export async function importYoutubeSource(workspaceId, userId, input) {
    await getWorkspaceByIdForUser(workspaceId, userId);
    const transcript = await fetchYoutubeTranscript(input.url);
    return createAndProcessSource({
        workspaceId,
        type: "YOUTUBE",
        title: input.title || `YouTube: ${transcript.videoId}`,
        content: transcript.content,
        url: input.url,
        status: "PENDING",
        metadata: {
            videoId: transcript.videoId,
        },
    });
}

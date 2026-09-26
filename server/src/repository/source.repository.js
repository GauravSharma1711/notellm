import prisma from "../lib/db.js";
export const sourceSelect = {
    id: true,
    workspaceId: true,
    type: true,
    title: true,
    content: true,
    url: true,
    status: true,
    metadata: true,
    createdAt: true,
    updatedAt: true,
};
export function createSourceRecord(data) {
    return prisma.source.create({
        data: {
            workspaceId: data.workspaceId,
            type: data.type,
            title: data.title,
            content: data.content ?? null,
            url: data.url ?? null,
            status: data.status ?? "PENDING",
            metadata: data.metadata,
        },
        select: sourceSelect,
    });
}
export function findSourcesByWorkspaceId(workspaceId, filters = {}) {
    const where = { workspaceId };
    if (filters.type) {
        where.type = filters.type;
    }
    if (filters.status) {
        where.status = filters.status;
    }
    if (filters.q) {
        where.OR = [
            { title: { contains: filters.q, mode: "insensitive" } },
            { content: { contains: filters.q, mode: "insensitive" } },
        ];
    }
    return prisma.source.findMany({
        where,
        select: sourceSelect,
        orderBy: { createdAt: "desc" },
    });
}
export function findSourceByIdAndWorkspaceId(sourceId, workspaceId) {
    return prisma.source.findFirst({
        where: { id: sourceId, workspaceId },
        select: sourceSelect,
    });
}
export async function deleteSourceRecord(sourceId) {
    await prisma.source.delete({
        where: { id: sourceId },
    });
}
export function findSourceById(sourceId) {
    return prisma.source.findUnique({
        where: { id: sourceId },
        select: sourceSelect,
    });
}
export function updateSourceRecord(sourceId, data) {
    return prisma.source.update({
        where: { id: sourceId },
        data,
        select: sourceSelect,
    });
}

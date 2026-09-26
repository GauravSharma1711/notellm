import { bulkDeleteSourcesSchema, createSourceSchema, listSourcesQuerySchema, sourceIdParamSchema, } from "../validators/source.validator.js";
import { workspaceIdParamSchema } from "../validators/workspace.validator.js";
import { ValidationError } from "../types/app-error.js";
import { getZodFieldErrors } from "../utils/zod-error.js";
import { bulkDeleteSourcesForWorkspace, createTextOrMarkdownSource, deleteSourceForWorkspace, getSourceForWorkspace, listSourcesForWorkspace, } from "../services/source.services.js";
function parseWorkspaceId(params) {
    const parsed = workspaceIdParamSchema.safeParse(params);
    if (!parsed.success) {
        throw new ValidationError("Invalid workspace id", getZodFieldErrors(parsed.error));
    }
    return parsed.data;
}
function parseSourceParams(params) {
    const parsed = sourceIdParamSchema.safeParse(params);
    if (!parsed.success) {
        throw new ValidationError("Invalid source id", getZodFieldErrors(parsed.error));
    }
    return parsed.data;
}
function parseListQuery(query) {
    const parsed = listSourcesQuerySchema.safeParse(query);
    if (!parsed.success) {
        throw new ValidationError("Invalid query parameters", getZodFieldErrors(parsed.error));
    }
    return parsed.data;
}
function parseCreateBody(body) {
    const parsed = createSourceSchema.safeParse(body);
    if (!parsed.success) {
        throw new ValidationError("Validation failed", getZodFieldErrors(parsed.error));
    }
    return parsed.data;
}
function parseBulkDeleteBody(body) {
    const parsed = bulkDeleteSourcesSchema.safeParse(body);
    if (!parsed.success) {
        throw new ValidationError("Validation failed", getZodFieldErrors(parsed.error));
    }
    return parsed.data;
}
export async function listSources(req, res) {
    const { workspaceId } = parseWorkspaceId(req.params);
    const sources = await listSourcesForWorkspace(workspaceId, res.locals.session.user.id, parseListQuery(req.query));
    res.json(sources);
}
export async function getSource(req, res) {
    const { workspaceId, sourceId } = parseSourceParams(req.params);
    const source = await getSourceForWorkspace(workspaceId, sourceId, res.locals.session.user.id);
    res.json(source);
}
export async function createSource(req, res) {
    const { workspaceId } = parseWorkspaceId(req.params);
    const source = await createTextOrMarkdownSource(workspaceId, res.locals.session.user.id, parseCreateBody(req.body));
    res.status(201).json(source);
}
export async function deleteSource(req, res) {
    const { workspaceId, sourceId } = parseSourceParams(req.params);
    await deleteSourceForWorkspace(workspaceId, sourceId, res.locals.session.user.id);
    res.status(204).send();
}
export async function bulkDeleteSources(req, res) {
    const { workspaceId } = parseWorkspaceId(req.params);
    const input = parseBulkDeleteBody(req.body);
    await bulkDeleteSourcesForWorkspace(workspaceId, res.locals.session.user.id, input.sourceIds);
    res.status(204).send();
}

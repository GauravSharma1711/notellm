import { inngest } from "../inngest/client.js";
export async function enqueueConversationSummarize(input) {
    await inngest.send({
        name: "conversation/summarize",
        data: input,
    });
}

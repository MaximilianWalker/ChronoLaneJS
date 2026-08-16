import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

export const markdownRemarkPlugins = [remarkGfm];
export const markdownRehypePlugins = [rehypeRaw, rehypeSanitize, rehypeSlug];

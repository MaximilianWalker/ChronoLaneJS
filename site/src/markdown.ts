import GithubSlugger from "github-slugger";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

interface MarkdownNode {
    type: string;
    value?: string;
    alt?: string;
    depth?: number;
    children?: readonly MarkdownNode[];
}

export interface DocumentOutlineItem {
    id: string;
    label: string;
    level: 2 | 3;
}

const nodeText = (node: MarkdownNode): string => {
    if (node.type === "text" || node.type === "inlineCode") return node.value ?? "";
    if (node.type === "image") return node.alt ?? "";
    return node.children?.map(nodeText).join("") ?? "";
};

export const createDocumentOutline = (source: string): readonly DocumentOutlineItem[] => {
    const root = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .parse(source) as MarkdownNode;
    const slugger = new GithubSlugger();
    const outline: DocumentOutlineItem[] = [];

    for (const node of root.children ?? []) {
        if (node.type !== "heading" || node.depth == null) continue;

        const label = nodeText(node);
        const id = slugger.slug(label);
        if (node.depth === 2 || node.depth === 3) {
            outline.push({ id, label, level: node.depth });
        }
    }

    return outline;
};

export const markdownRemarkPlugins = [remarkGfm];
export const markdownRehypePlugins = [
    rehypeRaw,
    rehypeSanitize,
    rehypeSlug,
    rehypeHighlight
];

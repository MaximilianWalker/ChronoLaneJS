export default {
    // Forgejo is canonical; package.json points at the read-only GitHub mirror,
    // which must never receive release tags.
    repositoryUrl: "https://git.diogocrava.dev/MaximilianWalker/ChronoLaneJS.git",
    branches: ["main"],
    tagFormat: "v${version}",
    plugins: [
        ["@semantic-release/commit-analyzer", { preset: "conventionalcommits" }],
        ["@semantic-release/release-notes-generator", { preset: "conventionalcommits" }],
        "@semantic-release/npm"
    ]
};

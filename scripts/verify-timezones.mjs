import { spawnSync } from "node:child_process";

const timeZones = ["America/New_York", "Asia/Tokyo"];

for (const timeZone of timeZones) {
    const result = spawnSync(
        process.execPath,
        ["--no-warnings", "--test", "test/core/date.test.js"],
        {
            env: { ...process.env, TZ: timeZone },
            stdio: "inherit"
        }
    );

    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status ?? 1);
}

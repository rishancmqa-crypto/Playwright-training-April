#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const playwright = require("playwright");
const playwrightCoreRoot = path.dirname(require.resolve("playwright-core"));
const { RecorderApp } = require(path.join(playwrightCoreRoot, "lib/server/recorder/recorderApp.js"));

const forwardedArgs = process.argv.slice(2);

if (forwardedArgs.includes("--help") || forwardedArgs.includes("-h")) {
  console.log(`Launch Playwright codegen and auto-copy each newly recorded action.

Usage:
  npm run codegen:copy -- <url>
  npm run codegen:copy -- --target playwright-test https://example.com
  npm run codegen:copy -- -b chromium --output recorded.spec.ts https://example.com

Supported options:
  --target <language>
  -b, --browser <chromium|firefox|webkit>
  --device <name>
  -o, --output <file>
  --test-id-attribute <name>
`);
  process.exit(0);
}

const getOptionValue = (args, names) => {
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    for (const name of names) {
      if (value === name)
        return args[index + 1];
      if (value.startsWith(`${name}=`))
        return value.slice(name.length + 1);
    }
  }
};

const stripParsedOptions = (args, optionNamesWithValues) => {
  const parsed = new Set(optionNamesWithValues);
  const remaining = [];
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    const matchingName = optionNamesWithValues.find((name) => value === name || value.startsWith(`${name}=`));
    if (!matchingName) {
      remaining.push(value);
      continue;
    }
    if (value === matchingName)
      index += 1;
  }
  return remaining.filter((value) => !parsed.has(value));
};

const target = getOptionValue(forwardedArgs, ["--target"]) || "playwright-test";
const browserName = getOptionValue(forwardedArgs, ["-b", "--browser"]) || "chromium";
const deviceName = getOptionValue(forwardedArgs, ["--device"]);
const outputArg = getOptionValue(forwardedArgs, ["-o", "--output"]);
const testIdAttributeName = getOptionValue(forwardedArgs, ["--test-id-attribute"]);

const positionalArgs = stripParsedOptions(forwardedArgs, ["--target", "-b", "--browser", "--device", "-o", "--output", "--test-id-attribute"]);
const urlArg = positionalArgs.find((value) => !value.startsWith("-"));

const outputFile = outputArg ? path.resolve(process.cwd(), outputArg) : undefined;
const browserType = playwright[browserName];

if (!browserType) {
  console.error(`Unsupported browser "${browserName}". Use chromium, firefox, or webkit.`);
  process.exit(1);
}

if (deviceName && !playwright.devices[deviceName]) {
  console.error(`Unknown device "${deviceName}".`);
  process.exit(1);
}

const contextOptions = deviceName ? { ...playwright.devices[deviceName] } : {};
const launchOptions = { headless: false };

let browser;
let context;
let closing = false;
let lastCopiedCode = "";
let recorderAppPatched = false;

const normalizeUrl = (value) => {
  if (!value)
    return undefined;

  if (fs.existsSync(value))
    return `file://${path.resolve(value)}`;

  if (/^(https?|file|about|data):/i.test(value))
    return value;

  return `http://${value}`;
};

const runClipboardCommand = (command, args, text) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { stdio: ["pipe", "ignore", "ignore"] });
  child.on("error", reject);
  child.on("close", (code) => {
    if (code === 0) {
      resolve();
      return;
    }
    reject(new Error(`${command} exited with code ${code}`));
  });
  child.stdin.end(text);
});

const copyToClipboard = async (text) => {
  if (process.platform === "win32") {
    try {
      await runClipboardCommand(
        "powershell",
        ["-NoProfile", "-Command", "Set-Clipboard -Value ([Console]::In.ReadToEnd())"],
        text
      );
      return;
    } catch {
      await runClipboardCommand("clip", [], text);
      return;
    }
  }

  if (process.platform === "darwin") {
    await runClipboardCommand("pbcopy", [], text);
    return;
  }

  if (process.env.WAYLAND_DISPLAY) {
    await runClipboardCommand("wl-copy", [], text);
    return;
  }

  await runClipboardCommand("xclip", ["-selection", "clipboard"], text);
};

const copyRecordedCode = async (code) => {
  const trimmed = code.trim();
  if (!trimmed || trimmed === lastCopiedCode)
    return;

  await copyToClipboard(trimmed);
  lastCopiedCode = trimmed;
  console.log(`\nCopied to clipboard:\n${trimmed}\n`);
};

const isIgnorableSnippet = (snippet) => {
  if (!snippet)
    return true;

  const ignoredPatterns = [
    /^import\s+\{.*\}\s+from\s+['"]@playwright\/test['"];?$/,
    /^test\.use\(/,
    /^test\('test', async \(\{ page \}\) => \{$/,
    /^\}\);$/,
    /^const \{.*\} = require\('playwright'\);$/,
    /^\(async \(\) => \{$/,
    /^const browser = await .*\.launch/,
    /^const context = await browser\.newContext/,
    /^await context\.close\(\);$/,
    /^await browser\.close\(\);$/,
    /^\}\)\(\);$/,
    /^\/\/ -+$/
  ];

  return ignoredPatterns.some((pattern) => pattern.test(snippet));
};

const patchRecorderAppForClipboard = () => {
  if (recorderAppPatched)
    return;

  recorderAppPatched = true;
  const originalUpdateActions = RecorderApp.prototype._updateActions;

  RecorderApp.prototype._updateActions = function patchedUpdateActions(reveal) {
    originalUpdateActions.call(this, reveal);

    const preferredSource =
      this._recorderSources.find((source) => source.id === this._selectedGeneratorId) ||
      this._recorderSources.find((source) => source.id === this._primaryGeneratorId) ||
      this._recorderSources[0];

    const snippet = preferredSource?.actions?.[preferredSource.actions.length - 1]?.trim();
    if (!snippet || isIgnorableSnippet(snippet))
      return;

    void copyRecordedCode(snippet).catch((error) => {
      console.error(`Clipboard copy failed: ${error.message}`);
    });
  };
};

const closeBrowser = async () => {
  if (closing)
    return;

  closing = true;
  try {
    if (context && typeof context._disableRecorder === "function")
      await context._disableRecorder().catch(() => {});
    if (browser)
      await browser.close().catch(() => {});
  } finally {
    process.exit(0);
  }
};

const setupPageCloseHandling = (page) => {
  page.on("dialog", () => {});
  page.on("close", () => {
    if (!browser)
      return;
    const hasPage = browser.contexts().some((item) => item.pages().length > 0);
    if (!hasPage)
      void closeBrowser();
  });
};

const openPage = async (browserContext, url) => {
  let page = browserContext.pages()[0];
  if (!page)
    page = await browserContext.newPage();

  if (url)
    await page.goto(url);

  return page;
};

const main = async () => {
  browser = await browserType.launch(launchOptions);
  context = await browser.newContext(contextOptions);
  context.on("page", setupPageCloseHandling);
  for (const page of context.pages())
    setupPageCloseHandling(page);

  if (typeof context._enableRecorder !== "function") {
    throw new Error("This Playwright version does not expose recorder hooks needed for auto-copy.");
  }

  console.log("Playwright codegen launched with auto-copy enabled.");
  console.log("Each new recorded action will be copied to your clipboard.\n");

  patchRecorderAppForClipboard();

  await context._enableRecorder({
    language: target,
    launchOptions,
    contextOptions,
    device: deviceName,
    mode: "recording",
    testIdAttributeName,
    outputFile,
    handleSIGINT: false
  });

  await openPage(context, normalizeUrl(urlArg));

  browser.on("disconnected", () => {
    if (!closing)
      process.exit(0);
  });
};

process.on("SIGINT", () => {
  void closeBrowser();
});

process.on("SIGTERM", () => {
  void closeBrowser();
});

main().catch(async (error) => {
  console.error(`Failed to launch Playwright codegen: ${error.message}`);
  if (browser)
    await browser.close().catch(() => {});
  process.exit(1);
});
